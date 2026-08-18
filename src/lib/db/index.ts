import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:12345678@localhost:5432/postgres";

// Singleton connection pool
let pool: Pool;
try {
  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} catch (error) {
  console.error("Failed to initialize PG Connection Pool:", error);
  pool = new Pool(); // Fallback empty pool
}

export const db = drizzle(pool, { schema });

export async function checkDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1;");
      return { success: true };
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Database connection check failed:", error);
    return { success: false, error: error.message };
  }
}
