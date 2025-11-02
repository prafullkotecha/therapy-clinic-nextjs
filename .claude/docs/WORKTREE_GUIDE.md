# Git Worktrees Parallel Workflow Guide

Complete guide for running multiple Claude Code sessions in parallel using git worktrees.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Setup](#setup)
- [Usage](#usage)
- [Claude Awareness](#claude-awareness)
- [Management Scripts](#management-scripts)
- [Workflows](#workflows)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Advanced Topics](#advanced-topics)

## Overview

### What is This?

A system for running **4 Claude Code sessions in parallel** using git worktrees:
- **2 Development worktrees** (dev-1, dev-2) - Concurrent feature work
- **1 PR Review worktree** (pr-review) - Review PRs without context switching
- **1 CI/CD worktree** (ci-cd) - Tests, builds, CI operations

### Why Use This?

**Without worktrees:**
- Work on issue #42 → branch pk/issue-42
- Need to review PR #55 → stash changes, checkout PR branch
- PR needs fixes → stash review, checkout back to issue-42
- Want to start issue #43 → can't, already working on #42

**With worktrees:**
- Terminal 1: Claude works on issue #42 in dev-1
- Terminal 2: Claude works on issue #43 in dev-2
- Terminal 3: Claude reviews PR #55 in pr-review
- Terminal 4: Claude runs tests in ci-cd
- **No context switching, no stashing, no conflicts**

### Key Benefits

✅ **Parallel development** - Work on multiple issues simultaneously
✅ **No context switching** - Each worktree preserves its state
✅ **Isolated testing** - Run tests without affecting dev work
✅ **PR reviews** - Review without disrupting current work
✅ **Resource sharing** - Share database, Redis, node_modules
✅ **Claude-aware** - Each session knows its role automatically

## Quick Start

### Initial Setup (One-Time)

```bash
# From project root
cd /home/prafull/code/therapy-clinic-nextjs

# Create all 4 worktrees
./.claude/scripts/worktree-init.sh

# Takes ~5 minutes, installs deps in each worktree
```

### Open Parallel Sessions

```bash
# Terminal 1 - Development worktree 1
cd worktrees/dev-1
claude .

# Terminal 2 - Development worktree 2
cd worktrees/dev-2
claude .

# Terminal 3 - PR Review worktree
cd worktrees/pr-review
claude .

# Terminal 4 - CI/CD worktree
cd worktrees/ci-cd
claude .
```

### Use Normally

All existing commands work identically:
- `/work-issue 42` - Create branch, work on issue
- `/complete-issue 42` - Merge PR, update board
- `/review-pr 55` - Review pull request
- `/type-check` - Run type checking

Claude automatically knows which worktree it's in and behaves accordingly.

## Architecture

### Directory Structure

```
therapy-clinic-nextjs/              # Main worktree (master branch)
├── .git/                           # Shared git directory
├── worktrees/                      # All worktrees (gitignored)
│   ├── dev-1/                      # Development worktree 1
│   │   ├── node_modules/           # Independent deps (~1.4GB)
│   │   ├── .next/                  # Isolated build
│   │   ├── .env.local              # PORT=3001
│   │   ├── .worktree-config.json   # Role config for Claude
│   │   ├── WORKTREE.md             # Info
│   │   └── ... (full project)
│   ├── dev-2/                      # Development worktree 2
│   │   ├── node_modules/           # Independent deps
│   │   ├── .env.local              # PORT=3002
│   │   └── ...
│   ├── pr-review/                  # PR review worktree
│   │   ├── node_modules/           # Independent deps
│   │   ├── .env.local              # PORT=3003
│   │   └── ...
│   └── ci-cd/                      # CI/CD worktree
│       ├── node_modules/           # Independent deps
│       ├── .env.local              # PORT=3004
│       └── ...
├── .claude/
│   ├── docs/WORKTREE_GUIDE.md      # This file
│   ├── scripts/                    # Management scripts
│   │   ├── worktree-init.sh
│   │   ├── worktree-list.sh
│   │   └── ...
│   └── commands/
│       └── worktree-status.md
├── src/
├── package.json
└── ...
```

### Shared Resources

**Shared across all worktrees:**
- `.git/` directory - Single git repository
- PostgreSQL database - Port 5432
- Redis cache - Port 6379
- Git branches - Can't checkout same branch twice

**Isolated per worktree:**
- `node_modules/` - Independent dependencies (~1.4GB each)
- `.next/` - Separate builds (different ports)
- `coverage/` - Test coverage reports
- `test-results/` - Playwright results
- Dev server - Unique port per worktree

### Port Assignments

| Worktree | Port | Purpose |
|----------|------|---------|
| Main | 3000 | Your direct work |
| dev-1 | 3001 | Claude feature dev #1 |
| dev-2 | 3002 | Claude feature dev #2 |
| pr-review | 3003 | Claude PR reviews |
| ci-cd | 3004 | Claude tests/builds |

### Disk Usage

- Main worktree: ~1.4GB (node_modules)
- Each worktree: ~1.5GB (node_modules + files)
- **Total: ~7GB** for full parallel system

## Setup

### Prerequisites

- Git 2.5+ (worktree support)
- Node.js 18+ and npm
- ~7GB free disk space
- Claude Code installed

### Installation

```bash
# 1. Navigate to project root
cd /home/prafull/code/therapy-clinic-nextjs

# 2. Run init script
./.claude/scripts/worktree-init.sh

# Script will:
# - Create worktrees/ directory
# - Create 4 worktrees with unique branches
# - Install dependencies in each worktree
# - Create .worktree-config.json in each
# - Create .env.local with ports
# - Show summary of created worktrees
```

### What Gets Created

**Each worktree gets:**

1. **`.worktree-config.json`** - Role configuration:
```json
{
  "name": "dev-1",
  "role": "development",
  "port": 3001,
  "guidelines": {
    "purpose": "Feature development worktree #1",
    "devServer": "Always use port 3001",
    "testing": "Run quick checks only, delegate heavy tests to ci-cd",
    "branches": "Create feature branches normally"
  }
}
```

2. **`.env.local`** - Port override:
```bash
# Worktree: dev-1
# Port: 3001
PORT=3001
```

3. **`WORKTREE.md`** - Human-readable info:
```markdown
# Worktree: dev-1

**Port**: 3001
**Branch**: worktree/dev-1
**Purpose**: Feature development

To start dev server:
cd /home/prafull/code/therapy-clinic-nextjs/worktrees/dev-1
npm run dev  # Will use port 3001
```

4. **Full project files** - Complete copy of working directory
5. **Independent node_modules** - Dedicated dependencies

## Usage

### Opening Claude Sessions

```bash
# Start multiple terminal sessions

# Terminal 1
cd worktrees/dev-1
claude .

# Terminal 2
cd worktrees/dev-2
claude .

# Terminal 3
cd worktrees/pr-review
claude .

# Terminal 4
cd worktrees/ci-cd
claude .
```

### Working in Dev Worktrees

**In dev-1 or dev-2:**

```
You: /work-issue 42
Claude: [dev-1] Creating branch pk/issue-42-client-intake-form...
Claude: [dev-1] Starting dev server on port 3001...
Claude: [dev-1] Working on client intake form implementation...
```

All commands work normally:
- `/work-issue` - Creates branch, implements feature
- `/verify-app` - Runs on port 3001
- `/type-check` - Quick type check
- Commits and pushes work

**For heavy testing:**
```
Claude: [dev-1] For full test suite with coverage, use ci-cd worktree
Claude: [dev-1] Or run here: npm run test:coverage
```

### Reviewing PRs

**In pr-review worktree:**

```
You: /review-pr 55
Claude: [pr-review] Checking out PR #55...
Claude: [pr-review] Starting dev server on port 3003...
Claude: [pr-review] Reviewing changes...
Claude: [pr-review] Found 3 issues, posting comments...
```

No impact on dev-1/dev-2 work.

### Running Tests

**In ci-cd worktree:**

```
You: Run full test suite with coverage
Claude: [ci-cd] Running comprehensive tests...
Claude: [ci-cd] ✓ Unit tests: 150 passed
Claude: [ci-cd] ✓ Type check: No errors
Claude: [ci-cd] ✓ Coverage: 85%
```

Runs on dedicated worktree, doesn't slow down dev work.

### Completing Issues

**From any worktree:**

```
You: /complete-issue 42
Claude: [dev-1] Merging PR #70...
Claude: [dev-1] ✅ Issue #42 complete
Claude: [dev-1] Recommending next: Issue #43
```

Works identically from any location.

## Claude Awareness

### How Claude Knows

When Claude starts in a worktree:

1. Checks for `.worktree-config.json` at project root
2. If found, reads role configuration
3. Adjusts behavior based on guidelines
4. Prefixes responses with worktree name

### Behavioral Adjustments

**Development Worktrees (dev-1, dev-2):**
- Uses PORT from .env.local for dev server
- Runs quick type checks before commits
- Suggests ci-cd for full test suites
- Creates feature branches normally
- Prefixes: `[dev-1]` or `[dev-2]`

**PR Review Worktree:**
- Uses port 3003 for dev server
- Never creates feature branches
- Focuses on review commands
- Checks out PR branches for review
- Prefix: `[pr-review]`

**CI/CD Worktree:**
- Rarely uses dev server (port 3004 if needed)
- Runs comprehensive tests
- Handles database migrations
- Generates coverage reports
- Prefix: `[ci-cd]`

### Commands Compatibility

All existing commands work identically:

| Command | Main | Worktrees | Behavior |
|---------|------|-----------|----------|
| `/work-issue N` | ✅ | ✅ | Creates pk/issue-N branch |
| `/complete-issue N` | ✅ | ✅ | Merges PR, updates board |
| `/suggest-next-issue` | ✅ | ✅ | Analyzes, suggests next |
| `/review-pr N` | ✅ | ✅ | Reviews pull request |
| `/type-check` | ✅ | ✅ | Runs type checking |
| `/hipaa-check` | ✅ | ✅ | Runs HIPAA audit |
| `/verify-app` | ✅ | ✅ | Verifies app runs |
| `npm run dev` | Port 3000 | Port from .env | Auto port |

**No workflow changes needed.** Everything works as before.

## Management Scripts

### worktree-init.sh

**Purpose:** Initial setup, creates all 4 worktrees

```bash
./.claude/scripts/worktree-init.sh
```

**What it does:**
1. Creates `worktrees/` directory
2. Creates 4 worktrees with branches
3. Installs dependencies in each
4. Creates config files (.worktree-config.json, .env.local)
5. Shows summary

**Run once** during initial setup.

### worktree-list.sh

**Purpose:** Show status of all worktrees

```bash
./.claude/scripts/worktree-list.sh
```

**Output:**
```
Git Worktrees:
==============
/home/prafull/code/therapy-clinic-nextjs  98dca9f [master]
/home/prafull/code/therapy-clinic-nextjs/worktrees/dev-1  a1b2c3d [pk/issue-42-client-intake]
/home/prafull/code/therapy-clinic-nextjs/worktrees/dev-2  d4e5f6g [pk/issue-43-matching-algo]
/home/prafull/code/therapy-clinic-nextjs/worktrees/pr-review  h7i8j9k [pr/55-review]
/home/prafull/code/therapy-clinic-nextjs/worktrees/ci-cd  98dca9f [master]

Worktree Status:
================

Worktree: dev-1
  Branch: pk/issue-42-client-intake (3 changes)
  Status: 🟢 Dev server running on :3001
  Last commit: feat: implement client intake form

Worktree: dev-2
  Branch: pk/issue-43-matching-algo (1 change)
  Status: ⚪ Dev server stopped
  Last commit: feat: add matching algorithm

Worktree: pr-review
  Branch: pr/55-review
  Status: 🟢 Dev server running on :3003
  Last commit: Merge pull request #55

Worktree: ci-cd
  Branch: master
  Status: ⚪ Dev server stopped
  Last commit: feat: implement specialization management
```

**Use:** Check status anytime

### worktree-install-deps.sh

**Purpose:** Install dependencies in specific worktree

```bash
./.claude/scripts/worktree-install-deps.sh dev-1
```

**What it does:**
1. Changes to specified worktree
2. Runs `npm install`
3. Verifies installation

**Use:** After updating package.json

### worktree-clean.sh

**Purpose:** Remove a worktree safely

```bash
./.claude/scripts/worktree-clean.sh dev-1
```

**What it does:**
1. Stops dev server if running
2. Warns about uncommitted changes
3. Removes worktree using `git worktree remove`
4. Optionally deletes branch

**Use:** When done with a worktree

### worktree-reset.sh

**Purpose:** Reset worktree to clean state

```bash
./.claude/scripts/worktree-reset.sh dev-1
```

**What it does:**
1. Stashes any uncommitted changes
2. Checks out base branch
3. Pulls latest changes
4. Reinstalls dependencies if needed

**Use:** Clean slate without recreating worktree

### worktree-sync.sh

**Purpose:** Sync worktree with latest base branch

```bash
./.claude/scripts/worktree-sync.sh dev-1
```

**What it does:**
1. Fetches latest from origin
2. Rebases current branch on base branch
3. Handles conflicts if any

**Use:** Keep worktree up-to-date

### worktree-dev.sh

**Purpose:** Start dev server in worktree

```bash
./.claude/scripts/worktree-dev.sh dev-1
```

**What it does:**
1. Changes to worktree
2. Starts `npm run dev` on correct port
3. Runs in background
4. Logs to worktree.log

**Use:** Start dev server from outside worktree

## Workflows

### Parallel Feature Development

**Scenario:** Work on issues #42 and #43 simultaneously

**Terminal 1 (dev-1):**
```bash
cd worktrees/dev-1
claude .
```
```
You: /work-issue 42
Claude: [dev-1] Working on client intake form...
# Claude works on issue #42
```

**Terminal 2 (dev-2):**
```bash
cd worktrees/dev-2
claude .
```
```
You: /work-issue 43
Claude: [dev-2] Working on matching algorithm...
# Claude works on issue #43
```

**Both complete independently, no conflicts.**

### Review PR While Developing

**Scenario:** Issue #42 in progress, PR #55 needs review

**Terminal 1 (dev-1):**
```bash
# Already running, working on issue #42
# No interruption
```

**Terminal 2 (pr-review):**
```bash
cd worktrees/pr-review
claude .
```
```
You: /review-pr 55
Claude: [pr-review] Reviewing PR #55...
# Review happens independently
```

**dev-1 preserves state, no context switching.**

### Run Full Tests Without Disruption

**Scenario:** Testing changes before PR

**Terminal 1 (dev-1):**
```bash
# Work continues normally
```

**Terminal 2 (ci-cd):**
```bash
cd worktrees/ci-cd
claude .
```
```
You: Run full test suite with coverage
Claude: [ci-cd] Running comprehensive tests...
Claude: [ci-cd] This may take a few minutes...
# Tests run without slowing dev work
```

### Emergency Hotfix

**Scenario:** Critical bug needs immediate fix

**Terminal 1 (ci-cd):**
```bash
cd worktrees/ci-cd
git checkout master
git checkout -b hotfix/critical-bug
# Make fix, test, commit, push
# Other worktrees undisturbed
```

## Best Practices

### DO ✅

**General:**
- ✅ Use worktree-init.sh for setup
- ✅ Check worktree-list.sh to see status
- ✅ Keep main worktree on base branch
- ✅ Use worktree-clean.sh when done

**Development Worktrees:**
- ✅ Create feature branches normally
- ✅ Run quick checks (type-check)
- ✅ Delegate heavy tests to ci-cd
- ✅ Use unique port per worktree

**PR Review Worktree:**
- ✅ Checkout PR branches for review
- ✅ Test functionality if needed
- ✅ Post review comments
- ✅ Return to base branch when done

**CI/CD Worktree:**
- ✅ Run comprehensive test suites
- ✅ Test database migrations
- ✅ Generate coverage reports
- ✅ Stay on base branch usually

### DON'T ❌

**General:**
- ❌ Don't manually delete worktree directories (use worktree-clean.sh)
- ❌ Don't checkout same branch in multiple worktrees
- ❌ Don't forget to stop dev servers before cleanup
- ❌ Don't share .next/ or build artifacts

**Development Worktrees:**
- ❌ Don't run full test suites (use ci-cd)
- ❌ Don't test migrations here (use ci-cd)

**PR Review Worktree:**
- ❌ Don't create feature branches
- ❌ Don't make commits (review only)

**CI/CD Worktree:**
- ❌ Don't work on features here
- ❌ Don't run migrations on main DB from here

### Safety Patterns

**Before Major Operations:**
```bash
# Check status first
./.claude/scripts/worktree-list.sh

# Verify no uncommitted changes
cd worktrees/dev-1
git status
```

**Before Cleaning Up:**
```bash
# Stop dev server
lsof -i :3001
kill -9 <PID>

# Or use script
./.claude/scripts/worktree-clean.sh dev-1
```

**Before Installing Dependencies:**
```bash
# Update in main first
cd /home/prafull/code/therapy-clinic-nextjs
npm install

# Then update worktrees
./.claude/scripts/worktree-install-deps.sh dev-1
./.claude/scripts/worktree-install-deps.sh dev-2
# ... etc
```

## Troubleshooting

### "fatal: 'branch' is already checked out"

**Problem:** Trying to checkout same branch in multiple worktrees

**Solution:** Each worktree needs unique branch

```bash
# Wrong
cd worktrees/dev-1
git checkout pk/issue-42

cd worktrees/dev-2
git checkout pk/issue-42  # ERROR

# Right
cd worktrees/dev-1
git checkout pk/issue-42

cd worktrees/dev-2
git checkout pk/issue-43  # Different branch
```

### Port Already in Use

**Problem:** Dev server can't start on assigned port

**Solution:** Find and stop existing server

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or restart server
./.claude/scripts/worktree-dev.sh dev-1
```

### Worktree Won't Delete

**Problem:** Can't remove worktree

**Causes:**
1. Dev server still running
2. Uncommitted changes
3. Terminal still in worktree

**Solution:**
```bash
# Stop dev server
lsof -i :3001
kill -9 <PID>

# Commit or stash changes
cd worktrees/dev-1
git stash

# Change out of worktree
cd ~/code/therapy-clinic-nextjs

# Remove worktree
git worktree remove worktrees/dev-1
```

### Claude Not Detecting Worktree

**Problem:** Claude doesn't show `[dev-1]` prefix

**Causes:**
1. `.worktree-config.json` missing
2. Config file malformed

**Solution:**
```bash
# Check if config exists
cat worktrees/dev-1/.worktree-config.json

# If missing, recreate
cd worktrees/dev-1
cat > .worktree-config.json <<EOF
{
  "name": "dev-1",
  "role": "development",
  "port": 3001,
  "guidelines": {
    "purpose": "Feature development worktree #1",
    "devServer": "Always use port 3001",
    "testing": "Run quick checks only",
    "branches": "Create feature branches normally"
  }
}
EOF

# Restart Claude session
```

### Dependencies Out of Sync

**Problem:** Different dependency versions across worktrees

**Solution:**
```bash
# Update main worktree
cd /home/prafull/code/therapy-clinic-nextjs
npm install

# Update all worktrees
for wt in dev-1 dev-2 pr-review ci-cd; do
  ./.claude/scripts/worktree-install-deps.sh $wt
done
```

### Database Conflicts

**Problem:** Schema changes in one worktree affect all

**Solution:**
- **Always** test migrations in ci-cd worktree first
- Apply migrations from main worktree only
- Sync all worktrees after schema changes

```bash
# Test migration in ci-cd
cd worktrees/ci-cd
npm run db:generate
npm run db:migrate  # Affects shared DB

# Update all worktrees
cd ~/code/therapy-clinic-nextjs
git pull

cd worktrees/dev-1
git pull --rebase

cd worktrees/dev-2
git pull --rebase
```

## Advanced Topics

### Custom Worktree Configuration

Create additional worktrees for specific purposes:

```bash
# Create experimental worktree
git worktree add worktrees/experiment -b experiment/new-arch

cd worktrees/experiment

# Create config
cat > .worktree-config.json <<EOF
{
  "name": "experiment",
  "role": "development",
  "port": 3005,
  "guidelines": {
    "purpose": "Experimental architecture changes",
    "devServer": "Use port 3005",
    "testing": "Full tests required",
    "branches": "Experimental branches only"
  }
}
EOF

# Create .env.local
echo "PORT=3005" > .env.local
```

### Sharing Worktrees Between Machines

Worktrees are **local only** - they reference absolute paths.

**To recreate on another machine:**

```bash
# Machine 1: Export branch list
git branch > branches.txt

# Machine 2: Import and create worktrees
git clone <repo>
cd therapy-clinic-nextjs
./.claude/scripts/worktree-init.sh

# Checkout branches from Machine 1
cd worktrees/dev-1
git fetch
git checkout <branch-from-machine-1>
```

### Performance Optimization

**Reduce disk usage:**
- Remove worktrees when not needed
- Share test fixtures between worktrees
- Use `.next` build cache

**Reduce memory:**
- Don't run all dev servers simultaneously
- Close Claude sessions when idle

### Integration with IDEs

**VSCode:**
```bash
# Open multiple workspaces
code ~/code/therapy-clinic-nextjs  # Main
code ~/code/therapy-clinic-nextjs/worktrees/dev-1  # Worktree 1
code ~/code/therapy-clinic-nextjs/worktrees/dev-2  # Worktree 2
```

Each workspace is independent, but shares git repository.

### Automated Worktree Management

Create wrapper script for common workflows:

```bash
#!/bin/bash
# quick-dev.sh - Start dev environment

# Start all dev servers
./.claude/scripts/worktree-dev.sh dev-1 &
./.claude/scripts/worktree-dev.sh dev-2 &

# Open Claude sessions
cd worktrees/dev-1 && claude . &
cd worktrees/dev-2 && claude . &

echo "Development environment ready!"
```

## Summary

### Key Takeaways

1. **Worktrees enable parallel work** without branch switching
2. **Each Claude session is aware** of its role automatically
3. **All existing commands work** identically in worktrees
4. **Shared resources** (DB, Redis, git) prevent conflicts
5. **Independent resources** (node_modules, builds) enable isolation

### When to Use Worktrees

**Use worktrees when:**
- Working on multiple issues simultaneously
- Need to review PRs without disrupting current work
- Running long tests without blocking development
- Comparing different implementations
- Frequently context-switching between tasks

**Skip worktrees when:**
- Working on single issue at a time
- Comfortable with branch switching
- Limited disk space (<10GB free)
- Simple, linear workflow

### Getting Help

```bash
# Show worktree status
./.claude/scripts/worktree-list.sh

# Ask Claude in any session
/worktree-status

# Read this guide
cat .claude/docs/WORKTREE_GUIDE.md
```

### Resources

- Git Worktree Docs: `git help worktree`
- Project Scripts: `.claude/scripts/worktree-*.sh`
- Claude Commands: `.claude/commands/worktree-*.md`

---

**Happy parallel development!** 🚀
