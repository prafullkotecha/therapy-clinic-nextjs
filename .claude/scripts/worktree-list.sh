#!/bin/bash

# worktree-list.sh - Show status of all worktrees
# Displays git worktrees, branches, changes, and dev server status

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKTREE_DIR="$PROJECT_ROOT/worktrees"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Git Worktrees Status${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Show git worktree list
echo -e "${CYAN}Git Worktrees:${NC}"
echo "=============="
cd "$PROJECT_ROOT"
git worktree list

echo ""
echo -e "${CYAN}Worktree Details:${NC}"
echo "================="

# Check if worktrees directory exists
if [ ! -d "$WORKTREE_DIR" ]; then
  echo -e "${YELLOW}No worktrees directory found.${NC}"
  echo ""
  echo "To create worktrees, run:"
  echo "  ./.claude/scripts/worktree-init.sh"
  exit 0
fi

# Show details for each worktree
for dir in "$WORKTREE_DIR"/*; do
  if [ -d "$dir" ]; then
    name=$(basename "$dir")
    cd "$dir"

    echo ""
    echo -e "${YELLOW}Worktree: $name${NC}"

    # Get current branch
    branch=$(git branch --show-current)
    echo "  Branch: $branch"

    # Count changes
    changes=$(git status --short | wc -l)
    if [ "$changes" -gt 0 ]; then
      echo -e "  Changes: ${YELLOW}$changes uncommitted${NC}"
    else
      echo -e "  Changes: ${GREEN}Clean${NC}"
    fi

    # Check dev server status
    if [ -f .env.local ]; then
      port=$(grep "^PORT=" .env.local 2>/dev/null | cut -d= -f2)
      if [ -n "$port" ]; then
        if lsof -i:$port -sTCP:LISTEN -t >/dev/null 2>&1; then
          echo -e "  Dev Server: ${GREEN}🟢 Running on :$port${NC}"
        else
          echo -e "  Dev Server: ⚪ Stopped (port $port)"
        fi
      fi
    fi

    # Show last commit
    last_commit=$(git log -1 --oneline 2>/dev/null || echo "No commits")
    echo "  Last Commit: $last_commit"

    # Show role from config
    if [ -f .worktree-config.json ]; then
      role=$(grep -o '"role"[[:space:]]*:[[:space:]]*"[^"]*"' .worktree-config.json | cut -d'"' -f4)
      echo "  Role: $role"
    fi

    # Show assigned issue
    ASSIGNMENTS_FILE="$PROJECT_ROOT/.worktree-assignments.json"
    if [ -f "$ASSIGNMENTS_FILE" ]; then
      assigned=$(jq -r ".[\"$name\"]" "$ASSIGNMENTS_FILE" 2>/dev/null)
      if [ "$assigned" != "null" ] && [ -n "$assigned" ]; then
        echo -e "  Assigned: ${CYAN}Issue #$assigned${NC}"
      else
        echo "  Assigned: None"
      fi
    fi
  fi
done

echo ""
echo -e "${BLUE}=====================================${NC}"
echo ""

# Show helpful commands
echo "Management commands:"
echo "  ./.claude/scripts/worktree-install-deps.sh NAME - Install deps"
echo "  ./.claude/scripts/worktree-clean.sh NAME       - Remove worktree"
echo "  ./.claude/scripts/worktree-reset.sh NAME       - Reset worktree"
echo "  ./.claude/scripts/worktree-sync.sh NAME        - Sync with base"
echo ""
