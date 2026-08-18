// Helper to generate a deterministic unit vector embedding of size 1536 for testing/mocking
export function generateDeterministicEmbedding(text: string): number[] {
  const vector: number[] = new Array(1536).fill(0);
  
  // Create variations based on characters in text
  for (let i = 0; i < 1536; i++) {
    let hash = 0;
    const charCode = text.charCodeAt(i % text.length) || 32;
    hash = (hash << 5) - hash + charCode + i;
    vector[i] = Math.sin(hash);
  }
  
  // Normalize vector to unit length (so dot product equals cosine similarity)
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / (magnitude || 1));
}
