-- Enable Row Level Security on all tenant-isolated tables
-- This migration adds RLS policies to enforce tenant isolation

-- Enable RLS on all tables with tenant_id
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "failed_login_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_needs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "therapists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "therapist_specializations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "specializations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "waitlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "progress_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "treatment_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consent_forms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
-- Each policy checks that tenant_id matches the current_setting('app.current_tenant')

-- Tenants table - users can only see their own tenant
CREATE POLICY "tenant_isolation_policy" ON "tenants"
  USING (id = current_setting('app.current_tenant', true)::uuid);

-- Locations table
CREATE POLICY "tenant_isolation_policy" ON "locations"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Users table
CREATE POLICY "tenant_isolation_policy" ON "users"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Audit logs table
CREATE POLICY "tenant_isolation_policy" ON "audit_logs"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Failed login attempts table
CREATE POLICY "tenant_isolation_policy" ON "failed_login_attempts"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Clients table
CREATE POLICY "tenant_isolation_policy" ON "clients"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Client needs table
CREATE POLICY "tenant_isolation_policy" ON "client_needs"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Therapists table
CREATE POLICY "tenant_isolation_policy" ON "therapists"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Therapist specializations table
CREATE POLICY "tenant_isolation_policy" ON "therapist_specializations"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Specializations table
CREATE POLICY "tenant_isolation_policy" ON "specializations"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Appointments table
CREATE POLICY "tenant_isolation_policy" ON "appointments"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Waitlist table
CREATE POLICY "tenant_isolation_policy" ON "waitlist"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Progress notes table
CREATE POLICY "tenant_isolation_policy" ON "progress_notes"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Treatment plans table
CREATE POLICY "tenant_isolation_policy" ON "treatment_plans"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Consent forms table
CREATE POLICY "tenant_isolation_policy" ON "consent_forms"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Documents table
CREATE POLICY "tenant_isolation_policy" ON "documents"
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);
