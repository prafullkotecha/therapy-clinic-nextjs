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

4. **Create feature branch**:
   ```bash
   git checkout -b pk/issue-{{ISSUE_NUMBER}}-<short-description>
   ```
   Branch naming: `pk/issue-{{ISSUE_NUMBER}}-<kebab-case-description>`
   Example: `pk/issue-5-add-client-search`

5. **Implementation**:
   - Follow the patterns in CLAUDE.md and IMPLEMENTATION_PLAN.md
   - Write code with proper TypeScript types (use `interface` for module augmentation)
   - Ensure all PHI fields are encrypted
   - Add tests if required

6. **Testing**:
   - Run `npm run check:types` - MUST pass
   - Run `npm run lint` - MUST pass
   - Run relevant tests
   - Test database migrations if applicable

7. **Verify application** (CRITICAL):
   - Start dev server: `npm run dev` (in background)
   - Wait for "Ready in X.Xs" message
   - Verify HTTP response: `curl http://localhost:3000`
   - Check for compilation/runtime errors
   - Confirm app loads successfully
   - See `/verify-app` command for details

8. **Commit with DCO sign-off**:
   - **ALWAYS use `-s` flag** for DCO compliance
   - Follow conventional commits format
   - Reference the issue: `Resolves #{{ISSUE_NUMBER}}`
   - Include co-author and Claude Code footer

   Example:
   ```bash
   git add .
   git commit -s -m "$(cat <<'EOF'
   feat: implement feature name

   Detailed description of changes.

   Resolves #{{ISSUE_NUMBER}}

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```

9. **Push and create PR** (automatic, no asking):
   ```bash
   git push -u origin pk/issue-{{ISSUE_NUMBER}}-<description>

   gh pr create \
     --title "feat: <concise title>" \
     --body "<PR description with implementation details>" \
     --label "ready-for-review"
   ```

10. **Inform user**:
   - Provide PR URL
   - Summarize what was done
   - Note any important decisions or trade-offs
   - List what to review carefully
   - Confirm app verified and running

11. **Suggest next issue** (REQUIRED):
   - Query project board status: `gh project item-list 1 --owner prafullkotecha --format json --limit 100`
   - Identify "Sprint Ready" issues (status: "🎯 Sprint Ready")
   - Check dependencies are satisfied (cross-reference with "✅ Done" issues)
   - Consider phase progression (Phase 1 → Phase 2 → Phase 3, etc.)
   - Recommend 1-2 next issues with reasoning:
     * Why this issue is ready
     * What dependencies are satisfied
     * How it fits into the overall plan
     * Any blockers or alternatives
   - Format:
     ```
     ## Recommended Next Issue: #X - Issue Title

     **Why:**
     - Dependency reason
     - Priority reason
     - Flow reason

     **Alternatives:** #Y (if applicable)
     ```

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

## Git Commit Checklist

- [ ] Use `git commit -s` for DCO sign-off (CRITICAL)
- [ ] Follow conventional commits format
- [ ] Include `Resolves #{{ISSUE_NUMBER}}`
- [ ] Add co-author line
- [ ] Add Claude Code footer
- [ ] Use HEREDOC for multi-line commit messages

## Remember

- **NEVER** compromise on type safety
- **ALWAYS** follow HIPAA compliance patterns
- **ALWAYS** use TodoWrite to track progress
- **ALWAYS** test thoroughly before committing
- **ALWAYS** verify app starts successfully after changes
- **ALWAYS** use `-s` flag when committing (DCO compliance)
