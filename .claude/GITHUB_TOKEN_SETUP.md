# GitHub Personal Access Token Setup

For Claude Code to automatically manage branches, push code, and create pull requests, you need a GitHub Personal Access Token (PAT) with the correct permissions.

## Creating a Personal Access Token

### 1. Go to GitHub Settings
1. Navigate to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
   - Or use Fine-grained tokens (recommended for better security)

### 2. Configure Token Settings

**Token name:** `claude-code-therapy-clinic`

**Expiration:** Choose based on your preference
- 30 days (more secure, requires renewal)
- 90 days
- No expiration (less secure, but convenient)

### 3. Select Scopes (Classic Token)

For full functionality, select these scopes:

#### ✅ Required Scopes

**`repo` (Full control of private repositories)**
- ✅ `repo:status` - Access commit status
- ✅ `repo_deployment` - Access deployment status
- ✅ `public_repo` - Access public repositories
- ✅ `repo:invite` - Access repository invitations
- ✅ `security_events` - Read and write security events

This allows:
- Create branches
- Push code
- Create pull requests
- Update issues
- Add labels
- Request reviews

**`workflow` (Update GitHub Action workflows)**
- ✅ `workflow` - Update workflow files

This allows:
- Modify `.github/workflows/` files
- Update CI/CD configurations

#### 📋 Optional Scopes (Recommended)

**`write:discussion` (Read and write team discussions)**
- ✅ `write:discussion`
- ✅ `read:discussion`

**`read:org` (Read org and team membership)**
- ✅ `read:org`

This allows:
- Mention teams in PRs
- Assign reviewers from teams

### 4. Alternative: Fine-grained Tokens (More Secure)

**Repository access:**
- Select: `Only select repositories`
- Choose: `therapy-clinic-nextjs`

**Permissions:**
- **Contents**: Read and write (push code, create branches)
- **Pull requests**: Read and write (create/update PRs)
- **Issues**: Read and write (update issue status)
- **Metadata**: Read-only (repository metadata)
- **Workflows**: Read and write (update CI/CD)

## Setting Up the Token

### Option 1: Environment Variable (Recommended)

#### For Bash/Zsh:

Add to `~/.bashrc` or `~/.zshrc`:

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

Then reload:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

#### For Fish:

```fish
set -Ux GITHUB_TOKEN ghp_your_token_here
```

### Option 2: Project-specific (Less Secure)

Create `.env.local` in project root:

```bash
GITHUB_TOKEN=ghp_your_token_here
```

⚠️ **Warning:** Ensure `.env.local` is in `.gitignore`!

### Option 3: GitHub CLI Configuration

If you use `gh` CLI:

```bash
gh auth login
```

Follow prompts and select:
- **Account:** Your GitHub account
- **Preferred protocol:** HTTPS
- **Authenticate:** Paste your token
- **Select scopes:** All scopes listed above

## Verifying Token Setup

Test that the token works:

```bash
# Check token is set
echo $GITHUB_TOKEN

# Test GitHub CLI access
gh auth status

# Test repository access
gh repo view prafullkotecha/therapy-clinic-nextjs

# Test issue access
gh issue list --limit 5

# Test PR creation (dry run)
gh pr create --help
```

## Token Permissions Summary

| Action | Required Scope | Why Needed |
|--------|---------------|------------|
| Create branch | `repo` | Push new branches |
| Push code | `repo` | Upload commits |
| Create PR | `repo` | Create pull requests |
| Update issue | `repo` | Close issues when PR merged |
| Add labels | `repo` | Label PRs (ready-for-review, etc.) |
| Request reviews | `repo` | Assign reviewers |
| Modify workflows | `workflow` | Update CI/CD configs |
| Mention teams | `read:org` | @mention teams in PRs |

## Security Best Practices

### ✅ DO:
- Use fine-grained tokens when possible
- Set expiration dates (30-90 days)
- Limit to specific repositories
- Store in environment variables
- Regenerate periodically
- Keep token secret (never commit)

### ❌ DON'T:
- Commit tokens to git
- Share tokens publicly
- Use tokens in URLs
- Store in unencrypted files
- Give more permissions than needed

## Troubleshooting

### "refusing to allow an OAuth App to create or update workflow"

**Problem:** Token doesn't have `workflow` scope.

**Solution:**
1. Go to https://github.com/settings/tokens
2. Click on your token
3. Add `workflow` scope
4. Regenerate token
5. Update `GITHUB_TOKEN` environment variable

### "Resource not accessible by integration"

**Problem:** Token lacks necessary permissions.

**Solution:**
1. Verify token has `repo` scope (full)
2. Check repository access (if using fine-grained token)
3. Ensure token hasn't expired

### "authentication failed"

**Problem:** Token not set or invalid.

**Solution:**
```bash
# Check token is set
echo $GITHUB_TOKEN

# Re-login with gh CLI
gh auth login

# Verify authentication
gh auth status
```

### "could not create pull request"

**Problem:** Token can create branches but not PRs.

**Solution:**
- Ensure `repo` scope (not just `public_repo`)
- For private repos, need full `repo` access

## Testing the Setup

Create a test branch and PR:

```bash
# Create test branch
git checkout -b test-token-permissions

# Make a small change
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: verify token permissions"

# Push branch
git push -u origin test-token-permissions

# Create PR
gh pr create --title "Test: Verify token permissions" --body "Testing automatic PR creation"

# Clean up
gh pr close --delete-branch
git checkout main
```

If all commands succeed, your token is configured correctly!

## MCP Server Configuration

The token is automatically used by the GitHub MCP server configured in `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

No additional configuration needed once `GITHUB_TOKEN` is set!

## Token Rotation

Recommended: Rotate tokens every 90 days.

**Process:**
1. Generate new token with same permissions
2. Update `GITHUB_TOKEN` environment variable
3. Delete old token from GitHub settings
4. Verify new token works

## Questions?

- [GitHub Token Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub CLI Authentication](https://cli.github.com/manual/gh_auth_login)
- [MCP GitHub Server](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
