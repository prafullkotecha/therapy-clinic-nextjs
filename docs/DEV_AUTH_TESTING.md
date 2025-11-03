# Development Authentication Testing Guide

This guide explains how to use the development authentication bypass feature to test the application without setting up Keycloak.

## ⚠️ Important Security Note

**DEV_BYPASS_AUTH should NEVER be enabled in production!**

- Only works when `NODE_ENV=development`
- Production safety check will throw an error if enabled in production
- Bypasses all authentication security for quick development testing

## Setup

### 1. Enable Development Auth Bypass

Uncomment or add to your `.env` file:

```bash
DEV_BYPASS_AUTH=true
```

### 2. Ensure Database is Seeded

The dev bypass uses real user records from the database:

```bash
npm run db:seed
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Navigate to Dev Login Page

Open your browser to: `http://localhost:3000/en/dev-login`

## Test User Accounts

The seed script creates four test users with different roles:

### 1. Admin - Alexandra Martinez
- **Email:** `admin@brightfutures.test`
- **Role:** Admin
- **Access:** Full system access
- **Test Areas:**
  - User management (create/edit/deactivate users)
  - View all clients across all therapists
  - View all appointments system-wide
  - Access reports and analytics
  - Manage locations and settings
  - View audit logs

### 2. Therapist - Dr. Sarah Johnson
- **Email:** `dr.sarah.johnson@brightfutures.test`
- **Role:** Therapist
- **Specializations:** ABA (Applied Behavior Analysis)
- **Test Areas:**
  - View assigned clients only
  - Manage own schedule/appointments
  - Add session notes
  - View client profiles and history
  - Update treatment plans
  - Cannot access other therapists' clients

### 3. Billing Specialist - Lisa Anderson
- **Email:** `lisa.anderson@brightfutures.test`
- **Role:** Billing
- **Test Areas:**
  - View/create invoices
  - Process insurance claims
  - Generate payment reports
  - View appointment billing status
  - Cannot access clinical notes or PHI

### 4. Receptionist - James Wilson
- **Email:** `james.wilson@brightfutures.test`
- **Role:** Receptionist
- **Test Areas:**
  - Schedule appointments
  - Check-in clients
  - Manage waitlist
  - View calendar availability
  - Cannot access session notes or detailed PHI

## Testing Workflow

### Role-Based Access Testing

1. **Sign in as Admin**
   - Verify access to all areas
   - Test user management features
   - Check system-wide reports

2. **Sign in as Therapist**
   - Verify can only see assigned clients
   - Test appointment scheduling
   - Add session notes
   - Try accessing another therapist's client (should fail)

3. **Sign in as Billing**
   - Verify can access billing features
   - Try accessing session notes (should fail)
   - Test invoice generation

4. **Sign in as Receptionist**
   - Verify can schedule appointments
   - Try accessing clinical notes (should fail)
   - Test waitlist management

### Visual Indicators

When dev bypass is active, you'll see:

1. **Yellow warning banner** at the top of every page
   - Shows "DEV MODE - Auth Bypass Active"
   - Displays current user name and role
   - "Switch User" button to return to login page

2. **Quick role switching**
   - Click "Switch User" in the warning banner
   - Select a different role to test
   - No need to restart the server

## Testing Checklist

### Authentication Flow
- [ ] Dev login page shows all 4 roles
- [ ] Warning banner indicates dev mode clearly
- [ ] Can sign in as each role successfully
- [ ] Can switch between roles easily
- [ ] Session persists across page refreshes (15 min timeout)

### Admin Role
- [ ] Can view all clients
- [ ] Can view all appointments
- [ ] Can manage users
- [ ] Can access reports
- [ ] Can view audit logs

### Therapist Role
- [ ] Can view assigned clients only
- [ ] Can manage own appointments
- [ ] Can add session notes
- [ ] Cannot access other therapists' data
- [ ] Cannot access admin features

### Billing Role
- [ ] Can view invoices
- [ ] Can process payments
- [ ] Cannot access session notes
- [ ] Cannot access admin features

### Receptionist Role
- [ ] Can schedule appointments
- [ ] Can check-in clients
- [ ] Can manage waitlist
- [ ] Cannot access session notes
- [ ] Cannot access billing features

### Security Testing
- [ ] Cannot access restricted routes without proper role
- [ ] API endpoints return 403 for unauthorized access
- [ ] Tenant isolation maintained (users see only their tenant data)
- [ ] PHI fields properly encrypted in database
- [ ] Audit logs record all PHI access

## Troubleshooting

### "Tenant ID not found in session"

**Cause:** Dev bypass is not enabled or user doesn't exist in database

**Solution:**
1. Verify `DEV_BYPASS_AUTH=true` in `.env`
2. Restart dev server
3. Ensure database is seeded: `npm run db:seed`

### Warning banner not showing

**Cause:** Not signed in via dev bypass (using Keycloak instead)

**Solution:**
1. Sign out
2. Navigate to `/dev-login`
3. Select a role to sign in

### "User is not active" error

**Cause:** User account is deactivated in database

**Solution:**
1. Re-run seed script: `npm run db:reset`
2. Or manually activate user in database

### Session expires too quickly

**Info:** Sessions timeout after 15 minutes (HIPAA requirement)

**Solution:** This is expected behavior. Sign in again to continue testing.

## Switching Back to Keycloak

To disable dev bypass and use Keycloak authentication:

1. Comment out or remove from `.env`:
   ```bash
   # DEV_BYPASS_AUTH=true
   ```

2. Restart development server

3. Ensure Keycloak environment variables are set:
   ```bash
   KEYCLOAK_URL=http://localhost:8080
   KEYCLOAK_REALM=therapy-clinic
   KEYCLOAK_CLIENT_ID=therapy-clinic-app
   KEYCLOAK_CLIENT_SECRET=your_keycloak_client_secret
   ```

4. Sign in will now redirect to Keycloak login page

## Best Practices

1. **Always use dev bypass for rapid development**
   - No need to set up Keycloak locally
   - Quickly switch between roles
   - Test RBAC without complex setup

2. **Test with Keycloak before production**
   - Set up Keycloak in staging environment
   - Test full OAuth flow
   - Verify SSO functionality

3. **Never commit `.env` with DEV_BYPASS_AUTH=true**
   - Keep it in `.env.local` (gitignored)
   - Or comment out when committing `.env.example`

4. **Document role-specific test cases**
   - Add to this guide as you discover edge cases
   - Keep test scenarios updated

## Related Documentation

- **Authentication Roadmap:** `docs/AUTH_ROADMAP.md`
- **Seed Data:** `scripts/seed.ts`
- **RBAC Permissions:** `middleware/rbac.middleware.ts`
- **Audit Logging:** `services/audit.service.ts`
