-- Migration: Add timezone field to locations table
-- PR #96: Timezone support for slot generation

-- Add timezone column to locations table
ALTER TABLE "locations" ADD COLUMN "timezone" varchar(50) NOT NULL DEFAULT 'America/New_York';
--> statement-breakpoint

-- Add comment for documentation
COMMENT ON COLUMN "locations"."timezone" IS 'IANA timezone identifier (e.g., America/New_York, America/Los_Angeles)';
