#!/bin/bash
set -e

# worktree-clean.sh - Safely remove a worktree
# Usage: ./worktree-clean.sh <worktree-name>

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKTREE_DIR="$PROJECT_ROOT/worktrees"

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

echo -e "${BLUE}Cleaning worktree: ${YELLOW}$WORKTREE_NAME${NC}"
echo "Path: $WORKTREE_PATH"
echo ""

# Check for dev server
if [ -f "$WORKTREE_PATH/.env.local" ]; then
  port=$(grep "^PORT=" "$WORKTREE_PATH/.env.local" 2>/dev/null | cut -d= -f2)
  if [ -n "$port" ]; then
    if lsof -i:$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      echo -e "${YELLOW}Warning: Dev server is running on port $port${NC}"
      pid=$(lsof -i:$port -sTCP:LISTEN -t)
      read -p "Stop dev server? (y/N): " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $pid
        echo -e "${GREEN}✓ Dev server stopped${NC}"
      else
        echo -e "${RED}Aborted. Stop dev server first.${NC}"
        exit 1
      fi
    fi
  fi
fi

# Check for uncommitted changes
cd "$WORKTREE_PATH"
if [ -n "$(git status --short)" ]; then
  echo -e "${YELLOW}Warning: Uncommitted changes detected${NC}"
  git status --short
  echo ""
  read -p "Continue anyway? Changes will be lost. (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# Get branch name
branch=$(git branch --show-current)

# Remove worktree
cd "$PROJECT_ROOT"
echo "Removing worktree..."
git worktree remove "$WORKTREE_PATH" --force

echo -e "${GREEN}✓ Worktree removed${NC}"
echo ""

# Ask about deleting branch
if [ "$branch" != "worktree/$WORKTREE_NAME" ] && [ "$branch" != "master" ] && [ "$branch" != "main" ]; then
  read -p "Delete branch '$branch'? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git branch -D "$branch"
    echo -e "${GREEN}✓ Branch deleted${NC}"
  fi
else
  # Auto-delete default worktree branch
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    git branch -D "$branch" 2>/dev/null || true
  fi
fi

echo ""
echo -e "${GREEN}Worktree $WORKTREE_NAME cleaned up successfully${NC}"
