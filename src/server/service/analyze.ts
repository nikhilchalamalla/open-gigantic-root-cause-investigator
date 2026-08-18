import { db } from "@/lib/db";
import { incidents, diagnoses } from "@/lib/db/schema";
import { parseErrorLog } from "../parser/parseErrorLog";
import { retrieveIncidents } from "../retriever/retrieveIncidents";
import { OpenAIService } from "../generator/openai";
import { rankCauses } from "../ranker/rankCauses";
import { DiagnosisResponse } from "../../lib/zod-schema";

const aiService = new OpenAIService();

export interface DiagnosticResult {
  incidentId: string;
  diagnosisId: string;
  parsed: {
    language: string;
    exceptionType: string;
    errorMessage: string;
    topFrames: string[];
  };
  diagnosis: {
    exceptionType: string;
    errorMessage: string;
    rankedCauses: Array<{ cause: string; rationale: string; confidence: number }>;
    proposedFix: string;
    fixRationale: string;
    model: string;
    latencyMs: number;
  };
  similarIncidents: Array<{
    title: string;
    exceptionType: string;
    language: string;
    rootCause: string;
    fix: string;
    similarity: number;
  }>;
}

export async function orchestrateAnalysis(
  rawLog: string,
  userLanguage?: string | null
): Promise<DiagnosticResult> {
  // 1. Parse the error log statically
  const parsed = parseErrorLog(rawLog);
  const activeLanguage = userLanguage || parsed.language;

  // 2. Generate embedding for semantic search
  const embeddingText = `${parsed.exceptionType} ${parsed.errorMessage} ${parsed.topFrames.join(" ")}`;
  const queryEmbedding = await aiService.generateEmbedding(embeddingText);

  // 3. Retrieve similar seed incidents from database
  const matches = await retrieveIncidents(queryEmbedding, activeLanguage, 3);
  
  // Format for prompt
  const similarIncidentsForPrompt = matches.map(m => ({
    title: m.title,
    exceptionType: m.exceptionType,
    rootCause: m.rootCause,
    fix: m.fix,
    similarity: m.similarity,
  }));

  // 4. Trigger generator to analyze and synthesize the diagnosis
  const { diagnosis, latencyMs, model } = await aiService.generateDiagnosis(
    rawLog,
    activeLanguage,
    parsed,
    similarIncidentsForPrompt
  );

  // 5. Rank the root causes
  const rankedCauses = rankCauses(diagnosis.rankedCauses);

  // 6. Save incident to database
  const [savedIncident] = await db
    .insert(incidents)
    .values({
      rawLog,
      language: activeLanguage,
      exceptionType: parsed.exceptionType,
      errorMessage: parsed.errorMessage,
      topFrames: parsed.topFrames,
      embedding: queryEmbedding,
    })
    .returning();

  // 7. Save diagnosis to database linked to the incident
  const [savedDiagnosis] = await db
    .insert(diagnoses)
    .values({
      incidentId: savedIncident.id,
      rankedCauses,
      proposedFix: diagnosis.proposedFix,
      fixRationale: diagnosis.fixRationale,
      llmModel: model,
      latencyMs,
    })
    .returning();

  // 8. Assemble and return final result
  return {
    incidentId: savedIncident.id,
    diagnosisId: savedDiagnosis.id,
    parsed: {
      language: savedIncident.language || "Unknown",
      exceptionType: savedIncident.exceptionType || "UnknownException",
      errorMessage: savedIncident.errorMessage || "",
      topFrames: savedIncident.topFrames || [],
    },
    diagnosis: {
      exceptionType: diagnosis.exceptionType,
      errorMessage: diagnosis.errorMessage,
      rankedCauses,
      proposedFix: diagnosis.proposedFix || "",
      fixRationale: diagnosis.fixRationale || "",
      model,
      latencyMs,
    },
    similarIncidents: matches.map(m => ({
      title: m.title,
      exceptionType: m.exceptionType,
      language: m.language,
      rootCause: m.rootCause,
      fix: m.fix,
      similarity: m.similarity,
    })),
  };
}
