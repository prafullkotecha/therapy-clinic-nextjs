#!/bin/bash
set -e

# worktree-reset.sh - Reset worktree to clean state
# Usage: ./worktree-reset.sh <worktree-name>

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

echo -e "${BLUE}Resetting worktree: ${YELLOW}$WORKTREE_NAME${NC}"
echo "Path: $WORKTREE_PATH"
echo ""

cd "$WORKTREE_PATH"

# Check for uncommitted changes
if [ -n "$(git status --short)" ]; then
  echo -e "${YELLOW}Stashing uncommitted changes...${NC}"
  git stash push -m "Worktree reset $(date +%Y-%m-%d_%H:%M:%S)"
  echo -e "${GREEN}✓ Changes stashed${NC}"
fi

# Checkout base branch
echo "Checking out base branch: $BASE_BRANCH"
git checkout "$BASE_BRANCH"

# Pull latest changes
echo "Pulling latest changes..."
git pull origin "$BASE_BRANCH"

echo -e "${GREEN}✓ Worktree reset to $BASE_BRANCH${NC}"
echo ""

# Ask about reinstalling dependencies
read -p "Reinstall dependencies? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Installing dependencies..."
  npm install
  echo -e "${GREEN}✓ Dependencies reinstalled${NC}"
fi

echo ""
echo -e "${GREEN}Worktree $WORKTREE_NAME reset successfully${NC}"
echo ""
echo "To see stashed changes:"
echo "  cd $WORKTREE_PATH"
echo "  git stash list"
echo "  git stash pop  # To restore changes"
