# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Multi-tenant, HIPAA-compliant behavioral therapy clinic management system. Supports multiple clinic organizations (tenants), each with multiple locations, intelligent therapist-client matching, appointment scheduling, and comprehensive compliance infrastructure.

**Base Template:** ixartz Next.js Boilerplate
**Architecture:** Multi-tenant SaaS with tenant isolation via PostgreSQL RLS

## Tech Stack

### Core
- **Framework:** Next.js 16 (App Router), TypeScript, React 19
- **Database:** PostgreSQL 15+ (AWS RDS) with Drizzle ORM
- **Auth:** Keycloak (self-hosted, HIPAA-compliant)
- **Caching:** Redis (AWS ElastiCache)
- **Styling:** Tailwind CSS 4
- **Forms:** React Hook Form + Zod validation
- **Calendar:** FullCalendar
- **Testing:** Vitest, Playwright, Testing Library

### Infrastructure (AWS)
- **Compute:** ECS Fargate
- **Database:** RDS PostgreSQL (Multi-AZ, encrypted)
- **Cache:** ElastiCache Redis
- **Storage:** S3 (encrypted PHI documents)
- **Secrets:** KMS (encryption keys), Secrets Manager
- **Monitoring:** CloudWatch, Sentry (with BAA)

### Third-Party Services
- **Email:** SendGrid (with BAA)
- **SMS:** Twilio (with BAA)
- **Security:** Arcjet (WAF, bot detection)

## TypeScript Best Practices

**CRITICAL:** These guidelines are based on Matt Pocock's Total TypeScript (2025) and TypeScript 5.7/5.8 best practices. **NEVER** compromise type safety or use workarounds. Fix type errors correctly.

### Module Augmentation & Declaration Merging

**Rule #1: ALWAYS use `interface` for module augmentation, NEVER `type`**

```typescript
// ✅ CORRECT - Uses interface for declaration merging
declare module 'next-auth' {
  // Disable the eslint rule that prefers type over interface
  // eslint-disable-next-line ts/consistent-type-definitions
  interface Session {
    user: { roles: string[] } & DefaultSession['user'];
  }
}

// ❌ WRONG - type doesn't support declaration merging
declare module 'next-auth' {
  type Session = {  // Won't work!
    user: { roles: string[] } & DefaultSession['user'];
  };
}
```

**Why:** TypeScript's declaration merging only works with `interface`. Using `type` creates a type alias that overwrites instead of merging. This is essential for extending third-party library types.

**Rule #2: Module augmentation files must be in module scope**

```typescript
// ✅ CORRECT - Has import/export (module scope)
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session { /* ... */ }
}

// ❌ WRONG - Script scope, augmentation won't work
declare module 'next-auth' {
  interface Session { /* ... */ }
}
```

**Rule #3: Can only patch existing declarations, not add new top-level ones**

### Type Safety Principles

**1. Declare return types for top-level module functions**
```typescript
// ✅ CORRECT - Explicit return type
export async function getUser(id: string): Promise<User | null> {
  return await db.query.users.findFirst({ where: eq(users.id, id) });
}

// ❌ AVOID - Implicit return type (harder for AI/humans to understand)
export async function getUser(id: string) {
  return await db.query.users.findFirst({ where: eq(users.id, id) });
}
```

**2. Prefer `interface extends` over `type &` for performance**
```typescript
// ✅ CORRECT - Better IDE/tsc performance
interface ExtendedUser extends BaseUser {
  roles: string[];
}

// ❌ SLOWER - Intersection types are slower to resolve
type ExtendedUser = BaseUser & {
  roles: string[];
};
```

**3. Leverage type inference, minimize explicit annotations**
```typescript
// ✅ CORRECT - Let TypeScript infer
const users = await db.select().from(usersTable);  // Type is inferred

// ❌ UNNECESSARY - Redundant annotation
const users: User[] = await db.select().from(usersTable);
```

**4. Use branded types for additional type safety**
```typescript
// ✅ CORRECT - Prevents mixing string types
type ClientId = string & { readonly __brand: 'ClientId' };
type TherapistId = string & { readonly __brand: 'TherapistId' };

function getClient(id: ClientId) { /* ... */ }
getClient('123' as ClientId);  // Explicit branding required
```

**5. Understand generics placement matters**
```typescript
// ✅ CORRECT - Generic at function level allows inference
function processItems<T>(items: T[]): T[] { /* ... */ }

// ❌ WRONG - Generic at wrong level
interface Processor {
  process<T>(items: T[]): T[];  // May not infer correctly
}
```

### Common Patterns

**Assertion Functions & Type Predicates**
```typescript
// ✅ Type predicate
function isClient(user: User): user is Client {
  return user.type === 'client';
}

// ✅ Assertion function
function assertClient(user: User): asserts user is Client {
  if (user.type !== 'client') throw new Error('Not a client');
}
```

**Const Assertions for Literal Types**
```typescript
// ✅ CORRECT - Preserves literal types
const ROLES = ['admin', 'therapist', 'billing'] as const;
type Role = typeof ROLES[number];  // 'admin' | 'therapist' | 'billing'

// ❌ WRONG - Type widened to string[]
const ROLES = ['admin', 'therapist', 'billing'];
type Role = typeof ROLES[number];  // string
```

### Next-Auth / Auth.js Specific

**Known Issue:** User interface augmentation doesn't always work in callbacks (next-auth v5). Use type assertions if needed:

```typescript
// In callbacks where User augmentation fails:
async jwt({ token, account, profile }) {
  if (account && profile) {
    token.roles = ((profile as any).realm_access?.roles as string[]) || [];
  }
  return token;
}
```

### Error Handling

**NEVER use type assertions or `any` to bypass errors.** If you encounter a type error:

1. **Understand the root cause** - What is TypeScript trying to protect you from?
2. **Fix the types correctly** - Use proper type narrowing, guards, or generics
3. **Document why** - If a workaround is needed, explain in comments

```typescript
// ❌ NEVER DO THIS
const user = data as User;  // Bypassing type safety!
const result: any = await fetch();  // Losing all type information!

// ✅ DO THIS INSTEAD
const userResult = UserSchema.safeParse(data);
if (!userResult.success) throw new Error('Invalid user data');
const user = userResult.data;
```

### TypeScript 5.7/5.8 Features (2025)

- **Better error reporting:** Use `--target es2024` for latest ECMAScript features
- **Granular return type checking:** Conditional expressions in return statements checked per branch
- **Node.js ESM support:** Can now `require()` ESM modules with `--module nodenext`
- **V8 compile caching:** Faster subsequent builds in Node.js

### Resources

- [Total TypeScript](https://www.totaltypescript.com/) - Matt Pocock's comprehensive TypeScript training
- [TypeScript 5.8 Release Notes](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/)
- [Auth.js TypeScript Guide](https://authjs.dev/getting-started/typescript)

## Architecture Overview

### Multi-Tenancy Design
- **Isolation:** Row-Level Security (PostgreSQL RLS policies)
- **Tenant Context:** Extracted from Keycloak JWT, injected via middleware
- **Schema:** Shared schema, isolated data per tenant
- **Hierarchy:** Tenant → Locations → Users → Clients/Therapists/Appointments

### Key Security Features
- **Encryption:** AES-256-GCM for PHI fields (format: `keyId:iv:authTag:ciphertext`)
- **Master Keys:** Stored in AWS KMS with rotation
- **Audit Logging:** Every PHI access logged (user, resource, timestamp)
- **RBAC:** Roles: admin, therapist, billing, receptionist
- **Session Timeout:** 15 minutes (Redis-backed)

### Database Schema Patterns

**Every table includes:**
```typescript
tenantId: uuid('tenant_id').references(() => tenants.id).notNull();
```

**Encrypted PHI fields use `text` type:**
```typescript
firstName: text('first_name_encrypted').notNull();
```

**RLS policies enforce tenant isolation:**
```sql
CREATE POLICY tenant_isolation ON table_name
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

## Development Commands

### Setup
```bash
npm install                    # Install dependencies
npm run db:generate           # Generate Drizzle migrations
npm run db:migrate            # Run migrations
npm run db:seed               # Seed specializations taxonomy
```

### Development
```bash
npm run dev                   # Start dev server (localhost:3000)
npm run build                 # Production build
npm run start                 # Start production server
npm run type-check            # TypeScript check
npm run lint                  # ESLint
npm run format                # Prettier
```

### Testing
```bash
npm run test:unit             # Unit tests (Vitest)
npm run test:integration      # Integration tests
npm run test:e2e              # E2E tests (Playwright)
npm run test:coverage         # Coverage report
```

### Database
```bash
npm run db:studio             # Open Drizzle Studio
npm run db:push               # Push schema changes (dev only)
npm run db:drop               # Drop database (dev only)
```

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Public auth routes
│   ├── (dashboard)/         # Protected routes
│   │   ├── admin/           # Admin portal
│   │   │   ├── clients/     # Client management
│   │   │   ├── therapists/  # Therapist management
│   │   │   ├── appointments/# Scheduling
│   │   │   └── reports/     # Analytics
│   │   └── therapist/       # Therapist portal
│   └── api/                 # API routes
├── components/
│   ├── clients/             # Client components
│   ├── therapists/          # Therapist components
│   ├── scheduling/          # Calendar/scheduling
│   └── ui/                  # Base UI components
├── lib/
│   ├── keycloak/            # Keycloak integration
│   ├── encryption/          # PHI encryption service
│   ├── audit/               # Audit logging
│   └── matching/            # Matching algorithm
├── services/                # Business logic services
│   ├── client.service.ts
│   ├── therapist.service.ts
│   ├── appointment.service.ts
│   ├── matching.service.ts
│   └── notification.service.ts
├── models/                  # Drizzle schemas
│   ├── tenant.schema.ts     # Tenants & locations
│   ├── user.schema.ts       # Users & audit logs
│   ├── client.schema.ts     # Clients (encrypted PHI)
│   ├── therapist.schema.ts  # Therapists
│   ├── appointment.schema.ts# Appointments
│   └── ...
├── middleware/
│   ├── tenant.middleware.ts # Tenant context injection
│   ├── auth.middleware.ts   # Keycloak auth
│   ├── rbac.middleware.ts   # Permission checking
│   └── audit.middleware.ts  # Audit logging
├── utils/
│   ├── encryption.util.ts   # Encryption helpers
│   └── date.util.ts
└── validations/             # Zod schemas
```

## Key Patterns & Conventions

### Tenant Isolation

**Always include tenant context in queries:**
```typescript
// ✅ Correct
const clients = await db
  .select()
  .from(clientsTable)
  .where(eq(clientsTable.tenantId, tenantId));

// ❌ Wrong - will fail RLS policy
const clients = await db.select().from(clientsTable);
```

**Tenant middleware sets context:**
```typescript
// Extracted from Keycloak JWT
const tenantId = token.tenant_id;
await db.execute(sql`SET LOCAL app.current_tenant = ${tenantId}`);
```

### PHI Encryption

**Always encrypt PHI fields before storing:**
```typescript
import { encryptionService } from '@/lib/encryption';

const client = await db.insert(clients).values({
  tenantId,
  firstName: encryptionService.encrypt(data.firstName),
  lastName: encryptionService.encrypt(data.lastName),
  dateOfBirth: encryptionService.encrypt(data.dateOfBirth),
  // Non-PHI fields stored as-is
  ageGroup: data.ageGroup,
});
```

**Decrypt when reading:**
```typescript
const client = await getClient(clientId);
const decrypted = {
  ...client,
  firstName: encryptionService.decrypt(client.firstName),
  lastName: encryptionService.decrypt(client.lastName),
};
```

### Audit Logging

**PHI access is auto-logged via middleware, but can also log manually:**
```typescript
import { logAudit } from '@/lib/audit';

await logAudit({
  tenantId,
  userId,
  action: 'update',
  resource: 'client',
  resourceId: clientId,
  phiAccessed: true,
  changes: { field: 'status', from: 'intake', to: 'active' },
});
```

### RBAC Permission Checking

```typescript
import { checkPermission } from '@/middleware/rbac.middleware';

// Check in API route
if (!checkPermission(userRole, 'clients', 'update', clientId, userId)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Use in UI
{canUpdate && <EditButton />}
```

### Matching Algorithm

**Located in `services/matching.service.ts`:**
```typescript
const matches = await matchingService.calculateMatches(tenantId, {
  requiredSpecializations: [
    { specializationId, specializationName: 'ABA', importance: 'critical' }
  ],
  communicationNeeds: 'non-verbal',
  ageGroup: 'early_childhood',
  preferredTimes: [/* ... */],
  urgency: 'standard',
}, therapists);

// Returns top 5 matches with scores and reasoning
```

**Scoring weights:**
- Specializations: 40%
- Communication: 30%
- Availability: 15%
- Age Match: 10%
- Schedule: 5%

## Environment Variables

See `.env.example` for required variables. Key ones:

```bash
DATABASE_URL                  # PostgreSQL connection
REDIS_URL                     # Redis connection
KEYCLOAK_URL                  # Keycloak server
KEYCLOAK_CLIENT_SECRET        # From Keycloak admin
AWS_KMS_KEY_ID               # For PHI encryption
SENDGRID_API_KEY             # Email notifications
TWILIO_AUTH_TOKEN            # SMS reminders
SENTRY_DSN                   # Error monitoring
```

## HIPAA Compliance Notes

### DO
- ✅ Always encrypt PHI fields before storing
- ✅ Log all PHI access (automatically via middleware)
- ✅ Use RBAC to limit access (principle of least privilege)
- ✅ Set tenant context for every query
- ✅ Validate user permissions before operations
- ✅ Use SSL/TLS for all connections
- ✅ Implement session timeout (15 min)

### DON'T
- ❌ Never log PHI in plain text (Sentry, CloudWatch)
- ❌ Never expose PHI in URLs or query params
- ❌ Never skip tenant isolation checks
- ❌ Never store unencrypted PHI
- ❌ Never bypass audit logging
- ❌ Never share encryption keys in code

## Common Tasks

### Adding a New Entity

1. Create schema in `src/models/entity.schema.ts`:
```typescript
export const entities = pgTable('entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  // ... other fields
});
```

2. Add RLS policy in migration:
```sql
CREATE POLICY tenant_isolation_policy ON entities
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

3. Create service in `src/services/entity.service.ts`
4. Create API routes in `src/app/api/entities/`
5. Create UI components in `src/components/entities/`
6. Add validation schema in `src/validations/entity.validation.ts`

### Adding a New API Route

```typescript
// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/audit';
import { withAuth } from '@/middleware/auth.middleware';
import { checkPermission } from '@/middleware/rbac.middleware';

export const GET = withAuth(async (req: NextRequest) => {
  const { userId, userRole, tenantId } = req.auth;

  if (!checkPermission(userRole, 'clients', 'read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clients = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.tenantId, tenantId));

  // Decrypt PHI fields
  const decrypted = clients.map(c => ({
    ...c,
    firstName: encryptionService.decrypt(c.firstName),
    // ...
  }));

  await logAudit({
    tenantId,
    userId,
    action: 'read',
    resource: 'clients',
    phiAccessed: true,
  });

  return NextResponse.json(decrypted);
});
```

## Testing Guidelines

### Unit Tests
- Test business logic in services
- Mock database calls
- Test matching algorithm scoring
- Test encryption/decryption

### Integration Tests
- Test full workflows (intake → match → schedule)
- Test tenant isolation (cross-tenant access blocked)
- Test RBAC permissions
- Test audit logging

### E2E Tests
- Test complete user journeys
- Test multi-step forms
- Test calendar interactions
- Test role-specific UIs

## Deployment

See `infrastructure/terraform/` for AWS infrastructure as code.

**Deploy steps:**
1. Build Docker image: `docker build -t therapy-clinic-app .`
2. Push to ECR: `docker push ...`
3. Update ECS task definition
4. Run migrations: `npm run db:migrate`
5. Monitor CloudWatch logs

## Documentation

- **Full Implementation Plan:** See `IMPLEMENTATION_PLAN.md`
- **API Documentation:** See `docs/API.md` (TBD)
- **HIPAA Compliance:** See `docs/HIPAA_COMPLIANCE.md` (TBD)
- **Security:** See `docs/SECURITY.md` (TBD)

## Support

- **GitHub Issues:** Track bugs and features
- **Project Board:** See GitHub Projects for sprint planning
- **Architecture Questions:** Refer to IMPLEMENTATION_PLAN.md Section 2-3
