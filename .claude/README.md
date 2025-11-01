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
Automatically fetch a GitHub issue and work on it end-to-end:
- Fetches issue details from GitHub
- Creates implementation plan with TodoWrite
- Implements the feature following best practices
- Runs tests and type checks
- Creates commit with proper format

**Usage:**
```
/work-issue 5
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

### 1. Install MCP Servers (optional, auto-installed on first use)

```bash
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-postgres
```

### 2. Set GitHub Token

```bash
export GITHUB_TOKEN=your_github_personal_access_token
```

Or add to `~/.bashrc` or `~/.zshrc`:
```bash
echo 'export GITHUB_TOKEN=your_token' >> ~/.bashrc
```

### 3. Start Using

In any Claude Code session:

```
/work-issue 5
```

Claude will automatically:
1. Load project context from `context.md`
2. Reference best practices from `CLAUDE.md`
3. Use GitHub MCP server to fetch issue
4. Implement the feature
5. Run all checks
6. Create proper commit

## Typical Workflow

### Starting work on an issue:
```
User: /work-issue 8
```

Claude will:
1. Fetch issue #8 from GitHub
2. Analyze requirements
3. Create TodoWrite task list
4. Implement feature following CLAUDE.md patterns
5. Run type checks and linting
6. Commit with proper format
7. Ask if you want to push/create PR

### Reviewing a PR:
```
User: /review-pr 15
```

Claude will:
1. Fetch PR #15 diff
2. Review against checklists (TypeScript, HIPAA, security)
3. Provide categorized feedback
4. Suggest improvements
5. Ask if you want to post review as comment

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

### Before (manual context every time):
```
User: Can you work on issue #5? It's about adding client search.
      Remember to use interfaces not types, encrypt PHI fields,
      add audit logging, include tenant filtering, run type checks...
```

### After (automated):
```
User: /work-issue 5
Claude: [fetches issue, has all context, does everything correctly]
```

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
