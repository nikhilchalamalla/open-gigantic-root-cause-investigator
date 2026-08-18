import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, varchar } from "drizzle-orm/pg-core";

export const incidents = pgTable("incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  rawLog: text("raw_log").notNull(),
  language: varchar("language", { length: 50 }),
  exceptionType: varchar("exception_type", { length: 255 }),
  errorMessage: text("error_message"),
  topFrames: jsonb("top_frames").$type<string[]>(),
  embedding: jsonb("embedding").$type<number[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const diagnoses = pgTable("diagnoses", {
  id: uuid("id").defaultRandom().primaryKey(),
  incidentId: uuid("incident_id")
    .references(() => incidents.id, { onDelete: "cascade" })
    .notNull(),
  rankedCauses: jsonb("ranked_causes").$type<Array<{
    cause: string;
    rationale: string;
    confidence: number; // 0-100
  }>>().notNull(),
  proposedFix: text("proposed_fix"),
  fixRationale: text("fix_rationale"),
  llmModel: varchar("llm_model", { length: 100 }).notNull(),
  latencyMs: integer("latency_ms").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  diagnosisId: uuid("diagnosis_id")
    .references(() => diagnoses.id, { onDelete: "cascade" })
    .notNull(),
  useful: boolean("useful").notNull(),
  note: text("note"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const seedIncidents = pgTable("seed_incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  exceptionType: varchar("exception_type", { length: 255 }).notNull(),
  language: varchar("language", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  fullLog: text("full_log").notNull(),
  rootCause: text("root_cause").notNull(),
  fix: text("fix").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull(),
  embedding: jsonb("embedding").$type<number[]>().notNull(),
});
