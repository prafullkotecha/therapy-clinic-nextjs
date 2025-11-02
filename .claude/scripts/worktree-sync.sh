#!/bin/bash
set -e

# worktree-sync.sh - Sync worktree with latest base branch
# Usage: ./worktree-sync.sh <worktree-name>

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKTREE_DIR="$PROJECT_ROOT/worktrees"
BASE_BRANCH="pk/issue-5-convert-prisma-to-drizzle"

# Check arguments
if [ $# -eq 0 ]; then
  echo -e "${RED}Error: Worktree name required${NC}"
  echo ""
  echo "Usage: $0 <worktree-name>"
  echo ""
  echo "Available worktrees:"
  for dir in "$WORKTREE_DIR"/*; do
    if [ -d "$dir" ]; then
      echo "  - $(basename "$dir")"
    fi
  done
  exit 1
fi

WORKTREE_NAME="$1"
WORKTREE_PATH="$WORKTREE_DIR/$WORKTREE_NAME"

# Check if worktree exists
if [ ! -d "$WORKTREE_PATH" ]; then
  echo -e "${RED}Error: Worktree '$WORKTREE_NAME' does not exist${NC}"
  exit 1
fi

echo -e "${BLUE}Syncing worktree: ${YELLOW}$WORKTREE_NAME${NC}"
echo "Path: $WORKTREE_PATH"
echo ""

cd "$WORKTREE_PATH"

# Get current branch
current_branch=$(git branch --show-current)
echo "Current branch: $current_branch"

# Check for uncommitted changes
if [ -n "$(git status --short)" ]; then
  echo -e "${YELLOW}Warning: Uncommitted changes detected${NC}"
  git status --short
  echo ""
  read -p "Stash changes and continue? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git stash push -m "Worktree sync $(date +%Y-%m-%d_%H:%M:%S)"
    echo -e "${GREEN}✓ Changes stashed${NC}"
  else
    echo "Aborted."
    exit 1
  fi
fi

# Fetch latest
echo "Fetching latest changes..."
git fetch origin

# Rebase on base branch
echo "Rebasing on $BASE_BRANCH..."
if git rebase "origin/$BASE_BRANCH"; then
  echo -e "${GREEN}✓ Successfully rebased on $BASE_BRANCH${NC}"
else
  echo -e "${RED}Rebase failed. Conflicts detected.${NC}"
  echo ""
  echo "To resolve conflicts:"
  echo "  1. Fix conflicts in files"
  echo "  2. git add <file>"
  echo "  3. git rebase --continue"
  echo ""
  echo "To abort rebase:"
  echo "  git rebase --abort"
  exit 1
fi

echo ""
echo -e "${GREEN}Worktree $WORKTREE_NAME synced successfully${NC}"
echo ""
echo "To restore stashed changes:"
echo "  cd $WORKTREE_PATH"
echo "  git stash pop"
