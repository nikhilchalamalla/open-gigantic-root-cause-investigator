import React from "react";
import { db } from "../../lib/db";
import { incidents, diagnoses, feedback } from "../../lib/db/schema";
import { eq, desc } from "drizzle-orm";
import HistoryClientPage from "./HistoryClientPage";

// Force dynamic rendering to query the DB on every request (ensuring history stays updated)
export const dynamic = "force-dynamic";

export interface HistoryItem {
  id: string;
  rawLog: string;
  language: string;
  exceptionType: string;
  errorMessage: string;
  createdAt: Date;
  diagnosisId: string | null;
  rankedCauses: Array<{ cause: string; rationale: string; confidence: number }> | null;
  proposedFix: string | null;
  llmModel: string | null;
  latencyMs: number | null;
  useful: boolean | null;
  feedbackNote: string | null;
  feedbackResolution: string | null;
}

export default async function HistoryPage() {
  let historyList: HistoryItem[] = [];
  
  try {
    const rawHistory = await db
      .select({
        id: incidents.id,
        rawLog: incidents.rawLog,
        language: incidents.language,
        exceptionType: incidents.exceptionType,
        errorMessage: incidents.errorMessage,
        createdAt: incidents.createdAt,
        diagnosisId: diagnoses.id,
        rankedCauses: diagnoses.rankedCauses,
        proposedFix: diagnoses.proposedFix,
        llmModel: diagnoses.llmModel,
        latencyMs: diagnoses.latencyMs,
        useful: feedback.useful,
        feedbackNote: feedback.note,
        feedbackResolution: feedback.resolution,
      })
      .from(incidents)
      .leftJoin(diagnoses, eq(incidents.id, diagnoses.incidentId))
      .leftJoin(feedback, eq(diagnoses.id, feedback.diagnosisId))
      .orderBy(desc(incidents.createdAt));
      
    historyList = rawHistory.map(item => ({
      id: item.id,
      rawLog: item.rawLog,
      language: item.language || "Unknown",
      exceptionType: item.exceptionType || "UnknownException",
      errorMessage: item.errorMessage || "",
      createdAt: item.createdAt,
      diagnosisId: item.diagnosisId,
      rankedCauses: item.rankedCauses,
      proposedFix: item.proposedFix,
      llmModel: item.llmModel,
      latencyMs: item.latencyMs,
      useful: item.useful,
      feedbackNote: item.feedbackNote,
      feedbackResolution: item.feedbackResolution,
    }));
  } catch (error) {
    console.error("Failed to query history logs from database:", error);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Incident History Registry
        </h1>
        <p className="text-zinc-400 text-sm">
          Review past diagnostic sessions, developer feedback metrics, and search historical resolutions.
        </p>
      </div>

      <HistoryClientPage initialHistory={historyList} />
    </div>
  );
}
