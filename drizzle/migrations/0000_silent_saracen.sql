CREATE TABLE IF NOT EXISTS "diagnoses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"ranked_causes" jsonb NOT NULL,
	"proposed_fix" text,
	"fix_rationale" text,
	"llm_model" varchar(100) NOT NULL,
	"latency_ms" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagnosis_id" uuid NOT NULL,
	"useful" boolean NOT NULL,
	"note" text,
	"resolution" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raw_log" text NOT NULL,
	"language" varchar(50),
	"exception_type" varchar(255),
	"error_message" text,
	"top_frames" jsonb,
	"embedding" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seed_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exception_type" varchar(255) NOT NULL,
	"language" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"full_log" text NOT NULL,
	"root_cause" text NOT NULL,
	"fix" text NOT NULL,
	"tags" jsonb NOT NULL,
	"embedding" jsonb NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback" ADD CONSTRAINT "feedback_diagnosis_id_diagnoses_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."diagnoses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
