import { z } from "zod";

export const analyzeInputSchema = z.object({
  rawLog: z.string().min(5, "Error log must be at least 5 characters long."),
  language: z.string().optional().nullable(),
});

export type AnalyzeInput = z.infer<typeof analyzeInputSchema>;

export const causeSchema = z.object({
  cause: z.string().describe("A concise summary of the potential root cause (e.g. 'Database pool exhaustion', 'Missing environment variable')"),
  rationale: z.string().describe("Detailed explanation explaining why this log indicates this cause, citing specific frames or keywords in the stack trace."),
  confidence: z.number().min(0).max(100).describe("Confidence percentage score between 0 and 100."),
});

export const diagnosisResponseSchema = z.object({
  exceptionType: z.string().describe("The parsed exception or error type (e.g., NullPointerException, TypeError)."),
  errorMessage: z.string().describe("The main error message text associated with the error."),
  rankedCauses: z.array(causeSchema).min(1).max(5).describe("A list of 1 to 5 potential causes, ranked by confidence in descending order."),
  proposedFix: z.string().describe("Proposed code fix or corrective commands. Provide markdown formatted code snippets where applicable."),
  fixRationale: z.string().describe("Why this proposed fix solves the error, referencing the key causes."),
});

export type DiagnosisResponse = z.infer<typeof diagnosisResponseSchema>;

export const feedbackInputSchema = z.object({
  diagnosisId: z.string().uuid("Invalid diagnosis ID format."),
  useful: z.boolean(),
  note: z.string().optional().nullable(),
  resolution: z.string().optional().nullable(),
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
