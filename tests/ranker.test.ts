import { describe, it, expect } from "vitest";
import { rankCauses } from "../src/server/ranker/rankCauses";

describe("Cause Ranker", () => {
  it("should return empty array for null or non-array inputs", () => {
    // @ts-ignore
    expect(rankCauses(null)).toEqual([]);
    // @ts-ignore
    expect(rankCauses({})).toEqual([]);
  });

  it("should sort causes in descending order of confidence", () => {
    const input = [
      { cause: "Low Conf Cause", rationale: "Explanation A", confidence: 45 },
      { cause: "High Conf Cause", rationale: "Explanation B", confidence: 95 },
      { cause: "Medium Conf Cause", rationale: "Explanation C", confidence: 70 }
    ];

    const result = rankCauses(input);

    expect(result.length).toBe(3);
    expect(result[0].cause).toBe("High Conf Cause");
    expect(result[0].confidence).toBe(95);
    expect(result[1].cause).toBe("Medium Conf Cause");
    expect(result[1].confidence).toBe(70);
    expect(result[2].cause).toBe("Low Conf Cause");
    expect(result[2].confidence).toBe(45);
  });

  it("should clamp confidence scores between 0 and 100", () => {
    const input = [
      { cause: "Out of bounds high", rationale: "Explanation A", confidence: 150 },
      { cause: "Out of bounds low", rationale: "Explanation B", confidence: -20 },
      { cause: "Valid score", rationale: "Explanation C", confidence: 85 }
    ];

    const result = rankCauses(input);

    expect(result.find(r => r.cause === "Out of bounds high")?.confidence).toBe(100);
    expect(result.find(r => r.cause === "Out of bounds low")?.confidence).toBe(0);
    expect(result.find(r => r.cause === "Valid score")?.confidence).toBe(85);
  });
});
