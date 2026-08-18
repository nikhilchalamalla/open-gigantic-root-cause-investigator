export interface Cause {
  cause: string;
  rationale: string;
  confidence: number;
}

/**
 * Sorts and sanitizes the diagnosed causes returned by the generator.
 * Ensures confidence scores are sorted in descending order and capped within 0-100 bounds.
 * @param causes The array of causes to rank.
 */
export function rankCauses(causes: Cause[]): Cause[] {
  if (!causes || !Array.isArray(causes)) {
    return [];
  }

  return causes
    .map(c => ({
      cause: c.cause ? c.cause.trim() : "Unknown Root Cause",
      rationale: c.rationale ? c.rationale.trim() : "No rationale provided.",
      confidence: Math.min(100, Math.max(0, Number(c.confidence) || 0)),
    }))
    // Sort descending by confidence
    .sort((a, b) => b.confidence - a.confidence);
}
