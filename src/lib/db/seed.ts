import { db } from "./index";
import { seedIncidents } from "./schema";
import fs from "fs";
import path from "path";
import { generateDeterministicEmbedding } from "./vector-utils";

async function seed() {
  console.log("Starting database seeding...");
  
  try {
    const seedFilePath = path.join(process.cwd(), "seed", "incidents.json");
    if (!fs.existsSync(seedFilePath)) {
      throw new Error(`Seed data file not found at ${seedFilePath}`);
    }
    
    const rawData = fs.readFileSync(seedFilePath, "utf-8");
    const incidentsList = JSON.parse(rawData);
    
    // Clear existing seed data
    console.log("Clearing existing seed incidents...");
    await db.delete(seedIncidents);
    
    console.log(`Seeding ${incidentsList.length} incidents...`);
    
    for (const incident of incidentsList) {
      const embedding = generateDeterministicEmbedding(incident.title + " " + incident.exceptionType + " " + incident.fullLog);
      
      await db.insert(seedIncidents).values({
        exceptionType: incident.exceptionType,
        language: incident.language,
        title: incident.title,
        fullLog: incident.fullLog,
        rootCause: incident.rootCause,
        fix: incident.fix,
        tags: incident.tags,
        embedding: embedding,
      });
      console.log(`✓ Seeded incident: "${incident.title}"`);
    }
    
    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
