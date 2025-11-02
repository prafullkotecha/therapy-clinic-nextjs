---
description: Complete an issue by merging PR, updating project board, and cleanup
---

# Complete Issue

Complete work on an issue by merging the PR, updating the project board, and performing cleanup.

## Quick Start (Recommended)

Use the automated script for reliable completion:

```bash
./.claude/scripts/complete-issue.sh {{ISSUE_NUMBER}} [PR_NUMBER]
```

The script will:
- Auto-detect PR number if not provided
- Verify PR is ready to merge
- Merge with squash strategy
- Update project board to "Done"
- Close issue if not auto-closed
- Clean up local and remote branches
- Pull latest changes
- Add completion comment with metrics
- Show summary and next steps

**Then:** Use `/suggest-next-issue` to get recommendation for next work.

## Manual Instructions (Alternative)

If you need more control or the script fails, follow these manual steps:

You are completing GitHub issue #{{ISSUE_NUMBER}}.

**Note:** If PR number not provided, auto-detect it from the issue's linked PRs.

1. **Auto-detect PR number** (if not provided):
   ```bash
   # Get linked PR from issue
   PR_NUMBER=$(gh issue view {{ISSUE_NUMBER}} --json closedByPullRequestsReferences \
     --jq '.closedByPullRequestsReferences[0].number // empty')

   # If not found in closedBy, check timelineItems for linked PRs
   if [ -z "$PR_NUMBER" ]; then
     PR_NUMBER=$(gh api repos/prafullkotecha/therapy-clinic-nextjs/issues/{{ISSUE_NUMBER}}/timeline \
       --jq '.[] | select(.event == "cross-referenced" and .source.issue.pull_request != null) | .source.issue.number' | head -1)
   fi

   # If still not found, search by branch name
   if [ -z "$PR_NUMBER" ]; then
     BRANCH_NAME=$(git branch --show-current)
     PR_NUMBER=$(gh pr list --head "$BRANCH_NAME" --json number --jq '.[0].number')
   fi

   echo "Detected PR: #$PR_NUMBER"
   ```

2. **Verify PR readiness**:
   ```bash
   gh pr view $PR_NUMBER --json state,statusCheckRollup,reviews,mergeable
   ```
   - Check PR state is OPEN
   - Verify mergeable (no conflicts)
   - Check CI checks passing (if any)
   - Confirm reviews approved (if required)

3. **Pre-merge checklist**:
   - ✅ All tests passing
   - ✅ Type check passes
   - ✅ Lint passes
   - ✅ App verified working
   - ✅ Changes reviewed
   - ✅ No merge conflicts

4. **Merge the PR**:
   ```bash
   gh pr merge $PR_NUMBER --squash --delete-branch
   ```

   **Merge strategy**: Use `--squash` to keep git history clean
   - Combines all commits into one
   - Preserves DCO sign-off in squash commit message
   - Auto-deletes remote branch after merge

5. **Update project board** (auto-detect field IDs):
   ```bash
   # Get project ID and field IDs
   PROJECT_ID=1
   OWNER=prafullkotecha

   # Get the project item ID for this issue
   ITEM_ID=$(gh project item-list $PROJECT_ID --owner $OWNER --format json | \
     jq -r ".items[] | select(.content.number == {{ISSUE_NUMBER}}) | .id")

   echo "Project item ID: $ITEM_ID"

   # Get the Status field ID
   STATUS_FIELD_ID=$(gh project field-list $PROJECT_ID --owner $OWNER --format json | \
     jq -r '.fields[] | select(.name == "Status") | .id')

   echo "Status field ID: $STATUS_FIELD_ID"

   # Update status to "✅ Done"
   gh project item-edit --id "$ITEM_ID" --project-id $PROJECT_ID --field-id "$STATUS_FIELD_ID" --single-select-option-id "$(gh project field-list $PROJECT_ID --owner $OWNER --format json | jq -r '.fields[] | select(.name == "Status") | .options[] | select(.name == "✅ Done") | .id')"
   ```

   **Note:** If project board update fails, manually update at:
   https://github.com/users/prafullkotecha/projects/1

6. **Verify issue closed**:
   ```bash
   gh issue view {{ISSUE_NUMBER}} --json state
   ```
   - Should be CLOSED (auto-closed by PR merge with "Resolves #{{ISSUE_NUMBER}}")
   - If not closed, manually close: `gh issue close {{ISSUE_NUMBER}} --comment "Completed via PR #$PR_NUMBER"`

7. **Local cleanup**:
   ```bash
   # Get the base branch name (usually master or main)
   BASE_BRANCH=$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)

   # Get current branch name before switching
   FEATURE_BRANCH=$(git branch --show-current)

   # Switch to base branch
   git checkout $BASE_BRANCH

   # Pull latest changes (includes the merged PR)
   git pull origin $BASE_BRANCH

   # Delete local feature branch (if it exists and we're not on it)
   if [ "$FEATURE_BRANCH" != "$BASE_BRANCH" ]; then
     git branch -D "$FEATURE_BRANCH" 2>/dev/null || echo "Branch already deleted"
   fi
   ```

8. **Verify merge**:
   ```bash
   # Check that the merged commit is in history
   git log --oneline -5

   # Verify app still works after merge
   npm run check:types
   ```

9. **Update issue with completion metrics** (optional but recommended):
   ```bash
   gh issue comment {{ISSUE_NUMBER}} --body "## ✅ Issue Completed

**PR:** #$PR_NUMBER
**Merged:** $(date -u +"%Y-%m-%d %H:%M UTC")
**Commits:** $(gh pr view $PR_NUMBER --json commits --jq '.commits | length')
**Files changed:** $(gh pr view $PR_NUMBER --json files --jq '.files | length')
**Project Status:** ✅ Done

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
   ```

10. **Suggest next issue** (REQUIRED):
   - Query project board: `gh project item-list 1 --owner prafullkotecha --format json --limit 100`
   - Identify "Sprint Ready" issues (status: "🎯 Sprint Ready")
   - Check dependencies are satisfied (cross-reference with "✅ Done" issues)
   - Consider phase progression
   - Recommend 1-2 next issues with reasoning
   - Use format from `/suggest-next-issue` command

11. **Inform user**:
    ```
    ## ✅ Issue #{{ISSUE_NUMBER}} Complete

    **Merged:** PR #$PR_NUMBER (squashed)
    **Project Board:** Updated to "✅ Done"
    **Branch:** Deleted (local and remote)
    **Base branch:** Updated to latest

    ## Recommended Next Issue: #X - Title

    **Why:**
    - [Reasoning]

    **To start:**
    /work-issue X
    ```

## Smart Field ID Detection

The project board status field ID may change. Auto-detect it:

```bash
# Get all field IDs for the project
gh project field-list 1 --owner prafullkotecha --format json

# Find the Status field ID
STATUS_FIELD_ID=$(gh project field-list 1 --owner prafullkotecha --format json | \
  jq -r '.fields[] | select(.name == "Status") | .id')
```

## Error Handling

**If PR has merge conflicts:**
1. Don't merge yet
2. Inform user of conflict
3. Provide instructions to resolve:
   ```bash
   git checkout pk/issue-{{ISSUE_NUMBER}}-*
   git pull origin $BASE_BRANCH
   # Resolve conflicts
   git add .
   git commit -s -m "fix: resolve merge conflicts"
   git push
   ```
4. Wait for user confirmation before retrying

**If CI checks failing:**
1. Don't merge
2. Show failing checks
3. Suggest fixing issues first
4. Wait for user confirmation

**If branch already deleted:**
1. Skip local branch deletion
2. Note in output that cleanup was already done

## Remember

- **ALWAYS** use `--squash` for clean history
- **ALWAYS** verify issue auto-closed by PR merge
- **ALWAYS** update project board status
- **ALWAYS** pull latest after merge
- **ALWAYS** suggest next issue
- **NEVER** force-merge with failing checks
- **NEVER** skip cleanup steps

## Alternative: Dry Run

If user wants to see what will happen without executing:

```bash
echo "Would merge PR #{{PR_NUMBER}} with --squash --delete-branch"
echo "Would update project item to '✅ Done'"
echo "Would delete local branch pk/issue-{{ISSUE_NUMBER}}-*"
echo "Would switch to $BASE_BRANCH and pull latest"
```
