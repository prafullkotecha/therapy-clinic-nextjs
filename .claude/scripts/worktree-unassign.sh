#!/bin/bash
set -e

# worktree-unassign.sh - Remove issue assignment from a worktree
# Usage: ./worktree-unassign.sh <worktree-name> [issue-number]

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ASSIGNMENTS_FILE="$PROJECT_ROOT/.worktree-assignments.json"

# Check arguments
if [ $# -eq 0 ]; then
  echo -e "${RED}Error: Worktree name required${NC}"
  echo ""
  echo "Usage: $0 <worktree-name> [issue-number]"
  echo ""
  echo "Examples:"
  echo "  $0 dev-1           # Unassign whatever is assigned to dev-1"
  echo "  $0 dev-1 42        # Unassign issue #42 from dev-1 (with verification)"
  exit 1
fi

WORKTREE_NAME="$1"
ISSUE_NUMBER="${2:-}"

# Check if assignments file exists
if [ ! -f "$ASSIGNMENTS_FILE" ]; then
  echo -e "${YELLOW}No assignments file found. Nothing to unassign.${NC}"
  exit 0
fi

# If issue number provided, verify it's assigned to this worktree
if [ -n "$ISSUE_NUMBER" ]; then
  CURRENT_ASSIGNMENT=$(jq -r ".[\"$WORKTREE_NAME\"]" "$ASSIGNMENTS_FILE")

  if [ "$CURRENT_ASSIGNMENT" == "null" ]; then
    echo -e "${YELLOW}$WORKTREE_NAME has no issue assigned${NC}"
    exit 0
  fi

  if [ "$CURRENT_ASSIGNMENT" != "$ISSUE_NUMBER" ]; then
    echo -e "${YELLOW}Warning: $WORKTREE_NAME is assigned to issue #$CURRENT_ASSIGNMENT, not #$ISSUE_NUMBER${NC}"
    read -p "Unassign issue #$CURRENT_ASSIGNMENT anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Aborted."
      exit 0
    fi
  fi
fi

# Get current assignment for display
CURRENT=$(jq -r ".[\"$WORKTREE_NAME\"]" "$ASSIGNMENTS_FILE")

# Unassign
jq ".[\"$WORKTREE_NAME\"] = null" "$ASSIGNMENTS_FILE" > "$ASSIGNMENTS_FILE.tmp"
mv "$ASSIGNMENTS_FILE.tmp" "$ASSIGNMENTS_FILE"

if [ "$CURRENT" != "null" ]; then
  echo -e "${GREEN}✓ Issue #$CURRENT unassigned from $WORKTREE_NAME${NC}"
else
  echo -e "${YELLOW}$WORKTREE_NAME had no issue assigned${NC}"
fi
