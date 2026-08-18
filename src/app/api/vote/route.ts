import { NextResponse } from "next/server";
import { feedbackInputSchema } from "@/lib/zod-schema";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { checkDatabaseConnection } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const dbCheck = await checkDatabaseConnection();
    if (!dbCheck.success) {
      return NextResponse.json(
        { error: "Database Connection Error", details: "Could not reach database." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validated = feedbackInputSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json(
        { 
          error: "Validation Error", 
          details: validated.error.errors.map(e => e.message).join(", ") 
        },
        { status: 400 }
      );
    }

    const { diagnosisId, useful, note, resolution } = validated.data;

    // Save feedback to table linked to the diagnosis
    const [savedFeedback] = await db
      .insert(feedback)
      .values({
        diagnosisId,
        useful,
        note,
        resolution,
      })
      .returning();

    return NextResponse.json(
      { 
        success: true, 
        message: "Resolution feedback submitted.",
        feedbackId: savedFeedback.id 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API /api/vote failed:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        details: error.message || "An unexpected error occurred." 
      },
      { status: 500 }
    );
  }
}
