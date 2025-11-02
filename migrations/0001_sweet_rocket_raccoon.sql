CREATE TABLE "failed_login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"identifier_type" varchar(50) NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text,
	"attempted_at" timestamp DEFAULT now() NOT NULL,
	"failure_reason" varchar(100),
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "failed_login_attempts" ADD CONSTRAINT "failed_login_attempts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "failed_login_attempts_tenant_id_idx" ON "failed_login_attempts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "failed_login_attempts_identifier_idx" ON "failed_login_attempts" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "failed_login_attempts_ip_address_idx" ON "failed_login_attempts" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "failed_login_attempts_attempted_at_idx" ON "failed_login_attempts" USING btree ("attempted_at");--> statement-breakpoint
CREATE INDEX "failed_login_attempts_expires_at_idx" ON "failed_login_attempts" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "failed_login_attempts_identifier_time_idx" ON "failed_login_attempts" USING btree ("identifier","attempted_at");