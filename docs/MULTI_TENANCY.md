# Multi-Tenancy Implementation Guide

This document describes the multi-tenancy architecture for the Therapy Clinic Management System.

## Overview

The system uses **PostgreSQL Row-Level Security (RLS)** to enforce tenant isolation at the database level. This approach provides:

- **Strong isolation**: Database-level enforcement prevents cross-tenant data access
- **HIPAA compliance**: Ensures PHI is isolated per tenant
- **Performance**: RLS is enforced at the query level without application overhead
- **Simplicity**: No need for complex application-level filtering

## Architecture

### Tenant Hierarchy

```
Tenant (Clinic Organization)
└── Locations (Physical clinic locations)
    ├── Users (Staff members)
    ├── Clients (Patients)
    ├── Therapists
    └── Appointments
```

### Database Schema

Every table includes a `tenant_id` column:

```typescript
tenantId: uuid('tenant_id').references(() => tenants.id).notNull();
```

### Row-Level Security Policies

All tables have RLS policies that enforce:

```sql
CREATE POLICY "tenant_isolation_policy" ON table_name
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);
```

This ensures that queries only return rows where `tenant_id` matches the current session variable.

## Usage

### Setting Tenant Context

**In API Routes:**

```typescript
import { withTenantMiddleware } from '@/middleware/tenant.middleware';

export async function GET(request: NextRequest) {
  return withTenantMiddleware(request, async (req, context) => {
    // context.tenantId is available here
    // RLS context is automatically set

    const clients = await db.select().from(clientsTable);
    // Returns only clients for this tenant

    return NextResponse.json(clients);
  });
}
```

**In Server Actions:**

```typescript
import { withTenantContext } from '@/lib/tenant-db';
import { getTenantContext } from '@/middleware/tenant.middleware';

export async function getClients() {
  const context = await getTenantContext();
  if (!context) throw new Error('Unauthorized');

  return await withTenantContext(context.tenantId, async () => {
    return await db.select().from(clientsTable);
  });
}
```

**Manual Context Setting:**

```typescript
import { setTenantContext } from '@/lib/tenant-db';

await setTenantContext(tenantId);
const clients = await db.select().from(clientsTable);
```

### Creating a New Tenant

```typescript
import { createTenant } from '@/services/tenant.service';

const tenant = await createTenant({
  name: 'Bright Futures Therapy',
  slug: 'bright-futures',
  timezone: 'America/New_York',
  maxTherapists: 50,
  maxActiveClients: 500,
});
```

### Adding Locations

```typescript
import { createLocation } from '@/services/tenant.service';

const location = await createLocation(tenantId, {
  name: 'Main Office',
  address: '123 Main St',
  city: 'Boston',
  state: 'MA',
  zipCode: '02101',
  isPrimary: true,
});
```

## Authentication Flow

1. **User logs in** via Keycloak
2. **JWT token** includes `tenant_id` claim
3. **Next-Auth session** extracts tenant ID from JWT
4. **Middleware** sets PostgreSQL session variable: `SET LOCAL app.current_tenant = <tenant_id>`
5. **All queries** are automatically filtered by RLS policies

## API Routes

### Get Current Tenant

```bash
GET /api/tenants
```

Returns the current tenant's information.

### Create Tenant (Super Admin)

```bash
POST /api/tenants
{
  "name": "Clinic Name",
  "slug": "clinic-slug",
  "timezone": "America/New_York"
}
```

### Get Locations

```bash
GET /api/tenants/locations
```

Returns all locations for the current tenant.

### Create Location (Admin)

```bash
POST /api/tenants/locations
{
  "name": "Main Office",
  "address": "123 Main St",
  "city": "Boston",
  "state": "MA",
  "zipCode": "02101"
}
```

## Security Considerations

### DO

✅ **Always set tenant context** before querying tenant-specific data
✅ **Use `withTenantContext`** for automatic context management
✅ **Validate tenant ID** format (must be a valid UUID)
✅ **Check user authorization** before tenant operations
✅ **Use RLS policies** for all tenant-isolated tables

### DON'T

❌ **Never bypass RLS** for regular operations
❌ **Never trust client-provided** tenant IDs
❌ **Never hardcode** tenant IDs
❌ **Never skip** tenant context validation
❌ **Never expose** cross-tenant data in APIs

## Testing

Run tenant isolation tests:

```bash
npm run test:integration -- tenant-isolation
```

### Manual Testing

1. **Create two test tenants**
2. **Authenticate as user in Tenant A**
3. **Verify you can only see Tenant A's data**
4. **Switch to Tenant B user**
5. **Verify you can only see Tenant B's data**

## Keycloak Configuration

Keycloak must include the `tenant_id` claim in the JWT token:

1. Create a **Protocol Mapper** in Keycloak
2. Mapper Type: **User Attribute**
3. User Attribute: `tenant_id`
4. Token Claim Name: `tenant_id`
5. Claim JSON Type: `String`

## Troubleshooting

### "No tenant context" errors

- Ensure middleware is setting tenant context
- Check that JWT includes `tenant_id` claim
- Verify session is authenticated

### Cross-tenant data leakage

- Check RLS policies are enabled: `SHOW tenant_id FROM pg_policies;`
- Verify tenant context is set: `SELECT current_setting('app.current_tenant', true);`
- Review query logs for missing WHERE clauses

### Performance issues

- Add indexes on `tenant_id` columns (already included)
- Use connection pooling
- Monitor query plans with `EXPLAIN ANALYZE`

## Migration Guide

If migrating from a non-multi-tenant system:

1. **Add `tenant_id` columns** to all tables
2. **Create default tenant** for existing data
3. **Update all records** with default tenant ID
4. **Enable RLS policies** on all tables
5. **Test thoroughly** before production

## References

- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) - Section 2.1
- [Keycloak JWT Configuration](../KEYCLOAK_SETUP.md)
