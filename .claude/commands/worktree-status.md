# Worktree Status

Show current worktree context and status of all worktrees.

## What to Do

1. **Detect if in a worktree:**
   - Check for `.worktree-config.json` at project root
   - If found, read and display worktree context
   - If not found, indicate running in main directory

2. **Show current context** (if in worktree):
   ```
   ## Current Worktree: [name]

   **Role**: [role from config]
   **Port**: [port from config]
   **Purpose**: [purpose from config guidelines]
   **Branch**: [current git branch]

   ### Guidelines
   - [Testing guidelines]
   - [Dev server port]
   - [Branch creation rules]
   ```

3. **Show all worktrees status:**
   - Run `./.claude/scripts/worktree-list.sh`
   - Display output to user

4. **Provide helpful commands:**
   ```
   Available commands:
   - /work-issue N - Work on issue (creates branch)
   - /complete-issue N - Complete and merge issue
   - /review-pr N - Review pull request
   - npm run dev - Start dev server (port [PORT])

   Management scripts:
   - ./.claude/scripts/worktree-list.sh - List all worktrees
   - ./.claude/scripts/worktree-install-deps.sh [name] - Install deps
   - ./.claude/scripts/worktree-clean.sh [name] - Remove worktree
   ```

## Example Output

**When in main directory:**
```
## Worktree Status

You are in the **main directory** (not a worktree).

All worktrees are managed from here. To see worktree status:
./claude/scripts/worktree-list.sh

To create worktrees:
./claude/scripts/worktree-init.sh
```

**When in dev-1 worktree:**
```
## Current Worktree: dev-1

**Role**: development
**Port**: 3001
**Purpose**: Feature development worktree #1
**Branch**: pk/issue-42-client-intake

### Guidelines
- **Testing**: Run quick checks only, delegate heavy tests to ci-cd
- **Dev Server**: Always use port 3001
- **Branches**: Create feature branches normally

All standard commands work here. I'll automatically use the correct port and follow the worktree guidelines.

[Output from worktree-list.sh showing all worktrees]
```

## Important Notes

- Always check for `.worktree-config.json` to detect worktree context
- This command is purely informational - no state changes
- Show complete status from worktree-list.sh script
- Helpful for understanding which worktree you're in
