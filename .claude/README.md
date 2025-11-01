# Claude Code Configuration

This directory contains configuration files for Claude Code to work efficiently on this project.

## Directory Structure

```
.claude/
├── commands/           # Slash commands for common tasks
│   ├── work-issue.md   # /work-issue - Work on GitHub issue
│   ├── review-pr.md    # /review-pr - Review pull request
│   ├── hipaa-check.md  # /hipaa-check - HIPAA compliance audit
│   ├── db-migrate.md   # /db-migrate - Database migration workflow
│   └── type-check.md   # /type-check - TypeScript type checking
├── mcp.json           # MCP server configuration
├── context.md         # Auto-loaded project context
└── README.md          # This file
```

## Available Slash Commands

### `/work-issue {{ISSUE_NUMBER}}`
**Fully automated workflow** - from issue to PR:
- Fetches issue details from GitHub
- Creates feature branch `pk/issue-{{NUMBER}}-<description>`
- Creates implementation plan with TodoWrite
- Implements the feature following best practices
- Runs tests and type checks
- Commits with proper format
- **Pushes to GitHub automatically**
- **Creates pull request automatically**
- Provides PR URL for your review

**Usage:**
```
/work-issue 5
```

**Result:** PR ready for your review on GitHub!

### `/continue-issue {{ISSUE_NUMBER}}`
Continue work on existing issue after PR feedback:
- Switches to existing branch
- Reads PR feedback and comments
- Makes requested changes
- Tests and commits
- **Pushes updates automatically**
- Requests re-review

**Usage:**
```
/continue-issue 5
```

### `/review-pr {{PR_NUMBER}}`
Comprehensive pull request review:
- Code quality and TypeScript best practices
- HIPAA compliance check
- Security audit (SQL injection, XSS, secrets)
- Multi-tenancy verification
- Testing coverage

**Usage:**
```
/review-pr 12
```

### `/hipaa-check`
Audit codebase for HIPAA compliance:
- PHI encryption verification
- Audit logging completeness
- Access control checks
- Security vulnerabilities
- Logging compliance

**Usage:**
```
/hipaa-check
```

### `/db-migrate`
Safe database migration workflow:
- Generate Drizzle migrations
- Review SQL for safety
- Test locally with backup
- Verify RLS policies
- Document breaking changes

**Usage:**
```
/db-migrate
```

### `/type-check`
Run TypeScript type checking with guidance:
- Runs `npm run check:types`
- Provides context-aware fix suggestions
- References CLAUDE.md best practices
- Ensures no type safety bypasses

**Usage:**
```
/type-check
```

## MCP Servers

Configured in `mcp.json`:

### GitHub Server
- **Purpose:** Fetch issues, PRs, create comments
- **Requirements:** Set `GITHUB_TOKEN` environment variable
- **Usage:** Automatically used by `/work-issue` and `/review-pr`

### Filesystem Server
- **Purpose:** Advanced file operations
- **Scope:** `/home/prafull/code/therapy-clinic-nextjs`
- **Usage:** Automatically available

### PostgreSQL Server
- **Purpose:** Direct database queries and schema inspection
- **Connection:** `postgresql://postgres:postgres@127.0.0.1:5432/therapy_clinic_dev`
- **Usage:** Query database, inspect schemas, verify data

## Context Loading

`context.md` is automatically loaded in every Claude Code session, providing:
- Project overview and tech stack
- Common commands and patterns
- TypeScript and HIPAA critical rules
- Quick reference for development

## Setting Up

### 1. Create GitHub Personal Access Token

**See `GITHUB_TOKEN_SETUP.md` for detailed instructions.**

Quick setup:

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name: `claude-code-therapy-clinic`
4. Select scopes:
   - ✅ `repo` (full control)
   - ✅ `workflow` (update CI/CD)
   - ✅ `write:discussion` (optional)
   - ✅ `read:org` (optional)
5. Click **"Generate token"**
6. Copy token (shown once!)

### 2. Set Environment Variable

Add to `~/.bashrc` or `~/.zshrc`:

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

Reload shell:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

Verify:
```bash
echo $GITHUB_TOKEN
gh auth status
```

### 3. Install MCP Servers (Auto-installed on first use)

Optional manual install:
```bash
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-postgres
```

### 4. Start Using

In any Claude Code session:

```
/work-issue 5
```

Claude will **automatically**:
1. Load project context from `context.md`
2. Reference best practices from `CLAUDE.md`
3. Fetch issue from GitHub
4. Create feature branch `pk/issue-5-<description>`
5. Implement the feature
6. Run all checks
7. Commit with proper format
8. **Push to GitHub**
9. **Create pull request**
10. Provide PR URL for your review

**No asking, no manual steps - fully automated!**

## Typical Workflow

### Starting work on an issue:
```
User: /work-issue 8
```

Claude automatically:
1. Fetches issue #8 from GitHub
2. Creates branch `pk/issue-8-<description>`
3. Analyzes requirements
4. Creates TodoWrite task list
5. Implements feature following CLAUDE.md patterns
6. Runs type checks and linting
7. Commits with proper format
8. **Pushes to GitHub**
9. **Creates PR**
10. Provides PR URL

**You then:** Review PR on GitHub, approve or request changes

### Continuing after PR feedback:
```
User: /continue-issue 8
```

Claude automatically:
1. Switches to branch
2. Reads PR comments
3. Makes requested changes
4. Tests and commits
5. **Pushes updates**
6. Notifies you

**You then:** Review updates on GitHub, merge when ready

### Reviewing any PR:
```
User: /review-pr 15
```

Claude:
1. Fetches PR #15 diff
2. Reviews against checklists (TypeScript, HIPAA, security)
3. Provides categorized feedback
4. Suggests improvements
5. Can post review as comment (if you approve)

## Customization

You can add new commands by creating files in `.claude/commands/`:

```markdown
---
description: Your command description
---

# Command Content

Instructions for Claude...
```

Then use it:
```
/your-command
```

## Benefits

✅ **Consistent Quality** - Every issue follows same best practices
✅ **HIPAA Compliance** - Automated checks prevent violations
✅ **Type Safety** - No TypeScript bypasses or workarounds
✅ **Fast Onboarding** - New sessions have full context
✅ **Audit Trail** - All work tracked and documented
✅ **Less Context Needed** - Just say "work on issue #5"

## Examples

### Before Claude Code Configuration:
```
User: Can you work on issue #5? It's about adding client search.
      Remember to use interfaces not types, encrypt PHI fields,
      add audit logging, include tenant filtering, run type checks...
      Then create a branch, commit, and let me know when I should push.

Claude: [implements feature]

User: Ok push it

Claude: I can't push directly, please run:
        git push -u origin feature-branch

User: [runs command manually]

User: Now create a PR

Claude: I can't create PRs, please run:
        gh pr create --title "..." --body "..."

User: [creates PR manually]
```

### After Claude Code Configuration:
```
User: /work-issue 5

Claude: [Working on issue #5: Add client search functionality]
        ✓ Fetched issue from GitHub
        ✓ Created branch pk/issue-5-add-client-search
        ✓ Implemented search with HIPAA compliance
        ✓ All tests passing
        ✓ Pushed to GitHub
        ✓ Created PR #23

        📋 PR: https://github.com/prafullkotecha/therapy-clinic-nextjs/pull/23

        Ready for your review!

User: [reviews PR on GitHub, merges when ready]
```

**That's it!** No manual git commands, no context repetition, no multi-step workflows.

## Troubleshooting

**Slash command not found:**
- Ensure file exists in `.claude/commands/`
- Check filename ends with `.md`
- Restart Claude Code session

**MCP server connection failed:**
- Check `GITHUB_TOKEN` is set
- Verify database is running (`docker ps`)
- Check `mcp.json` configuration

**Context not loading:**
- Ensure `context.md` exists
- Check file is valid markdown
- File size should be reasonable (<10KB)

## Resources

- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [MCP Servers](https://github.com/modelcontextprotocol)
- [Project CLAUDE.md](../CLAUDE.md) - Best practices
- [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) - Architecture
