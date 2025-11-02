#!/bin/bash
set -e

# worktree-dev.sh - Start dev server in specified worktree
# Usage: ./worktree-dev.sh <worktree-name>

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

# Get port from .env.local
if [ ! -f "$WORKTREE_PATH/.env.local" ]; then
  echo -e "${RED}Error: .env.local not found in worktree${NC}"
  exit 1
fi

port=$(grep "^PORT=" "$WORKTREE_PATH/.env.local" | cut -d= -f2)

if [ -z "$port" ]; then
  echo -e "${RED}Error: PORT not defined in .env.local${NC}"
  exit 1
fi

# Check if port is already in use
if lsof -i:$port -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo -e "${YELLOW}Dev server already running on port $port${NC}"
  pid=$(lsof -i:$port -sTCP:LISTEN -t)
  echo "PID: $pid"
  echo ""
  read -p "Restart server? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stopping existing server..."
    kill -9 $pid
    sleep 1
  else
    echo "Aborted."
    exit 0
  fi
fi

echo -e "${BLUE}Starting dev server in worktree: ${YELLOW}$WORKTREE_NAME${NC}"
echo "Path: $WORKTREE_PATH"
echo "Port: $port"
echo ""

cd "$WORKTREE_PATH"

# Start dev server in background
LOG_FILE="$WORKTREE_PATH/worktree-dev.log"
echo "Starting server (log: $LOG_FILE)..."

nohup npm run dev > "$LOG_FILE" 2>&1 &
DEV_PID=$!

echo -e "${GREEN}✓ Dev server started${NC}"
echo "PID: $DEV_PID"
echo ""
echo "To view logs:"
echo "  tail -f $LOG_FILE"
echo ""
echo "To stop server:"
echo "  kill -9 $DEV_PID"
echo "  # or"
echo "  lsof -i:$port -sTCP:LISTEN -t | xargs kill -9"
echo ""
echo "Access at: http://localhost:$port"
