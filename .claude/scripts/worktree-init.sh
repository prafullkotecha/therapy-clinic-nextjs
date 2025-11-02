#!/bin/bash
set -e

# worktree-init.sh - Initialize parallel workflow with 4 git worktrees
# Creates dev-1, dev-2, pr-review, and ci-cd worktrees with Claude awareness

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKTREE_DIR="$PROJECT_ROOT/worktrees"
BASE_BRANCH="pk/issue-5-convert-prisma-to-drizzle"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Git Worktrees Parallel Workflow Setup${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if we're in a git repository
if [ ! -d "$PROJECT_ROOT/.git" ]; then
  echo -e "${RED}Error: Not in a git repository${NC}"
  exit 1
fi

# Check if worktrees directory already exists
if [ -d "$WORKTREE_DIR" ]; then
  echo -e "${YELLOW}Warning: worktrees/ directory already exists${NC}"
  read -p "Remove and recreate? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Removing existing worktrees..."
    git worktree remove "$WORKTREE_DIR/dev-1" --force 2>/dev/null || true
    git worktree remove "$WORKTREE_DIR/dev-2" --force 2>/dev/null || true
    git worktree remove "$WORKTREE_DIR/pr-review" --force 2>/dev/null || true
    git worktree remove "$WORKTREE_DIR/ci-cd" --force 2>/dev/null || true
    rm -rf "$WORKTREE_DIR"
  else
    echo "Aborted."
    exit 0
  fi
fi

# Create worktrees directory
echo -e "${GREEN}Creating worktrees directory...${NC}"
mkdir -p "$WORKTREE_DIR"

# Create issue assignment tracking file
ASSIGNMENTS_FILE="$PROJECT_ROOT/.worktree-assignments.json"
echo -e "${GREEN}Creating issue assignment tracking file...${NC}"
cat > "$ASSIGNMENTS_FILE" <<EOF
{
  "dev-1": null,
  "dev-2": null,
  "pr-review": null,
  "ci-cd": null
}
EOF
echo -e "${GREEN}  ✓ Created $ASSIGNMENTS_FILE${NC}"

# Worktree configurations: name, port, role, purpose, testing guidelines
declare -A WORKTREES=(
  ["dev-1"]="3001:development:Feature development worktree #1:Run quick checks only, delegate heavy tests to ci-cd"
  ["dev-2"]="3002:development:Feature development worktree #2:Run quick checks only, delegate heavy tests to ci-cd"
  ["pr-review"]="3003:pr-review:PR review and testing:Light testing only, focus on reviewing"
  ["ci-cd"]="3004:ci-cd:Testing, builds, and CI operations:Run comprehensive test suites, coverage, and CI checks"
)

# Create each worktree
for name in dev-1 dev-2 pr-review ci-cd; do
  IFS=':' read -r port role purpose testing <<< "${WORKTREES[$name]}"
  branch="worktree/$name"
  path="$WORKTREE_DIR/$name"

  echo ""
  echo -e "${BLUE}Creating worktree: ${YELLOW}$name${NC}"
  echo "  Path: $path"
  echo "  Branch: $branch"
  echo "  Port: $port"
  echo "  Role: $role"

  # Create worktree with new branch based on BASE_BRANCH
  cd "$PROJECT_ROOT"
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    echo -e "${YELLOW}  Branch $branch already exists, using it${NC}"
    git worktree add "$path" "$branch"
  else
    git worktree add "$path" -b "$branch" "$BASE_BRANCH"
  fi

  # Create .worktree-config.json
  cd "$path"
  cat > .worktree-config.json <<EOF
{
  "name": "$name",
  "role": "$role",
  "port": $port,
  "guidelines": {
    "purpose": "$purpose",
    "devServer": "Always use port $port",
    "testing": "$testing",
    "branches": "Create feature branches normally"
  }
}
EOF

  # Create .env.local with port override
  cat > .env.local <<EOF
# Worktree: $name
# Port: $port
PORT=$port
EOF

  # Create WORKTREE.md info file
  cat > WORKTREE.md <<EOF
# Worktree: $name

**Port**: $port
**Branch**: $branch
**Role**: $role
**Purpose**: $purpose

## Quick Start

\`\`\`bash
# Start dev server
cd $path
npm run dev  # Will use port $port

# Open Claude Code
cd $path
claude .
\`\`\`

## Guidelines

- **Testing**: $testing
- **Branches**: Create feature branches normally (pk/issue-N-description)
- **Dev Server**: Always runs on port $port

## Commands

All standard commands work:
- \`/work-issue N\` - Work on issue
- \`/complete-issue N\` - Complete issue
- \`/review-pr N\` - Review PR
- \`/type-check\` - Type checking
- \`/verify-app\` - Verify app

Claude will automatically detect this is a worktree and adjust behavior.
EOF

  echo -e "${GREEN}  ✓ Worktree created${NC}"
  echo "  Installing dependencies..."

  # Install dependencies
  npm install --silent

  echo -e "${GREEN}  ✓ Dependencies installed${NC}"
done

# Summary
echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}✓ Worktrees Created Successfully!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Worktree locations:"
echo ""
for name in dev-1 dev-2 pr-review ci-cd; do
  IFS=':' read -r port role purpose testing <<< "${WORKTREES[$name]}"
  echo -e "  ${YELLOW}$name${NC}"
  echo "    Path: $WORKTREE_DIR/$name"
  echo "    Port: $port"
  echo "    Role: $role"
  echo ""
done

echo "To open Claude Code sessions:"
echo ""
echo -e "  ${BLUE}# Terminal 1${NC}"
echo "  cd $WORKTREE_DIR/dev-1"
echo "  claude ."
echo ""
echo -e "  ${BLUE}# Terminal 2${NC}"
echo "  cd $WORKTREE_DIR/dev-2"
echo "  claude ."
echo ""
echo -e "  ${BLUE}# Terminal 3${NC}"
echo "  cd $WORKTREE_DIR/pr-review"
echo "  claude ."
echo ""
echo -e "  ${BLUE}# Terminal 4${NC}"
echo "  cd $WORKTREE_DIR/ci-cd"
echo "  claude ."
echo ""

echo "Management commands:"
echo "  ./.claude/scripts/worktree-list.sh       - Show worktree status"
echo "  ./.claude/scripts/worktree-clean.sh NAME - Remove worktree"
echo "  ./.claude/scripts/worktree-sync.sh NAME  - Sync with base branch"
echo ""

echo "For more information, see:"
echo "  ./.claude/docs/WORKTREE_GUIDE.md"
echo ""
echo -e "${GREEN}Ready for parallel development!${NC} 🚀"
