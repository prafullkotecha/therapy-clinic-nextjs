---
description: Verify application starts and runs successfully
---

# Application Verification

Verify the application starts successfully, compiles without errors, and responds to requests.

## Instructions

1. **Run type checking and linting first**:
   ```bash
   npm run check:types && npm run lint
   ```

2. **Kill any existing dev server**:
   - Check for background processes
   - Kill shell if needed using BashOutput tool

3. **Start dev server in background**:
   ```bash
   npm run dev
   ```
   - Use `run_in_background: true` parameter
   - Set timeout to 15000ms minimum

4. **Monitor server startup**:
   - Use BashOutput to check server logs
   - Wait for "Ready in X.Xs" message
   - Check for compilation errors

5. **Verify HTTP response**:
   ```bash
   curl -s http://localhost:3000 | head -20
   ```
   - Should return HTML with status 200
   - Check for error messages in output

6. **Check server logs for errors**:
   - Review compilation output
   - Check for runtime errors
   - Verify no React/Next.js errors

7. **Optional: Playwright verification** (if MCP available):
   - Launch browser to http://localhost:3000
   - Capture screenshot of homepage
   - Verify UI renders correctly

## Success Criteria

- ✅ TypeScript compilation passes (no errors)
- ✅ ESLint passes (no errors)
- ✅ Dev server starts without errors
- ✅ Server shows "Ready in X.Xs" message
- ✅ HTTP request returns 200 status
- ✅ Homepage HTML renders
- ✅ No compilation or runtime errors in logs

## Common Issues

### Environment Variables Missing
**Error**: `Invalid environment variables`

**Fix**: Check `src/libs/Env.ts` schema matches `.env` file
- Ensure required variables are defined
- Make optional variables actually optional in Zod schema
- Run `cp .env.example .env` if needed

### Port Already in Use
**Error**: `Port 3000 is already in use`

**Fix**:
```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Database Connection Error
**Error**: `Failed to connect to database`

**Fix**:
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Start database if needed
docker-compose up -d postgres

# Verify DATABASE_URL in .env
```

### Module Not Found
**Error**: `Cannot find module 'X'`

**Fix**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Report Format

After verification, report to user:

```
✅ Application Verification Complete

- TypeScript: ✅ No errors
- ESLint: ✅ No errors
- Dev Server: ✅ Started successfully
- HTTP Response: ✅ 200 OK
- Homepage: ✅ Renders correctly
- Compilation: ✅ No errors

Server running at: http://localhost:3000
```

## Remember

From user's global instructions:
> ensure the application starts successfully after every task is completed

Always run this verification after:
- Database migrations
- Schema changes
- Dependency updates
- Configuration changes
- Feature implementations
