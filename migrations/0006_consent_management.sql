ALTER TABLE "audit_logs"
  ADD COLUMN IF NOT EXISTS "resource_type" varchar(50) DEFAULT 'system' NOT NULL,
  ADD COLUMN IF NOT EXISTS "previous_hash" varchar(64),
  ADD COLUMN IF NOT EXISTS "record_hash" varchar(64);

CREATE INDEX IF NOT EXISTS "audit_logs_record_hash_idx" ON "audit_logs" ("record_hash");

CREATE TABLE IF NOT EXISTS "consents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "client_id" uuid NOT NULL,
  "consent_type" varchar(50) NOT NULL,
  "status" varchar(20) DEFAULT 'active' NOT NULL,
  "granted_at" timestamp DEFAULT now() NOT NULL,
  "revoked_at" timestamp,
  "expires_at" timestamp,
  "document_version" varchar(50) NOT NULL,
  "signature_hash" text NOT NULL,
  "witness_user_id" uuid,
  "revocation_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "consents" ADD CONSTRAINT "consents_tenant_id_tenants_id_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "consents" ADD CONSTRAINT "consents_client_id_clients_id_fk"
  FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "consents" ADD CONSTRAINT "consents_witness_user_id_users_id_fk"
  FOREIGN KEY ("witness_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "consents_tenant_id_idx" ON "consents" ("tenant_id");
CREATE INDEX IF NOT EXISTS "consents_client_id_idx" ON "consents" ("client_id");
CREATE INDEX IF NOT EXISTS "consents_consent_type_idx" ON "consents" ("consent_type");
CREATE INDEX IF NOT EXISTS "consents_status_idx" ON "consents" ("status");

ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_policy" ON "consents";
CREATE POLICY "tenant_isolation_policy" ON "consents"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);
