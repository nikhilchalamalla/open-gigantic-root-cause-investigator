import { db } from "@/lib/db";
import { seedIncidents } from "@/lib/db/schema";

export interface SimilarIncident {
  id: string;
  exceptionType: string;
  language: string;
  title: string;
  fullLog: string;
  rootCause: string;
  fix: string;
  tags: string[];
  similarity: number;
}

// Calculate dot product of two arrays (equals cosine similarity if vectors are normalized to length 1.0)
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }
  
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

export async function retrieveIncidents(
  queryEmbedding: number[],
  languageContext?: string | null,
  limit: number = 3
): Promise<SimilarIncident[]> {
  try {
    // 1. Fetch all seed incidents
    const incidents = await db.select().from(seedIncidents);
    
    // 2. Map and calculate similarities
    const results: SimilarIncident[] = incidents.map(inc => {
      const similarity = calculateCosineSimilarity(queryEmbedding, inc.embedding);
      return {
        id: inc.id,
        exceptionType: inc.exceptionType,
        language: inc.language,
        title: inc.title,
        fullLog: inc.fullLog,
        rootCause: inc.rootCause,
        fix: inc.fix,
        tags: inc.tags,
        similarity,
      };
    });

    // 3. Filter by language context if specified (boost matches in same language)
    let filteredResults = results;
    if (languageContext && languageContext !== "Unknown") {
      const targetLang = languageContext.toLowerCase();
      filteredResults = results.map(res => {
        if (res.language.toLowerCase() === targetLang) {
          // Boost similarity score for matching language context
          return { ...res, similarity: Math.min(1.0, res.similarity + 0.1) };
        }
        return res;
      });
    }

    // 4. Sort by similarity score in descending order
    filteredResults.sort((a, b) => b.similarity - a.similarity);

    // 5. Return top N results
    return filteredResults.slice(0, limit);
  } catch (error) {
    console.error("Failed to retrieve incidents from database:", error);
    return [];
  }
}
