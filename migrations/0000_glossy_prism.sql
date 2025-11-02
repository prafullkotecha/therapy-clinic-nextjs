CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"appointment_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"duration" integer NOT NULL,
	"appointment_type" varchar(50) NOT NULL,
	"room_number" varchar(20),
	"status" varchar(20) DEFAULT 'scheduled',
	"is_recurring" boolean DEFAULT false,
	"recurrence_pattern" jsonb,
	"parent_appointment_id" uuid,
	"reminder_sent_48h" boolean DEFAULT false,
	"reminder_sent_24h" boolean DEFAULT false,
	"reminder_sent_2h" boolean DEFAULT false,
	"cancelled_at" timestamp,
	"cancelled_by" uuid,
	"cancellation_reason" varchar(100),
	"cancellation_note" text,
	"check_in_time" timestamp,
	"check_out_time" timestamp,
	"appointment_notes_encrypted" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"preferred_dates" jsonb,
	"preferred_times" jsonb,
	"priority" varchar(20) DEFAULT 'standard',
	"added_at" timestamp DEFAULT now() NOT NULL,
	"notified_at" timestamp,
	"status" varchar(20) DEFAULT 'waiting'
);
--> statement-breakpoint
CREATE TABLE "client_needs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"primary_concerns_encrypted" text,
	"behavioral_characteristics_encrypted" text,
	"sensory_considerations_encrypted" text,
	"communication_needs" varchar(50),
	"cooccurring_conditions" jsonb,
	"required_specializations" jsonb,
	"preferred_therapy_modality" varchar(20),
	"schedule_preferences" jsonb,
	"urgency_level" varchar(20) DEFAULT 'standard',
	"assessment_date" timestamp DEFAULT now() NOT NULL,
	"assessed_by" uuid,
	"next_reassessment" date
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"primary_location_id" uuid,
	"first_name_encrypted" text NOT NULL,
	"last_name_encrypted" text NOT NULL,
	"date_of_birth_encrypted" text NOT NULL,
	"ssn_encrypted" text,
	"email_encrypted" text,
	"phone_encrypted" text,
	"address_encrypted" text,
	"age_group" varchar(20),
	"preferred_language" varchar(50),
	"guardian_name_encrypted" text,
	"guardian_relationship" varchar(50),
	"guardian_phone_encrypted" text,
	"guardian_email_encrypted" text,
	"emergency_contact_name_encrypted" text,
	"emergency_contact_phone_encrypted" text,
	"emergency_contact_relationship" varchar(50),
	"insurance_provider_encrypted" text,
	"insurance_policy_number_encrypted" text,
	"insurance_group_number_encrypted" text,
	"status" varchar(20) DEFAULT 'intake',
	"intake_date" date,
	"discharge_date" date,
	"assigned_therapist_id" uuid,
	"match_score" integer,
	"match_reasoning" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "consent_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"consent_type" varchar(50) NOT NULL,
	"version" varchar(20) NOT NULL,
	"consent_given" boolean NOT NULL,
	"consent_date" date NOT NULL,
	"expiration_date" date,
	"signed_by" varchar(100),
	"signer_relationship" varchar(50),
	"digital_signature" text,
	"ip_address" varchar(45),
	"document_url" text,
	"status" varchar(20) DEFAULT 'active',
	"withdrawn_at" timestamp,
	"withdrawn_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid,
	"document_type" varchar(50) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"s3_bucket" varchar(100),
	"s3_key" text,
	"s3_version_id" varchar(255),
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp,
	"last_accessed_by" uuid,
	"is_archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"subjective_encrypted" text,
	"objective_encrypted" text,
	"assessment_encrypted" text,
	"plan_encrypted" text,
	"interventions_encrypted" text,
	"client_response_encrypted" text,
	"homework_encrypted" text,
	"session_duration" integer,
	"note_date" date NOT NULL,
	"signed_by" uuid,
	"signed_at" timestamp,
	"digital_signature" text,
	"is_locked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treatment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"diagnosis_encrypted" text,
	"goals_encrypted" text,
	"objectives_encrypted" text,
	"interventions_encrypted" text,
	"start_date" date NOT NULL,
	"review_date" date,
	"end_date" date,
	"status" varchar(20) DEFAULT 'active',
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specializations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"city" varchar(100),
	"state" varchar(2),
	"zip_code" varchar(10),
	"phone" varchar(20),
	"email" varchar(255),
	"operating_hours" jsonb,
	"is_active" boolean DEFAULT true,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"timezone" varchar(50) DEFAULT 'America/New_York',
	"locale" varchar(10) DEFAULT 'en-US',
	"logo_url" text,
	"primary_color" varchar(7) DEFAULT '#3B82F6',
	"plan" varchar(50) DEFAULT 'standard',
	"status" varchar(20) DEFAULT 'active',
	"max_locations" integer DEFAULT 5,
	"max_therapists" integer DEFAULT 50,
	"max_active_clients" integer DEFAULT 500,
	"billing_email" varchar(255),
	"subscription_start" date,
	"subscription_end" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "therapist_specializations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"specialization_id" uuid NOT NULL,
	"proficiency_level" varchar(20) NOT NULL,
	"years_experience" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"primary_location_id" uuid,
	"license_number" varchar(100),
	"license_state" varchar(2),
	"license_expiration_date" date,
	"credentials" varchar(255),
	"bio" text,
	"photo_url" text,
	"max_caseload" integer DEFAULT 25,
	"current_caseload" integer DEFAULT 0,
	"is_accepting_new_clients" boolean DEFAULT true,
	"languages" jsonb,
	"age_group_expertise" jsonb,
	"communication_expertise" jsonb,
	"availability" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"resource_id" uuid,
	"ip_address" varchar(45),
	"user_agent" text,
	"phi_accessed" boolean DEFAULT false,
	"changes" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"keycloak_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(20),
	"assigned_locations" jsonb,
	"is_active" boolean DEFAULT true,
	"is_locked" boolean DEFAULT false,
	"last_login_at" timestamp,
	"mfa_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_keycloak_id_unique" UNIQUE("keycloak_id")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_parent_appointment_id_appointments_id_fk" FOREIGN KEY ("parent_appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_needs" ADD CONSTRAINT "client_needs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_needs" ADD CONSTRAINT "client_needs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_needs" ADD CONSTRAINT "client_needs_assessed_by_users_id_fk" FOREIGN KEY ("assessed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_primary_location_id_locations_id_fk" FOREIGN KEY ("primary_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_assigned_therapist_id_therapists_id_fk" FOREIGN KEY ("assigned_therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_forms" ADD CONSTRAINT "consent_forms_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_forms" ADD CONSTRAINT "consent_forms_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_forms" ADD CONSTRAINT "consent_forms_withdrawn_by_users_id_fk" FOREIGN KEY ("withdrawn_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_last_accessed_by_users_id_fk" FOREIGN KEY ("last_accessed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_notes" ADD CONSTRAINT "progress_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_notes" ADD CONSTRAINT "progress_notes_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_notes" ADD CONSTRAINT "progress_notes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_notes" ADD CONSTRAINT "progress_notes_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_notes" ADD CONSTRAINT "progress_notes_signed_by_users_id_fk" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specializations" ADD CONSTRAINT "specializations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_specializations" ADD CONSTRAINT "therapist_specializations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_specializations" ADD CONSTRAINT "therapist_specializations_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_specializations" ADD CONSTRAINT "therapist_specializations_specialization_id_specializations_id_fk" FOREIGN KEY ("specialization_id") REFERENCES "public"."specializations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapists" ADD CONSTRAINT "therapists_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapists" ADD CONSTRAINT "therapists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapists" ADD CONSTRAINT "therapists_primary_location_id_locations_id_fk" FOREIGN KEY ("primary_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_tenant_id_idx" ON "appointments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "appointments_location_id_idx" ON "appointments" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "appointments_client_id_idx" ON "appointments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "appointments_therapist_id_idx" ON "appointments" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "appointments_appointment_date_idx" ON "appointments" USING btree ("appointment_date");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appointments_therapist_date_idx" ON "appointments" USING btree ("therapist_id","appointment_date");--> statement-breakpoint
CREATE INDEX "waitlist_tenant_id_idx" ON "waitlist" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "waitlist_client_id_idx" ON "waitlist" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "waitlist_therapist_id_idx" ON "waitlist" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "waitlist_status_idx" ON "waitlist" USING btree ("status");--> statement-breakpoint
CREATE INDEX "waitlist_priority_idx" ON "waitlist" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "client_needs_tenant_id_idx" ON "client_needs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "client_needs_client_id_idx" ON "client_needs" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_needs_urgency_level_idx" ON "client_needs" USING btree ("urgency_level");--> statement-breakpoint
CREATE INDEX "clients_tenant_id_idx" ON "clients" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "clients_primary_location_id_idx" ON "clients" USING btree ("primary_location_id");--> statement-breakpoint
CREATE INDEX "clients_assigned_therapist_id_idx" ON "clients" USING btree ("assigned_therapist_id");--> statement-breakpoint
CREATE INDEX "clients_status_idx" ON "clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "clients_age_group_idx" ON "clients" USING btree ("age_group");--> statement-breakpoint
CREATE INDEX "consent_forms_tenant_id_idx" ON "consent_forms" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "consent_forms_client_id_idx" ON "consent_forms" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "consent_forms_consent_type_idx" ON "consent_forms" USING btree ("consent_type");--> statement-breakpoint
CREATE INDEX "consent_forms_status_idx" ON "consent_forms" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_tenant_id_idx" ON "documents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "documents_client_id_idx" ON "documents" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "documents_document_type_idx" ON "documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "documents_uploaded_by_idx" ON "documents" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "documents_is_archived_idx" ON "documents" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "progress_notes_tenant_id_idx" ON "progress_notes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "progress_notes_appointment_id_idx" ON "progress_notes" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "progress_notes_client_id_idx" ON "progress_notes" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "progress_notes_therapist_id_idx" ON "progress_notes" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "progress_notes_note_date_idx" ON "progress_notes" USING btree ("note_date");--> statement-breakpoint
CREATE INDEX "treatment_plans_tenant_id_idx" ON "treatment_plans" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "treatment_plans_client_id_idx" ON "treatment_plans" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "treatment_plans_therapist_id_idx" ON "treatment_plans" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "treatment_plans_status_idx" ON "treatment_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "specializations_tenant_id_idx" ON "specializations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "specializations_category_idx" ON "specializations" USING btree ("category");--> statement-breakpoint
CREATE INDEX "specializations_is_active_idx" ON "specializations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "therapist_specializations_tenant_id_idx" ON "therapist_specializations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "therapist_specializations_therapist_id_idx" ON "therapist_specializations" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "therapist_specializations_specialization_id_idx" ON "therapist_specializations" USING btree ("specialization_id");--> statement-breakpoint
CREATE INDEX "therapists_tenant_id_idx" ON "therapists" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "therapists_user_id_idx" ON "therapists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "therapists_primary_location_id_idx" ON "therapists" USING btree ("primary_location_id");--> statement-breakpoint
CREATE INDEX "therapists_is_accepting_new_clients_idx" ON "therapists" USING btree ("is_accepting_new_clients");--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource","resource_id");--> statement-breakpoint
CREATE INDEX "audit_logs_phi_accessed_idx" ON "audit_logs" USING btree ("phi_accessed");--> statement-breakpoint
CREATE INDEX "users_tenant_id_idx" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "users_keycloak_id_idx" ON "users" USING btree ("keycloak_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");