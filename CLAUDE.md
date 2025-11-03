# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

**Project:** Multi-tenant, HIPAA-compliant behavioral therapy clinic management system. Supports multiple clinic organizations (tenants), each with multiple locations, intelligent therapist-client matching, appointment scheduling, and comprehensive compliance infrastructure.

**Base:** ixartz Next.js Boilerplate
**Architecture:** Multi-tenant SaaS with PostgreSQL RLS isolation

### Tech Stack
| Category | Technologies |
|----------|-------------|
| **Core** | Next.js 16 (App Router), TypeScript, React 19, PostgreSQL 15+, Drizzle ORM |
| **Auth** | Keycloak (self-hosted, HIPAA-compliant) |
| **Caching** | Redis (AWS ElastiCache) |
| **Styling** | Tailwind CSS 4, React Hook Form + Zod |
| **Calendar** | FullCalendar |
| **Testing** | Vitest, Playwright, Testing Library |
| **Infrastructure** | AWS ECS Fargate, RDS, ElastiCache, S3, KMS, CloudWatch |
| **Third-Party** | SendGrid (email), Twilio (SMS), Arcjet (WAF), Sentry |

### Key Commands
```bash
npm run dev                   # Start dev (port from .env.local)
npm run build                 # Production build
npm run type-check            # TypeScript check
npm run db:migrate            # Run migrations
npm run db:studio             # Open Drizzle Studio
npm run test:unit             # Unit tests
/work-issue N                 # Start working on issue
/complete-issue N             # Complete and merge PR
```

### Environment Variables
See `.env.example`. Critical: `DATABASE_URL`, `REDIS_URL`, `KEYCLOAK_URL`, `KEYCLOAK_CLIENT_SECRET`, `AWS_KMS_KEY_ID`

## Architecture Essentials

### Multi-Tenancy Design
- **Isolation:** PostgreSQL RLS policies enforce tenant boundaries
- **Context:** Extracted from Keycloak JWT, injected via middleware
- **Hierarchy:** Tenant → Locations → Users → Clients/Therapists/Appointments

**Every table pattern:**
```typescript
tenantId: uuid('tenant_id').references(() => tenants.id).notNull();
```

**Always include tenant in queries:**
```typescript
// ✅ Correct
const clients = await db.select().from(clientsTable)
  .where(eq(clientsTable.tenantId, tenantId));

// ❌ Wrong - fails RLS
const clients = await db.select().from(clientsTable);
```

**Middleware sets context:**
```typescript
await db.execute(sql`SET LOCAL app.current_tenant = ${tenantId}`);
```

### Security & HIPAA Compliance

**Encryption:**
- Format: `keyId:iv:authTag:ciphertext` (AES-256-GCM)
- Master keys in AWS KMS with rotation
- PHI fields use `text` type (e.g., `first_name_encrypted`)

**Encrypt before storing:**
```typescript
import { encryptionService } from '@/lib/encryption';

const client = await db.insert(clients).values({
  tenantId,
  firstName: encryptionService.encrypt(data.firstName),
  lastName: encryptionService.encrypt(data.lastName),
  ageGroup: data.ageGroup, // Non-PHI as-is
});
```

**Decrypt when reading:**
```typescript
const decrypted = {
  ...client,
  firstName: encryptionService.decrypt(client.firstName),
};
```

**Security Checklist:**
- ✅ Encrypt PHI before storing
- ✅ Log PHI access (auto via middleware)
- ✅ Use RBAC (principle of least privilege)
- ✅ Include tenant context in queries
- ✅ SSL/TLS for all connections
- ✅ 15-min session timeout
- ❌ Never log PHI plaintext
- ❌ Never expose PHI in URLs
- ❌ Never skip tenant checks
- ❌ Never bypass audit logging

**RBAC:**
- Roles: admin, therapist, billing, receptionist
```typescript
import { checkPermission } from '@/middleware/rbac.middleware';

if (!checkPermission(userRole, 'clients', 'update', clientId, userId)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Audit Logging (auto via middleware):**
```typescript
await logAudit({
  tenantId, userId,
  action: 'update',
  resource: 'client',
  resourceId: clientId,
  phiAccessed: true,
});
```

### Database Schema Patterns

**RLS policy template:**
```sql
CREATE POLICY tenant_isolation ON table_name
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

## Common Tasks

### Adding a New Entity

1. Schema in `src/models/entity.schema.ts`:
```typescript
export const entities = pgTable('entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  // ... fields
});
```

2. RLS policy in migration:
```sql
CREATE POLICY tenant_isolation_policy ON entities
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

3. Create service, API routes, UI components, validation schema

### Adding API Route

```typescript
// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth.middleware';
import { checkPermission } from '@/middleware/rbac.middleware';

export const GET = withAuth(async (req: NextRequest) => {
  const { userId, userRole, tenantId } = req.auth;

  if (!checkPermission(userRole, 'clients', 'read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clients = await db.select().from(clientsTable)
    .where(eq(clientsTable.tenantId, tenantId));

  // Decrypt PHI
  const decrypted = clients.map(c => ({
    ...c,
    firstName: encryptionService.decrypt(c.firstName),
  }));

  await logAudit({ tenantId, userId, action: 'read', resource: 'clients', phiAccessed: true });

  return NextResponse.json(decrypted);
});
```

### Matching Algorithm

Located in `services/matching.service.ts`. Weights: Specializations 40%, Communication 30%, Availability 15%, Age 10%, Schedule 5%.

```typescript
const matches = await matchingService.calculateMatches(tenantId, {
  requiredSpecializations: [{ specializationId, specializationName: 'ABA', importance: 'critical' }],
  communicationNeeds: 'non-verbal',
  ageGroup: 'early_childhood',
  urgency: 'standard',
}, therapists);
// Returns top 5 matches with scores
```

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Public auth routes
│   ├── (dashboard)/         # Protected routes
│   │   ├── admin/           # Admin portal (clients, therapists, appointments, reports)
│   │   └── therapist/       # Therapist portal
│   └── api/                 # API routes
├── components/              # UI components (clients, therapists, scheduling, ui)
├── lib/                     # Core services (keycloak, encryption, audit, matching)
├── services/                # Business logic (client, therapist, appointment, matching, notification)
├── models/                  # Drizzle schemas (tenant, user, client, therapist, appointment)
├── middleware/              # Middleware (tenant, auth, rbac, audit)
├── utils/                   # Utilities (encryption, date)
└── validations/             # Zod schemas
```

## Testing Guidelines

| Type | Focus |
|------|-------|
| **Unit** | Business logic, matching algorithm, encryption |
| **Integration** | Workflows, tenant isolation, RBAC, audit logging |
| **E2E** | User journeys, forms, calendar, role-specific UIs |

Commands: `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`, `npm run test:coverage`

## Visual Development

### Design Principles
- Comprehensive checklist: `/context/design-principles.md`
- Brand guide: `/context/style-guide.md`
- Always refer to these files for UI/UX changes

### Quick Visual Check (After Every Front-End Change)
1. Identify what changed
2. Navigate to affected pages (`mcp__playwright__browser_navigate`)
3. Verify design compliance vs. design-principles.md & style-guide.md
4. Validate feature implementation
5. Check acceptance criteria
6. Capture screenshot (desktop 1440px)
7. Check errors (`mcp__playwright__browser_console_messages`)

### Comprehensive Design Review
Use `design-reviewer` subagent (Task tool) for:
- Significant UI/UX features
- Before finalizing PRs with visual changes
- Comprehensive accessibility/responsiveness testing

## Deployment

See `infrastructure/terraform/` for AWS IaC.

**Steps:**
1. Build: `docker build -t therapy-clinic-app .`
2. Push to ECR
3. Update ECS task definition
4. Run migrations: `npm run db:migrate`
5. Monitor CloudWatch logs

## Documentation

- **Implementation Plan:** `IMPLEMENTATION_PLAN.md`
- **API Docs:** `docs/API.md` (TBD)
- **HIPAA Compliance:** `docs/HIPAA_COMPLIANCE.md` (TBD)
- **Security:** `docs/SECURITY.md` (TBD)

## Reference: TypeScript Best Practices

**Consult when:** Module augmentation, complex type errors, performance issues

Based on Matt Pocock's Total TypeScript (2025) and TypeScript 5.7/5.8. **NEVER** use `as` or `any` to bypass errors.

### Module Augmentation (ONLY use case for `interface` over `type`)

```typescript
// ✅ Declaration merging requires interface
declare module 'next-auth' {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface Session {
    user: { roles: string[] } & DefaultSession['user'];
  }
}
```

**Rules:**
1. Use `interface` for module augmentation (type doesn't merge)
2. File must be in module scope (has import/export)
3. Can only patch existing declarations

### Core Principles

| Principle | Example |
|-----------|---------|
| **Declare return types** | `export async function getUser(id: string): Promise<User \| null>` |
| **`interface extends` > `type &`** | Better IDE/tsc performance |
| **Leverage inference** | Let TypeScript infer when possible |
| **Branded types** | `type ClientId = string & { readonly __brand: 'ClientId' }` |
| **Generic placement** | Function-level generics allow better inference |

### Common Patterns

**Type predicates & assertions:**
```typescript
function isClient(user: User): user is Client {
  return user.type === 'client';
}

function assertClient(user: User): asserts user is Client {
  if (user.type !== 'client') throw new Error('Not a client');
}
```

**Const assertions:**
```typescript
const ROLES = ['admin', 'therapist', 'billing'] as const;
type Role = typeof ROLES[number]; // 'admin' | 'therapist' | 'billing'
```

**Next-Auth workaround (known issue):**
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

**NEVER bypass with `as` or `any`.** Instead:

1. Understand root cause
2. Fix types correctly (narrowing, guards, generics)
3. Document workarounds

```typescript
// ✅ Correct
const userResult = UserSchema.safeParse(data);
if (!userResult.success) throw new Error('Invalid user data');
const user = userResult.data;

// ❌ Never do this
const user = data as User;
```

### Resources

- [Total TypeScript](https://www.totaltypescript.com/) - Matt Pocock's training
- [TypeScript 5.8 Release Notes](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/)
- [Auth.js TypeScript Guide](https://authjs.dev/getting-started/typescript)

## Worktree Awareness (Optional)

**Parallel Workflow System:** Supports multiple Claude Code sessions via git worktrees.

### Detection

Check for `.worktree-config.json` at project root:
- **If found** → Worktree mode (parallel workflow)
- **If not found** → Standard single-session workflow

### Worktree Configuration

```json
{
  "name": "dev-1",
  "role": "development",
  "port": 3001,
  "guidelines": {
    "purpose": "Feature development worktree #1",
    "devServer": "Always use port 3001",
    "testing": "Run quick checks only, delegate heavy tests to ci-cd",
    "branches": "Create feature branches normally"
  }
}
```

### Behavioral Adjustments

**When in a worktree:**

1. **Dev Server Port** - Read PORT from `.env.local`, use for `npm run dev`
2. **Response Prefixes** - Prefix with worktree name: `[dev-1] Working on issue #42...`
3. **Testing Strategy:**
   - **dev-1, dev-2:** Quick checks only, suggest ci-cd for full suites
   - **pr-review:** Light testing, focus on review
   - **ci-cd:** Comprehensive testing, full coverage
4. **Role Guidelines** - Follow `guidelines` from config

### Worktree Coordination (Preventing Duplicate Work)

**Before starting work (`/work-issue N`):**

1. Check if issue assigned:
```bash
ASSIGNED_TO=$(./.claude/scripts/worktree-check-assignment.sh N)
if [ $? -eq 1 ]; then
  echo "Warning: Issue #N is already being worked on in $ASSIGNED_TO"
  # Ask user if they want to continue
fi
```

2. If not assigned, assign to current worktree:
```bash
WORKTREE_NAME=$(jq -r '.name' .worktree-config.json)
./.claude/scripts/worktree-assign.sh $WORKTREE_NAME N
```

**After completing (`/complete-issue N`):**

1. Unassign from current worktree
2. Check if other worktrees have same branch
3. Proceed with normal workflow

**Assignment file (`.worktree-assignments.json`):**
```json
{
  "dev-1": 42,
  "dev-2": 43,
  "pr-review": null,
  "ci-cd": null
}
```

**Key behaviors:**
- ✅ Assignment is advisory (git branch protection is hard protection)
- ✅ Check before starting work
- ✅ Auto-cleanup on completion
- ✅ Safe failures (git still prevents conflicts)

### Commands Compatibility

**ALL commands work identically in worktrees:**
- `/work-issue N`, `/complete-issue N`, `/suggest-next-issue`
- `/review-pr N`, `/type-check`, `/hipaa-check`, `/verify-app`
- `npm run dev` (uses PORT from .env.local)

### Worktree Roles

| Worktree | Port | Role | Purpose |
|----------|------|------|---------|
| dev-1 | 3001 | development | Feature development #1 |
| dev-2 | 3002 | development | Feature development #2 |
| pr-review | 3003 | pr-review | PR reviews without context switching |
| ci-cd | 3004 | ci-cd | Tests, builds, CI operations |

### Example Behavior

**Main directory:**
```
You: /work-issue 42
Claude: Creating branch pk/issue-42-client-intake...
Claude: Starting dev server on port 3000...
```

**In dev-1 worktree:**
```
You: /work-issue 42
Claude: [dev-1] Creating branch pk/issue-42-client-intake...
Claude: [dev-1] Starting dev server on port 3001...
Claude: [dev-1] For full test suite, use ci-cd worktree
```

### Management

```bash
./.claude/scripts/worktree-init.sh        # Setup (one-time)
./.claude/scripts/worktree-list.sh        # Check status
```

**Documentation:** `.claude/docs/WORKTREE_GUIDE.md`

### Key Points

- ✅ Worktrees are **optional** - main workflow unchanged
- ✅ Passive detection - no breaking changes
- ✅ All commands work identically
- ✅ Enables 4 parallel Claude sessions
- ✅ Shared database, Redis, git repository
- ✅ Independent node_modules, builds, dev servers

**If not in a worktree, ignore this section.**
