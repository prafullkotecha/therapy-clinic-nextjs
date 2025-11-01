# Project Context

This file is automatically loaded in every Claude Code session.

## Quick Reference

**Project:** Multi-tenant HIPAA-compliant therapy clinic management system
**Tech Stack:** Next.js 16, TypeScript, PostgreSQL, Keycloak, Drizzle ORM
**Architecture:** Multi-tenant SaaS with RLS-based tenant isolation

## Critical Files

- **CLAUDE.md** - TypeScript best practices, architecture patterns, HIPAA guidelines
- **IMPLEMENTATION_PLAN.md** - Complete database schema, security patterns, roadmap
- **KEYCLOAK_SETUP.md** - Authentication setup guide

## Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run db:up                  # Start PostgreSQL + Keycloak
npm run db:migrate             # Run database migrations

# Quality Checks
npm run check:types            # TypeScript type check (MUST pass)
npm run lint                   # ESLint (MUST pass)
npm run test                   # Run tests

# Database
npm run db:generate            # Generate Drizzle migrations
npm run db:studio              # Open Drizzle Studio
```

## TypeScript Critical Rules

From CLAUDE.md:

1. **ALWAYS use `interface` for module augmentation** (not `type`)
2. **NEVER bypass type errors** with `as` or `any`
3. **Declare return types** for top-level functions
4. **Use `interface extends`** instead of `type &` for performance

## HIPAA Critical Rules

1. **All PHI fields MUST be encrypted** before storage (AES-256-GCM)
2. **All PHI access MUST be logged** in audit trail
3. **All queries MUST include tenantId** filter (RLS enforcement)
4. **Never log PHI** in console, Sentry, or CloudWatch
5. **Session timeout: 15 minutes** (enforced via NextAuth)

## Common Patterns

### Database Query with Tenant Isolation
```typescript
const clients = await db
  .select()
  .from(clientsTable)
  .where(eq(clientsTable.tenantId, session.user.tenantId));
```

### PHI Encryption
```typescript
import { encryptionService } from '@/lib/encryption';

const encrypted = encryptionService.encrypt(plaintext);
const decrypted = encryptionService.decrypt(encrypted);
```

### Audit Logging
```typescript
await logAudit({
  tenantId,
  userId,
  action: 'read',
  resource: 'client',
  resourceId: clientId,
  phiAccessed: true,
});
```

### RBAC Permission Check
```typescript
if (!checkPermission(userRole, 'clients', 'update', clientId, userId)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## Issue Workflow

When working on GitHub issues:

1. Use `/work-issue {{ISSUE_NUMBER}}` slash command
2. Plan with TodoWrite tool
3. Follow TypeScript + HIPAA guidelines
4. Test thoroughly (`npm run check:types && npm run lint`)
5. Commit with conventional commits
6. Reference issue: `Closes #{{ISSUE_NUMBER}}`

## Branch Naming

Use prefix `pk/` for all branches:
- `pk/issue-5-add-client-search`
- `pk/fix-auth-redirect`
- `pk/feature-matching-algorithm`
