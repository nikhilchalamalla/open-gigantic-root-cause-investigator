import { DiagnosisResponse } from "../../lib/zod-schema";

export interface IGeneratorService {
  /**
   * Generates a structured root-cause diagnosis and proposed fix for an error log.
   * @param rawLog The full stack trace submitted by the user.
   * @param languageContext The user-specified or parsed programming language.
   * @param parsedInfo Summary parsed details (exception type, message, top stack frames).
   * @param similarIncidents List of similar seed incidents retrieved from the database.
   */
  generateDiagnosis(
    rawLog: string,
    languageContext: string | null,
    parsedInfo: { exceptionType: string; errorMessage: string; topFrames: string[] },
    similarIncidents: Array<{ title: string; exceptionType: string; rootCause: string; fix: string; similarity?: number }>
  ): Promise<{ diagnosis: DiagnosisResponse; latencyMs: number; model: string }>;

  /**
   * Generates a text embedding vector (size 1536) for semantic retrieval.
   * @param text The text to generate an embedding for.
   */
  generateEmbedding(text: string): Promise<number[]>;
}
