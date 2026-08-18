import OpenAI from "openai";
import { IGeneratorService } from "./index";
import { DiagnosisResponse, diagnosisResponseSchema } from "../../lib/zod-schema";
import { generateDeterministicEmbedding } from "@/lib/db/vector-utils";

export class OpenAIService implements IGeneratorService {
  private client: OpenAI | null = null;
  private apiKey: string = "";

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    const isDummyKey = !this.apiKey || this.apiKey.includes("dummy") || this.apiKey.startsWith("your-");
    
    if (!isDummyKey) {
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
  }

  async generateDiagnosis(
    rawLog: string,
    languageContext: string | null,
    parsedInfo: { exceptionType: string; errorMessage: string; topFrames: string[] },
    similarIncidents: Array<{ title: string; exceptionType: string; rootCause: string; fix: string; similarity?: number }>
  ): Promise<{ diagnosis: DiagnosisResponse; latencyMs: number; model: string }> {
    const startTime = Date.now();
    const modelName = "gpt-4o-mini";

    // If client is null (no valid key), trigger local heuristic analysis fallback
    if (!this.client) {
      console.log("No valid OpenAI API key found. Falling back to local heuristic analysis.");
      const mockDiagnosis = this.generateMockDiagnosis(rawLog, languageContext, parsedInfo, similarIncidents);
      const latencyMs = Date.now() - startTime + 500; // simulate API roundtrip latency
      return {
        diagnosis: mockDiagnosis,
        latencyMs,
        model: "Local-Heuristic-Parser (Fallback)",
      };
    }

    try {
      const prompt = `
You are an expert systems site reliability and senior software engineer.
You are tasked with diagnosing an application error log/stack trace.

Raw Error Log:
\`\`\`
${rawLog}
\`\`\`

User-Specified Language/Context: ${languageContext || "Auto-detect"}

Parsed Stack Information:
- Exception Type: ${parsedInfo.exceptionType}
- Error Message: ${parsedInfo.errorMessage}
- Top Frames: ${parsedInfo.topFrames.join(", ") || "None"}

Here are similar historical incidents retrieved from the database to guide your reasoning:
${similarIncidents.map((inc, i) => `
Incident #${i + 1}: ${inc.title} (Type: ${inc.exceptionType})
- Root Cause: ${inc.rootCause}
- Proposed Fix: ${inc.fix}
`).join("\n")}

Task:
Analyze the error log. Identify and rank 1 to 5 potential root causes (providing confidence levels and explanations citing the stack trace).
Provide a single concrete, actionable code fix or solution (with code blocks where applicable) and explain why it works.
`;

      const response = await this.client.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: "system",
            content: "You are a professional software debugger. You must analyze the error and return a structured JSON response matching the required schema.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const responseText = response.choices[0].message.content || "{}";
      const latencyMs = Date.now() - startTime;
      
      // Parse and validate using Zod
      const parsedJSON = JSON.parse(responseText);
      const validated = diagnosisResponseSchema.parse(parsedJSON);

      return {
        diagnosis: validated,
        latencyMs,
        model: modelName,
      };
    } catch (error: any) {
      console.error("OpenAI API call failed, falling back to local heuristics:", error);
      const mockDiagnosis = this.generateMockDiagnosis(rawLog, languageContext, parsedInfo, similarIncidents);
      return {
        diagnosis: mockDiagnosis,
        latencyMs: Date.now() - startTime,
        model: "Local-Heuristic-Parser (Error Fallback)",
      };
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.client) {
      // Fallback to deterministic float embedding vector
      return generateDeterministicEmbedding(text);
    }

    try {
      const response = await this.client.embeddings.create({
        model: "text-embedding-3-small",
        input: text.slice(0, 8000), // safety truncate
      });
      return response.data[0].embedding;
    } catch (error) {
      console.warn("OpenAI embedding API failed, using deterministic fallback.", error);
      return generateDeterministicEmbedding(text);
    }
  }

  /**
   * Synthesizes a realistic local diagnosis using parsed info and similar incidents
   */
  private generateMockDiagnosis(
    rawLog: string,
    languageContext: string | null,
    parsedInfo: { exceptionType: string; errorMessage: string; topFrames: string[] },
    similarIncidents: Array<{ title: string; exceptionType: string; rootCause: string; fix: string; similarity?: number }>
  ): DiagnosisResponse {
    const lang = languageContext || "application";
    const exception = parsedInfo.exceptionType;
    const msg = parsedInfo.errorMessage;

    // Use similar incident details to mock an extremely accurate response if available
    const matchingIncident = similarIncidents[0];

    const rankedCauses = [
      {
        cause: matchingIncident 
          ? matchingIncident.title 
          : `Unexpected ${exception} in ${lang} execution`,
        rationale: matchingIncident 
          ? `Matches historical incident where: ${matchingIncident.rootCause}` 
          : `The stack trace indicates a runtime exception of type '${exception}' occurred. The error message is: '${msg}'. Review the top stack frames: [${parsedInfo.topFrames.join(", ")}] for variable states and null reference checks.`,
        confidence: matchingIncident ? 90 : 75,
      },
    ];

    // Add secondary cause
    if (exception.toLowerCase().includes("null") || exception.toLowerCase().includes("undefined")) {
      rankedCauses.push({
        cause: "Uninitialized dependency or object reference",
        rationale: "A method was called on a variable that was not initialized, or whose injector bean returned null.",
        confidence: 60,
      });
    } else if (exception.toLowerCase().includes("timeout") || rawLog.toLowerCase().includes("connection")) {
      rankedCauses.push({
        cause: "Resource exhaustion or network latency",
        rationale: "The client pool is saturated, or the network handshake was terminated prematurely due to firewall blocks.",
        confidence: 65,
      });
    } else {
      rankedCauses.push({
        cause: "Incorrect parameter configuration or syntax mismatch",
        rationale: "Review input arguments or environment variable bindings related to the module.",
        confidence: 50,
      });
    }

    const proposedFix = matchingIncident 
      ? matchingIncident.fix 
      : `### Recommended Action Plan:\n\n1. Add a protective safety check or validate variables before access:\n\`\`\`javascript\nif (targetObject === null || targetObject === undefined) {\n  throw new Error('Required configuration is missing');\n}\n\`\`\`\n2. Double check environmental variables and configurations inside the module.`;

    const fixRationale = matchingIncident 
      ? `Resolves the core issue matching: "${matchingIncident.title}".` 
      : "Ensures the system does not crash or execute methods on uninitialized objects, handling failure boundaries gracefully.";

    return {
      exceptionType: exception,
      errorMessage: msg,
      rankedCauses,
      proposedFix,
      fixRationale,
    };
  }
}
