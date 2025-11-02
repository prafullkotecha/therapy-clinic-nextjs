-- Migration: Add scheduling models (therapist_availability, sessions)
-- Issue #7: Implement Scheduling Models

-- Create therapist_availability table
CREATE TABLE "therapist_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"location_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"availability_type" varchar(20) NOT NULL,
	"reason" varchar(100),
	"notes" text,
	"is_recurring" varchar(20) DEFAULT 'none',
	"recurring_days" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create sessions table
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"session_date" date NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"duration_minutes" integer NOT NULL,
	"session_type" varchar(50) NOT NULL,
	"cpt_code" varchar(10),
	"modifier" varchar(10),
	"place_of_service" varchar(2),
	"units" integer NOT NULL,
	"billing_status" varchar(20) DEFAULT 'pending',
	"billed_amount" numeric(10, 2),
	"paid_amount" numeric(10, 2),
	"insurance_paid_amount" numeric(10, 2),
	"patient_responsibility_amount" numeric(10, 2),
	"claim_id" varchar(100),
	"claim_submitted_date" date,
	"claim_paid_date" date,
	"progress_note_completed" boolean DEFAULT false,
	"progress_note_id" uuid,
	"client_attendance" varchar(20) NOT NULL,
	"client_engagement" varchar(20),
	"goals_met" integer,
	"goals_total" integer,
	"supervisor_id" uuid,
	"supervision_type" varchar(20),
	"session_summary_encrypted" text,
	"clinical_notes_encrypted" text,
	"signed_by" uuid,
	"signed_at" timestamp,
	"is_locked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint

-- Add foreign key for appointments.parent_appointment_id (self-referencing)
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_parent_appointment_id_appointments_id_fk" FOREIGN KEY ("parent_appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Add foreign keys for therapist_availability
ALTER TABLE "therapist_availability" ADD CONSTRAINT "therapist_availability_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "therapist_availability" ADD CONSTRAINT "therapist_availability_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "therapist_availability" ADD CONSTRAINT "therapist_availability_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Add foreign keys for sessions
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_supervisor_id_therapists_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_signed_by_users_id_fk" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Create indexes for therapist_availability
CREATE INDEX "therapist_availability_tenant_id_idx" ON "therapist_availability" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "therapist_availability_therapist_id_idx" ON "therapist_availability" USING btree ("therapist_id");
--> statement-breakpoint
CREATE INDEX "therapist_availability_location_id_idx" ON "therapist_availability" USING btree ("location_id");
--> statement-breakpoint
CREATE INDEX "therapist_availability_date_range_idx" ON "therapist_availability" USING btree ("start_date","end_date");
--> statement-breakpoint
CREATE INDEX "therapist_availability_therapist_date_idx" ON "therapist_availability" USING btree ("therapist_id","start_date","end_date");
--> statement-breakpoint

-- Create indexes for sessions
CREATE INDEX "sessions_tenant_id_idx" ON "sessions" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "sessions_location_id_idx" ON "sessions" USING btree ("location_id");
--> statement-breakpoint
CREATE INDEX "sessions_appointment_id_idx" ON "sessions" USING btree ("appointment_id");
--> statement-breakpoint
CREATE INDEX "sessions_client_id_idx" ON "sessions" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX "sessions_therapist_id_idx" ON "sessions" USING btree ("therapist_id");
--> statement-breakpoint
CREATE INDEX "sessions_session_date_idx" ON "sessions" USING btree ("session_date");
--> statement-breakpoint
CREATE INDEX "sessions_billing_status_idx" ON "sessions" USING btree ("billing_status");
--> statement-breakpoint
CREATE INDEX "sessions_therapist_date_idx" ON "sessions" USING btree ("therapist_id","session_date");
--> statement-breakpoint
CREATE INDEX "sessions_client_date_idx" ON "sessions" USING btree ("client_id","session_date");
