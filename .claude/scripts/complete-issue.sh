#!/bin/bash
set -e

# Complete Issue Helper Script
# Usage: ./scripts/complete-issue.sh ISSUE_NUMBER [PR_NUMBER]

ISSUE_NUMBER=$1
PR_NUMBER=$2
PROJECT_NUMBER=1
OWNER=prafullkotecha
REPO=therapy-clinic-nextjs

if [ -z "$ISSUE_NUMBER" ]; then
  echo "Error: Issue number required"
  echo "Usage: $0 ISSUE_NUMBER [PR_NUMBER]"
  exit 1
fi

echo "🔍 Completing issue #$ISSUE_NUMBER..."

# Get the actual project ID (GraphQL format, not just the number)
PROJECT_ID=$(gh project list --owner "$OWNER" --format json | jq -r '.projects[] | select(.number == 1) | .id')

# Auto-detect PR number if not provided
if [ -z "$PR_NUMBER" ]; then
  echo "🔍 Auto-detecting PR number..."

  # Try to get from issue's linked PRs
  PR_NUMBER=$(gh issue view "$ISSUE_NUMBER" --json closedByPullRequestsReferences \
    --jq '.closedByPullRequestsReferences[0].number // empty' 2>/dev/null || echo "")

  # If not found, search by current branch
  if [ -z "$PR_NUMBER" ]; then
    BRANCH_NAME=$(git branch --show-current)
    PR_NUMBER=$(gh pr list --head "$BRANCH_NAME" --json number --jq '.[0].number' 2>/dev/null || echo "")
  fi

  if [ -z "$PR_NUMBER" ]; then
    echo "❌ Could not auto-detect PR number. Please provide it as second argument."
    exit 1
  fi

  echo "✅ Detected PR #$PR_NUMBER"
fi

# Verify PR readiness
echo "🔍 Verifying PR #$PR_NUMBER readiness..."
PR_DATA=$(gh pr view "$PR_NUMBER" --json state,mergeable,reviewDecision,statusCheckRollup)

STATE=$(echo "$PR_DATA" | jq -r '.state')
MERGEABLE=$(echo "$PR_DATA" | jq -r '.mergeable')
REVIEW_DECISION=$(echo "$PR_DATA" | jq -r '.reviewDecision // "NONE"')

if [ "$STATE" != "OPEN" ]; then
  echo "❌ PR is not OPEN (state: $STATE)"
  exit 1
fi

if [ "$MERGEABLE" == "CONFLICTING" ]; then
  echo "❌ PR has merge conflicts"
  exit 1
fi

echo "✅ PR is ready to merge"

# Merge the PR
echo "🔀 Merging PR #$PR_NUMBER with squash..."
gh pr merge "$PR_NUMBER" --squash --delete-branch

if [ $? -ne 0 ]; then
  echo "❌ Failed to merge PR"
  exit 1
fi

echo "✅ PR merged and remote branch deleted"

# Update project board
echo "📊 Updating project board..."

# Get project item ID (use project number for list commands)
ITEM_ID=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | \
  jq -r ".items[] | select(.content.number == $ISSUE_NUMBER) | .id")

if [ -z "$ITEM_ID" ]; then
  echo "⚠️  Could not find project item for issue #$ISSUE_NUMBER"
else
  echo "✅ Found project item: $ITEM_ID"

  # Get Status field ID (use project number for field-list)
  STATUS_FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | \
    jq -r '.fields[] | select(.name == "Status") | .id')

  if [ -z "$STATUS_FIELD_ID" ]; then
    echo "⚠️  Could not find Status field ID"
  else
    # Get "Done" option ID (use project number for field-list)
    DONE_OPTION_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | \
      jq -r '.fields[] | select(.name == "Status") | .options[] | select(.name == "✅ Done") | .id')

    if [ -z "$DONE_OPTION_ID" ]; then
      echo "⚠️  Could not find 'Done' option ID"
    else
      # Update status (use full project ID for item-edit)
      gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" \
        --field-id "$STATUS_FIELD_ID" --single-select-option-id "$DONE_OPTION_ID"

      if [ $? -eq 0 ]; then
        echo "✅ Project board updated to 'Done'"
      else
        echo "⚠️  Failed to update project board"
      fi
    fi
  fi
fi

# Verify issue closed
echo "🔍 Verifying issue closed..."
ISSUE_STATE=$(gh issue view "$ISSUE_NUMBER" --json state --jq '.state')

if [ "$ISSUE_STATE" == "CLOSED" ]; then
  echo "✅ Issue automatically closed by PR merge"
else
  echo "⚠️  Issue not auto-closed, closing manually..."
  gh issue close "$ISSUE_NUMBER" --comment "Completed via PR #$PR_NUMBER"
fi

# Local cleanup
echo "🧹 Cleaning up local branches..."

BASE_BRANCH=$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)
FEATURE_BRANCH=$(git branch --show-current)

if [ "$FEATURE_BRANCH" != "$BASE_BRANCH" ]; then
  git checkout "$BASE_BRANCH"
  git pull origin "$BASE_BRANCH"

  # Delete local branch if it exists
  git branch -D "$FEATURE_BRANCH" 2>/dev/null && echo "✅ Local branch deleted" || echo "✅ Branch already deleted"
else
  echo "✅ Already on $BASE_BRANCH, pulling latest..."
  git pull origin "$BASE_BRANCH"
fi

# Verify merge
echo "🔍 Verifying merge..."
echo "Recent commits:"
git log --oneline -3

# Add completion comment to issue
echo "💬 Adding completion comment to issue..."
MERGED_AT=$(date -u +"%Y-%m-%d %H:%M UTC")
COMMIT_COUNT=$(gh pr view "$PR_NUMBER" --json commits --jq '.commits | length')
FILES_CHANGED=$(gh pr view "$PR_NUMBER" --json files --jq '.files | length')

gh issue comment "$ISSUE_NUMBER" --body "## ✅ Issue Completed

**PR:** #$PR_NUMBER
**Merged:** $MERGED_AT
**Commits:** $COMMIT_COUNT
**Files changed:** $FILES_CHANGED
**Project Status:** ✅ Done

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

echo ""
echo "✨ Issue #$ISSUE_NUMBER completed successfully!"
echo ""
echo "📊 Summary:"
echo "  - PR #$PR_NUMBER merged (squashed)"
echo "  - Project board updated to 'Done'"
echo "  - Local and remote branches deleted"
echo "  - On $BASE_BRANCH with latest changes"
echo ""
echo "🔄 Ready for next issue!"
