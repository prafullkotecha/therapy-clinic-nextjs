---
description: Fetch and work on a GitHub issue automatically
---

# Work on GitHub Issue

You are working on GitHub issue #{{ISSUE_NUMBER}} for the therapy-clinic-nextjs project.

## Instructions

1. **Fetch the issue details** using GitHub CLI:
   ```bash
   gh issue view {{ISSUE_NUMBER}}
   ```

2. **Analyze the issue**:
   - Read the full description and acceptance criteria
   - Check for related issues or dependencies
   - Review any linked PRs or discussions

3. **Create a plan**:
   - Break down the work into actionable tasks
   - Use TodoWrite tool to track progress
   - Consider TypeScript best practices from CLAUDE.md
   - Consider HIPAA compliance requirements if applicable

4. **Implementation**:
   - Create a feature branch: `pk/issue-{{ISSUE_NUMBER}}-<description>`
   - Follow the patterns in CLAUDE.md and IMPLEMENTATION_PLAN.md
   - Write code with proper TypeScript types (use `interface` for module augmentation)
   - Ensure all PHI fields are encrypted
   - Add tests if required

5. **Testing**:
   - Run `npm run check:types` - MUST pass
   - Run `npm run lint` - MUST pass
   - Run relevant tests
   - Test database migrations if applicable

6. **Commit**:
   - Follow conventional commits format
   - Reference the issue: `Closes #{{ISSUE_NUMBER}}`
   - Include co-author: `Co-Authored-By: Claude <noreply@anthropic.com>`
   - Add Claude Code footer

7. **Ask user** if they want you to:
   - Push the changes
   - Create a pull request
   - Continue with next steps

## Context Files to Reference

- **CLAUDE.md** - TypeScript best practices, architecture, patterns
- **IMPLEMENTATION_PLAN.md** - Database schema, security patterns
- **KEYCLOAK_SETUP.md** - Authentication setup if auth-related

## HIPAA Compliance Checklist

If the issue involves PHI (Protected Health Information):
- [ ] All PHI fields encrypted before storage
- [ ] Audit logging implemented for PHI access
- [ ] RBAC permission checks in place
- [ ] No PHI in logs, URLs, or error messages
- [ ] Session timeout enforced (15 minutes)

## TypeScript Checklist

- [ ] Use `interface` for module augmentation (not `type`)
- [ ] Declare return types for top-level functions
- [ ] No `any` types without justification
- [ ] Type errors fixed correctly (no workarounds)
- [ ] `npm run check:types` passes

## Remember

- **NEVER** compromise on type safety
- **ALWAYS** follow HIPAA compliance patterns
- **ALWAYS** use TodoWrite to track progress
- **ALWAYS** test thoroughly before committing
