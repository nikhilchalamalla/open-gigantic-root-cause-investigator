import { NextResponse } from "next/server";
import { analyzeInputSchema } from "@/lib/zod-schema";
import { orchestrateAnalysis } from "@/server/service/analyze";
import { checkDatabaseConnection } from "@/lib/db";

export async function POST(request: Request) {
  try {
    // 1. Verify database is reachable first
    const dbCheck = await checkDatabaseConnection();
    if (!dbCheck.success) {
      return NextResponse.json(
        { 
          error: "Database Connection Error", 
          details: "Could not reach local PostgreSQL database. Please make sure the service is running.",
          originalError: dbCheck.error
        },
        { status: 500 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const validated = analyzeInputSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json(
        { 
          error: "Validation Error", 
          details: validated.error.errors.map(e => e.message).join(", ") 
        },
        { status: 400 }
      );
    }

    const { rawLog, language } = validated.data;

    // 3. Run pipeline
    const report = await orchestrateAnalysis(rawLog, language);
    
    return NextResponse.json(report, { status: 200 });
  } catch (error: any) {
    console.error("API /api/analyze failed:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        details: error.message || "An unexpected error occurred." 
      },
      { status: 500 }
    );
  }
}
