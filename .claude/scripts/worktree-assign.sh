#!/bin/bash
set -e

# worktree-assign.sh - Assign an issue to a worktree
# Usage: ./worktree-assign.sh <worktree-name> <issue-number>

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ASSIGNMENTS_FILE="$PROJECT_ROOT/.worktree-assignments.json"

# Check arguments
if [ $# -ne 2 ]; then
  echo -e "${RED}Error: Worktree name and issue number required${NC}"
  echo ""
  echo "Usage: $0 <worktree-name> <issue-number>"
  echo ""
  echo "Example: $0 dev-1 42"
  exit 1
fi

WORKTREE_NAME="$1"
ISSUE_NUMBER="$2"

# Validate issue number is numeric
if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
  echo -e "${RED}Error: Issue number must be numeric${NC}"
  exit 1
fi

# Create assignments file if it doesn't exist
if [ ! -f "$ASSIGNMENTS_FILE" ]; then
  cat > "$ASSIGNMENTS_FILE" <<EOF
{
  "dev-1": null,
  "dev-2": null,
  "pr-review": null,
  "ci-cd": null
}
EOF
fi

# Check if issue is already assigned to another worktree
ASSIGNED_TO=$(jq -r "to_entries[] | select(.value == $ISSUE_NUMBER) | .key" "$ASSIGNMENTS_FILE")

if [ -n "$ASSIGNED_TO" ]; then
  if [ "$ASSIGNED_TO" == "$WORKTREE_NAME" ]; then
    echo -e "${YELLOW}Issue #$ISSUE_NUMBER is already assigned to $WORKTREE_NAME${NC}"
    exit 0
  else
    echo -e "${RED}Error: Issue #$ISSUE_NUMBER is already assigned to $ASSIGNED_TO${NC}"
    echo ""
    echo "To reassign, first unassign from $ASSIGNED_TO:"
    echo "  ./.claude/scripts/worktree-unassign.sh $ASSIGNED_TO"
    exit 1
  fi
fi

# Assign issue to worktree
jq ".[\"$WORKTREE_NAME\"] = $ISSUE_NUMBER" "$ASSIGNMENTS_FILE" > "$ASSIGNMENTS_FILE.tmp"
mv "$ASSIGNMENTS_FILE.tmp" "$ASSIGNMENTS_FILE"

echo -e "${GREEN}✓ Issue #$ISSUE_NUMBER assigned to $WORKTREE_NAME${NC}"
