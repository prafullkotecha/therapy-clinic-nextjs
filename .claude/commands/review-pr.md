---
description: Review a pull request for code quality, security, and HIPAA compliance
---

# Review Pull Request

Review PR #{{PR_NUMBER}} for the therapy-clinic-nextjs project.

## Instructions

1. **Fetch PR details**:
   ```bash
   gh pr view {{PR_NUMBER}}
   gh pr diff {{PR_NUMBER}}
   ```

2. **Review checklist**:

### Code Quality
- [ ] Follows TypeScript best practices (CLAUDE.md)
- [ ] Uses `interface` for module augmentation (not `type`)
- [ ] Proper return types declared
- [ ] No unnecessary `any` types
- [ ] Code is DRY and well-organized
- [ ] Proper error handling

### Type Safety
- [ ] `npm run check:types` passes
- [ ] No type assertion bypasses (`as`, `any`)
- [ ] Generics used appropriately
- [ ] Type inference leveraged

### Security & HIPAA
- [ ] PHI fields encrypted (AES-256-GCM)
- [ ] Audit logging for PHI access
- [ ] RBAC permissions enforced
- [ ] No PHI in logs/errors/URLs
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (proper sanitization)
- [ ] No secrets committed (.env, credentials)

### Multi-Tenancy
- [ ] All queries include tenantId filter
- [ ] RLS policies in place for new tables
- [ ] Tenant context properly injected
- [ ] No cross-tenant data leaks

### Database
- [ ] Migrations generated and tested
- [ ] Drizzle schemas follow conventions
- [ ] Indexes on foreign keys
- [ ] Encrypted fields use `text` type

### Testing
- [ ] Unit tests for business logic
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows
- [ ] All tests passing

### Documentation
- [ ] Code comments for complex logic
- [ ] JSDoc for public APIs
- [ ] README updated if needed
- [ ] Migration notes if applicable

3. **Provide feedback**:
   - List issues found (categorized by severity: critical, major, minor)
   - Suggest improvements
   - Highlight good patterns
   - Check against IMPLEMENTATION_PLAN.md patterns

4. **Post review as PR comment** (if user approves):
   ```bash
   gh pr review {{PR_NUMBER}} --comment -b "review feedback"
   ```
