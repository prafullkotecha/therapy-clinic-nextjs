# Claude Code Workflow Guide

Streamlined workflow commands for efficient issue management.

## 🔄 Complete Workflow

```
/work-issue X → code → test → commit → PR → /complete-issue X → /suggest-next-issue
```

## 📋 Available Commands

### 1. `/work-issue` - Start Working on an Issue

Start work on any GitHub issue with full automation.

```bash
/work-issue 26
```

**What it does:**
- Fetches issue details
- Creates feature branch (`pk/issue-X-description`)
- Plans implementation with TodoWrite
- Guides through development
- Runs tests and verification
- Creates commit with DCO sign-off
- Pushes and creates PR automatically
- **NEW:** Suggests next issue at completion

**Best for:** Starting fresh work on any issue

---

### 2. `/complete-issue` - Finish an Issue

Complete and merge a finished issue with full cleanup.

**Recommended (Automated Script):**
```bash
./.claude/scripts/complete-issue.sh 51
```

**Alternative (Command):**
```bash
/complete-issue 51
```

**What it does:**
- Auto-detects PR number from issue
- Verifies PR readiness (mergeable, checks)
- Merges PR with squash strategy
- Updates project board to "✅ Done"
- Closes issue (if not auto-closed)
- Deletes local and remote branches
- Pulls latest changes to base branch
- Adds completion metrics comment
- Shows completion summary

**Best for:** Merging approved PRs and cleaning up

---

### 3. `/suggest-next-issue` - Get Next Work Recommendation

Analyze project status and get intelligent next issue recommendation.

```bash
/suggest-next-issue
```

**What it does:**
- Queries project board for all issues
- Filters "Sprint Ready" issues (🎯)
- Checks dependency satisfaction
- Considers phase progression (1→2→3)
- Prioritizes foundational work
- Recommends 1-2 issues with reasoning
- Shows alternatives

**Best for:** Deciding what to work on next

---

### 4. `/review-pr` - Review Pull Request

Review code quality, security, and HIPAA compliance.

```bash
/review-pr 55
```

**Best for:** Code review before merging

---

### 5. `/hipaa-check` - HIPAA Compliance Audit

Audit codebase for HIPAA compliance issues.

```bash
/hipaa-check
```

**Best for:** Security/compliance verification

---

### 6. `/type-check` - TypeScript Validation

Run comprehensive TypeScript type checking.

```bash
/type-check
```

**Best for:** Ensuring type safety

---

### 7. `/verify-app` - Application Health Check

Verify application starts and runs successfully.

```bash
/verify-app
```

**Best for:** Post-merge smoke testing

---

## 🎯 Recommended Workflows

### Starting a New Issue

1. **Get recommendation:**
   ```bash
   /suggest-next-issue
   ```

2. **Start work:**
   ```bash
   /work-issue 26
   ```

3. Code, test, commit (automated by /work-issue)

4. **Complete and merge:**
   ```bash
   ./.claude/scripts/complete-issue.sh 26
   ```

5. **Get next recommendation** (automatic in step 4)

---

### Code Review Workflow

1. **Create PR** (automatic in /work-issue)

2. **Self-review:**
   ```bash
   /review-pr 55
   ```

3. **Check HIPAA compliance** (if PHI involved):
   ```bash
   /hipaa-check
   ```

4. **Verify types:**
   ```bash
   /type-check
   ```

5. **Fix any issues**, push updates

6. **Complete when approved:**
   ```bash
   /complete-issue 51
   ```

---

### Continuous Flow (Recommended)

```bash
# Start
/suggest-next-issue  # Get: Work on #26 (Multi-Tenancy)
/work-issue 26       # Code, test, PR created

# Complete
/complete-issue 26   # Merge, cleanup, suggests #9 (PHI Encryption)
/work-issue 9        # Next issue starts immediately

# Repeat
/complete-issue 9    # Suggests #6 (Client Models)
/work-issue 6

# And so on...
```

---

## 📊 Project Board Statuses

Understanding issue statuses:

- **📋 Backlog:** Future work, dependencies not ready
- **🎯 Sprint Ready:** Ready to start (dependencies satisfied)
- **🚧 In Progress:** Currently being worked on
- **✅ Done:** Completed and merged

**Sprint Ready issues** are automatically detected by `/suggest-next-issue` based on:
- Dependencies in "Done" status
- Phase progression
- Foundational priority

---

## 🔧 Manual Operations

### If Script Fails

Use manual steps from `/complete-issue` command:

```bash
# Merge PR
gh pr merge 55 --squash --delete-branch

# Update project board manually
# Visit: https://github.com/users/prafullkotecha/projects/1

# Clean up local
git checkout master
git pull origin master
git branch -D pk/issue-51-ui-foundation-design-system
```

### Emergency: Undo Merge (Use Carefully!)

```bash
# Revert the merge commit (creates new commit)
git revert -m 1 <merge-commit-hash>
git push origin master

# Reopen issue
gh issue reopen 51

# Update project board manually
```

---

## 🎓 Best Practices

### DO
✅ Use `/suggest-next-issue` to pick work strategically
✅ Complete foundational issues before features
✅ Run `/verify-app` after merging
✅ Use automated script for `/complete-issue`
✅ Follow phase progression (1→2→3→4→5→6)
✅ Check HIPAA compliance for PHI-related work

### DON'T
❌ Skip dependency issues (causes blockers)
❌ Jump phases (Phase 4 before Phase 2)
❌ Merge with failing checks
❌ Delete branches manually (script does it)
❌ Force-push to PRs after review

---

## 🐛 Troubleshooting

### "Could not auto-detect PR number"

**Solution:** Provide PR number manually:
```bash
./.claude/scripts/complete-issue.sh 51 55
```

### "PR has merge conflicts"

**Solution:** Resolve conflicts first:
```bash
git checkout pk/issue-51-ui-foundation
git pull origin master
# Resolve conflicts
git add .
git commit -s -m "fix: resolve merge conflicts"
git push
```

### "Project board update failed"

**Solution:** Update manually at:
https://github.com/users/prafullkotecha/projects/1

### "CI checks failing"

**Solution:** Don't merge yet. Fix issues:
```bash
npm run check:types  # Fix type errors
npm run lint:fix     # Fix linting
npm run test         # Fix tests
git add .
git commit -s -m "fix: address CI failures"
git push
```

---

## 📈 Workflow Metrics

Track your progress:

```bash
# Issues completed this week
gh issue list --state closed --search "closed:>=$(date -d '7 days ago' +%Y-%m-%d)"

# Current sprint (Sprint Ready issues)
gh project item-list 1 --owner prafullkotecha --format json | \
  jq '.items[] | select(.status == "🎯 Sprint Ready")'

# Phase completion
gh issue list --label "phase: 2" --state closed
```

---

## 🎯 Current Recommendation

**Next Issue:** #26 - Multi-Tenancy Foundation

**To start:**
```bash
/work-issue 26
```

See `/suggest-next-issue` for updated recommendations.
