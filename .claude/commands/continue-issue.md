---
description: Continue work on an existing issue branch after PR feedback
---

# Continue Work on Issue

Continue working on issue #{{ISSUE_NUMBER}} based on PR feedback.

## Instructions

1. **Check current branch**:
   ```bash
   git branch --show-current
   ```

2. **If not on the issue branch, switch to it**:
   ```bash
   git checkout pk/issue-{{ISSUE_NUMBER}}-*
   ```

3. **Pull latest changes** (if PR has been updated):
   ```bash
   git pull origin pk/issue-{{ISSUE_NUMBER}}-*
   ```

4. **Check PR feedback**:
   ```bash
   gh pr view {{PR_NUMBER}} --comments
   ```

5. **Address feedback**:
   - Read all review comments
   - Make requested changes
   - Update tests if needed
   - Run quality checks

6. **Verify application** (CRITICAL):
   - Start dev server and verify it runs successfully
   - See `/verify-app` command for details

7. **Commit changes with DCO sign-off**:
   ```bash
   git add -A
   git commit -s -m "$(cat <<'EOF'
   fix: address PR feedback

   - [List changes made]
   - [Address specific comments]

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```
   **CRITICAL**: Always use `-s` flag for DCO compliance

8. **Push updates** (automatic):
   ```bash
   git push
   ```

9. **Update PR** (if description changed):
   ```bash
   gh pr edit {{PR_NUMBER}} --body "Updated description..."
   ```

10. **Request re-review**:
   ```bash
   gh pr ready {{PR_NUMBER}}
   ```

## Quality Checks

Before pushing:
- [ ] `npm run check:types` passes
- [ ] `npm run lint` passes
- [ ] All tests pass
- [ ] App verified and runs successfully
- [ ] Addressed all PR comments
- [ ] Commit uses `-s` flag (DCO sign-off)
- [ ] No new HIPAA violations
- [ ] No new TypeScript compromises

## Note

This command is for continuing work on an **existing** branch/PR. For new work, use `/work-issue {{ISSUE_NUMBER}}` instead.
