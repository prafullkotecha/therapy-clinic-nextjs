---
description: Generate and run database migrations
---

# Database Migration Workflow

Generate Drizzle migrations and apply them safely.

## Instructions

1. **Review schema changes** in `src/models/*.schema.ts`

2. **Generate migration**:
   ```bash
   npm run db:generate
   ```

3. **Review generated SQL** in `migrations/`:
   - Check for data loss (DROP COLUMN, DROP TABLE)
   - Verify indexes created on foreign keys
   - Check RLS policies included for new tables
   - Verify encrypted fields use `text` type

4. **Test migration locally**:
   ```bash
   # Backup first
   docker exec postgres17 pg_dump -U postgres therapy_clinic_dev > backup.sql

   # Run migration
   npm run db:migrate

   # Verify schema
   npm run db:studio
   ```

5. **Create migration guide** if complex:
   - Document breaking changes
   - Data migration scripts if needed
   - Rollback procedure

6. **Commit migration**:
   ```bash
   git add migrations/
   git commit -m "chore: add migration for [description]"
   ```

## RLS Policy Template

For new tables with PHI:

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation_policy ON table_name
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON table_name TO authenticated_user;
```

## Safety Checklist

- [ ] No DROP COLUMN without migration plan
- [ ] No DROP TABLE without backup
- [ ] Foreign keys have indexes
- [ ] RLS policies on PHI tables
- [ ] Migration tested locally
- [ ] Rollback procedure documented
