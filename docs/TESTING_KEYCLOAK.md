# Keycloak & RBAC Manual Testing Guide

Complete guide for manually testing Keycloak integration and RBAC permissions in the Therapy Clinic System.

## Prerequisites Setup

### 1. Start Required Services

```bash
# Start PostgreSQL (if using Docker)
docker-compose up -d postgres

# Start Keycloak
docker run -d \
  --name keycloak \
  -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin123 \
  quay.io/keycloak/keycloak:latest \
  start-dev
```

**Wait 30-60 seconds for Keycloak to start.**

Check if ready:
```bash
curl http://localhost:8080
# Should return HTML
```

### 2. Configure Environment Variables

```bash
# Copy from example if not exists
cp .env.example .env.local

# Generate NextAuth secret
openssl rand -base64 32

# Edit .env.local and update:
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/therapy_clinic_dev
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=therapy-clinic
KEYCLOAK_CLIENT_ID=therapy-clinic-app
KEYCLOAK_CLIENT_SECRET=<will-get-from-keycloak>
NEXTAUTH_SECRET=<paste-generated-secret>
NEXTAUTH_URL=http://localhost:3000
```

## Keycloak Configuration

### 3. Access Keycloak Admin Console

1. Open browser: http://localhost:8080
2. Click **Administration Console**
3. Login:
   - Username: `admin`
   - Password: `admin123`

### 4. Create Realm

1. Click dropdown at top-left (shows "master" or "Keycloak")
2. Click **Create Realm** button
3. **Realm name**: `therapy-clinic`
4. Click **Create**
5. Verify you're now in "therapy-clinic" realm (check top-left dropdown)

### 5. Create Client

1. Left sidebar → Click **Clients**
2. Click **Create client** button
3. **General Settings**:
   - Client type: `OpenID Connect`
   - Client ID: `therapy-clinic-app`
   - Click **Next**
4. **Capability config**:
   - ✅ **Client authentication**: ON
   - ✅ **Authorization**: ON
   - ✅ **Standard flow**: ON
   - ✅ **Direct access grants**: ON
   - Click **Next**
5. **Login settings**:
   - **Root URL**: `http://localhost:3000`
   - **Valid redirect URIs**: `http://localhost:3000/*`
   - **Valid post logout redirect URIs**: `http://localhost:3000/*`
   - **Web origins**: `http://localhost:3000`
   - Click **Save**

6. **Get Client Secret**:
   - Go to **Credentials** tab
   - Copy **Client secret**
   - Update `.env.local` with this secret

### 6. Create Realm Roles

1. Left sidebar → Click **Realm roles**
2. Click **Create role** button
3. Create each role:

**Role 1: admin**
- Role name: `admin`
- Description: `Full system administrator`
- Click **Save**

**Role 2: therapist**
- Role name: `therapist`
- Description: `Licensed therapist`
- Click **Save**

**Role 3: billing**
- Role name: `billing`
- Description: `Billing specialist`
- Click **Save**

**Role 4: receptionist**
- Role name: `receptionist`
- Description: `Front desk receptionist`
- Click **Save**

### 7. Create Test Users

For each role, create a user:

#### Admin User

1. Left sidebar → Click **Users**
2. Click **Create new user** button
3. **User details**:
   - **Username**: `admin@test.com`
   - **Email**: `admin@test.com`
   - **Email verified**: ✅ ON
   - **Enabled**: ✅ ON
4. Click **Create**
5. **Set Password**:
   - Click **Credentials** tab
   - Click **Set password**
   - Password: `admin123`
   - Temporary: ❌ OFF
   - Click **Save** → Confirm
6. **Assign Role**:
   - Click **Role mapping** tab
   - Click **Assign role** button
   - Filter: `Filter by realm roles`
   - Select **admin**
   - Click **Assign**

#### Therapist User

Repeat steps above with:
- Username: `therapist@test.com`
- Email: `therapist@test.com`
- Password: `therapist123`
- Role: `therapist`

#### Billing User

- Username: `billing@test.com`
- Email: `billing@test.com`
- Password: `billing123`
- Role: `billing`

#### Receptionist User

- Username: `receptionist@test.com`
- Email: `receptionist@test.com`
- Password: `receptionist123`
- Role: `receptionist`

### 8. Configure Client Scopes (Roles in JWT)

**CRITICAL**: This ensures roles appear in the JWT token.

1. Left sidebar → Click **Client scopes**
2. Click **roles** (in the list)
3. Click **Mappers** tab
4. Click **realm roles** (in the mappers list)
5. Configure mapper:
   - **Add to ID token**: ✅ ON
   - **Add to access token**: ✅ ON
   - **Add to userinfo**: ✅ ON
   - **Token Claim Name**: `realm_access.roles`
6. Click **Save**

### 9. Verify Client Scope Assignment

1. Left sidebar → Click **Clients**
2. Click **therapy-clinic-app**
3. Click **Client scopes** tab
4. Verify **roles** appears in **Assigned default client scopes**
5. If not, click **Add client scope** → Select **roles** → **Default**

## Application Testing

### 10. Start the Application

```bash
# Ensure .env.local has the client secret from step 5
npm run dev
```

Application should start at http://localhost:3000

### 11. Test Login Flow

1. Open browser: http://localhost:3000
2. Click **Sign in** link in nav
3. **Should redirect to Keycloak login page**
4. Login with:
   - Username: `admin@test.com`
   - Password: `admin123`
5. **Should redirect back to**: http://localhost:3000/en/dashboard
6. Verify dashboard loads

### 12. Verify Session Data

Open browser **DevTools** → **Console**:

```javascript
// Fetch session data
fetch('/api/auth/session')
  .then(r => r.json())
  .then((session) => {
    console.log('Session:', session);
    console.log('Roles:', session.user.roles);
  });
```

**Expected output:**
```json
{
  "user": {
    "name": "admin@test.com",
    "email": "admin@test.com",
    "roles": ["admin"],
    "tenantId": ""
  },
  "accessToken": "eyJ...",
  "idToken": "eyJ...",
  "expires": "..."
}
```

**✅ Verify**: `roles` array contains `["admin"]`

### 13. Test Session Timeout

Session configured for 15 minutes (HIPAA compliance).

**Quick test** (optional):
1. Edit `src/lib/auth.ts`
2. Change `maxAge: 15 * 60` to `maxAge: 60` (1 minute)
3. Restart dev server
4. Login
5. Wait 1 minute
6. Refresh page → should redirect to sign-in

**Reset to 15 minutes** after testing!

## Testing RBAC Permissions

### 14. Create Test API Route

Create new file `src/app/api/test-rbac/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = session.user.roles?.[0];

  const permissions = {
    role,
    email: session.user.email,
    // Client permissions
    canReadClients: checkPermission(role, 'clients', 'read'),
    canCreateClients: checkPermission(role, 'clients', 'create'),
    canUpdateClients: checkPermission(role, 'clients', 'update'),
    canDeleteClients: checkPermission(role, 'clients', 'delete'),
    // Audit & admin permissions
    canReadAuditLogs: checkPermission(role, 'audit_logs', 'read'),
    canCreateUsers: checkPermission(role, 'users', 'create'),
    canDeleteUsers: checkPermission(role, 'users', 'delete'),
    // Billing permissions
    canReadBilling: checkPermission(role, 'billing', 'read'),
    canManageBilling: checkPermission(role, 'billing', 'update'),
    // Appointment permissions
    canCreateAppointments: checkPermission(role, 'appointments', 'create'),
    canDeleteAppointments: checkPermission(role, 'appointments', 'delete'),
  };

  return NextResponse.json(permissions);
}
```

**Save file** → Dev server will hot-reload.

### 15. Test Admin Role (Full Access)

1. **Login** as `admin@test.com` / `admin123`
2. **Visit**: http://localhost:3000/api/test-rbac
3. **Expected response**:

```json
{
  "role": "admin",
  "email": "admin@test.com",
  "canReadClients": true,
  "canCreateClients": true,
  "canUpdateClients": true,
  "canDeleteClients": true,
  "canReadAuditLogs": true,
  "canCreateUsers": true,
  "canDeleteUsers": true,
  "canReadBilling": true,
  "canManageBilling": true,
  "canCreateAppointments": true,
  "canDeleteAppointments": true
}
```

**✅ All permissions should be `true`**

### 16. Test Therapist Role (Limited)

1. **Sign out**: Visit http://localhost:3000 → Clear cookies or use incognito
2. **Login** as `therapist@test.com` / `therapist123`
3. **Visit**: http://localhost:3000/api/test-rbac
4. **Expected response**:

```json
{
  "role": "therapist",
  "email": "therapist@test.com",
  "canReadClients": true,        ✅
  "canCreateClients": false,     ❌
  "canUpdateClients": true,      ✅ (own clients only)
  "canDeleteClients": false,     ❌
  "canReadAuditLogs": false,     ❌
  "canCreateUsers": false,       ❌
  "canDeleteUsers": false,       ❌
  "canReadBilling": true,        ✅ (own clients)
  "canManageBilling": false,     ❌
  "canCreateAppointments": true, ✅
  "canDeleteAppointments": false ❌
}
```

**✅ Therapist has read/update for clients, create appointments, NO admin access**

### 17. Test Billing Role

1. **Sign out** and **login** as `billing@test.com` / `billing123`
2. **Visit**: http://localhost:3000/api/test-rbac
3. **Expected response**:

```json
{
  "role": "billing",
  "email": "billing@test.com",
  "canReadClients": true,        ✅ (for billing)
  "canCreateClients": false,     ❌
  "canUpdateClients": false,     ❌
  "canDeleteClients": false,     ❌
  "canReadAuditLogs": false,     ❌
  "canCreateUsers": false,       ❌
  "canDeleteUsers": false,       ❌
  "canReadBilling": true,        ✅
  "canManageBilling": true,      ✅
  "canCreateAppointments": false,❌
  "canDeleteAppointments": false ❌
}
```

**✅ Billing has full billing access, read-only clients, NO admin**

### 18. Test Receptionist Role

1. **Sign out** and **login** as `receptionist@test.com` / `receptionist123`
2. **Visit**: http://localhost:3000/api/test-rbac
3. **Expected response**:

```json
{
  "role": "receptionist",
  "email": "receptionist@test.com",
  "canReadClients": true,        ✅
  "canCreateClients": true,      ✅ (intake)
  "canUpdateClients": true,      ✅ (scheduling)
  "canDeleteClients": false,     ❌
  "canReadAuditLogs": false,     ❌
  "canCreateUsers": false,       ❌
  "canDeleteUsers": false,       ❌
  "canReadBilling": false,       ❌
  "canManageBilling": false,     ❌
  "canCreateAppointments": true, ✅
  "canDeleteAppointments": true  ✅
}
```

**✅ Receptionist can manage clients/appointments, NO billing/audit**

## Testing Protected Routes

### 19. Test Unauthenticated Access

1. **Sign out** (clear cookies)
2. **Visit**: http://localhost:3000/en/dashboard
3. **Expected**: Redirect to http://localhost:3000/en/sign-in
4. **✅ Protected route blocks unauthenticated users**

### 20. Test Authenticated Access

1. **Login** as any user
2. **Visit**: http://localhost:3000/en/dashboard
3. **Expected**: Dashboard loads successfully
4. **✅ Authenticated users can access protected routes**

## Testing Sign Out

### 21. Test Sign Out

**Method 1: Using Browser Console**
```javascript
// In DevTools Console
fetch('/api/auth/signout', {
  method: 'POST'
}).then(() => window.location.href = '/');
```

**Method 2: Manual**
1. Clear browser cookies for `localhost:3000`
2. Refresh page

**Verify**:
- Visit `/dashboard` → should redirect to `/sign-in`
- Session API returns empty: `fetch('/api/auth/session').then(r => r.json()).then(console.log)` → `{}`

## Verification Checklist

Use this checklist to track your testing:

### Keycloak Setup
- [ ] Keycloak container running on port 8080
- [ ] Realm "therapy-clinic" created
- [ ] Client "therapy-clinic-app" configured
- [ ] Client secret copied to `.env.local`
- [ ] 4 realm roles created (admin, therapist, billing, receptionist)
- [ ] 4 test users created with passwords
- [ ] Users assigned correct roles
- [ ] Client scopes configured for roles in JWT

### Authentication
- [ ] Application starts on http://localhost:3000
- [ ] Click "Sign in" redirects to Keycloak
- [ ] Admin login successful
- [ ] Redirects back to dashboard after login
- [ ] Session API shows user data with roles
- [ ] Protected routes require authentication
- [ ] Sign out clears session

### RBAC - Admin Role
- [ ] Admin has all client permissions (CRUD)
- [ ] Admin can read audit logs
- [ ] Admin can create/delete users
- [ ] Admin has full billing access
- [ ] Admin has all appointment permissions

### RBAC - Therapist Role
- [ ] Therapist can read/update clients (limited)
- [ ] Therapist CANNOT create/delete clients
- [ ] Therapist CANNOT access audit logs
- [ ] Therapist CANNOT manage users
- [ ] Therapist can create/read/update appointments
- [ ] Therapist CANNOT delete appointments
- [ ] Therapist CANNOT manage billing

### RBAC - Billing Role
- [ ] Billing can read clients (for billing)
- [ ] Billing CANNOT modify clients
- [ ] Billing has full billing permissions
- [ ] Billing can read appointments
- [ ] Billing CANNOT create/delete appointments
- [ ] Billing CANNOT access audit logs

### RBAC - Receptionist Role
- [ ] Receptionist can create/read/update clients
- [ ] Receptionist can manage all appointments
- [ ] Receptionist CANNOT access billing
- [ ] Receptionist CANNOT manage users
- [ ] Receptionist CANNOT access audit logs

## Troubleshooting

### Keycloak not starting
```bash
# Check if container is running
docker ps | grep keycloak

# Check logs
docker logs keycloak

# If port 8080 in use, stop other services
lsof -ti:8080 | xargs kill -9

# Remove and restart
docker rm -f keycloak
docker run -d --name keycloak -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest start-dev
```

### Roles not in session
**Symptom**: `session.user.roles` is empty or undefined

**Fix**:
1. Keycloak Admin → Client scopes → roles → Mappers → realm roles
2. Ensure all three toggles are ON:
   - Add to ID token
   - Add to access token
   - Add to userinfo
3. Save
4. Logout and login again

### Invalid redirect URI
**Symptom**: "Invalid parameter: redirect_uri"

**Fix**:
1. Keycloak Admin → Clients → therapy-clinic-app
2. Settings tab → Valid redirect URIs: `http://localhost:3000/*`
3. Web origins: `http://localhost:3000`
4. Save

### Session undefined
**Symptom**: API returns 401 Unauthorized

**Fix**:
1. Check `.env.local` has `NEXTAUTH_SECRET`
2. Restart dev server: `npm run dev`
3. Clear browser cookies
4. Login again

### Permission checks always false
**Symptom**: All `canXYZ` permissions return `false`

**Debug**:
```javascript
// In browser console
fetch('/api/auth/session')
  .then(r => r.json())
  .then(s => console.log('Role:', s.user.roles?.[0]));
```

**Fix**:
- Verify role name matches exactly (case-sensitive)
- Check role was assigned to user in Keycloak
- Verify roles appear in session

## Expected Permission Matrix

| Role | Clients | Therapists | Appointments | Users | Audit | Billing |
|------|---------|------------|--------------|-------|-------|---------|
| **Admin** | CRUD | CRUD | CRUD | CRUD | R | CRUD |
| **Therapist** | RU* | R | CRU* | - | - | R* |
| **Billing** | R | R | R | - | - | CRUD |
| **Receptionist** | CRU | R | CRUD | - | - | - |

Legend: C=Create, R=Read, U=Update, D=Delete, * = Own resources only, - = No access

## Next Steps

After successful testing:

1. **Close Issue #4** - All tasks complete
2. **Update PR #50** - Add testing results
3. **Integrate RBAC** into actual API routes
4. **Add UI controls** - Show/hide based on permissions
5. **Add audit logging** for permission denials

## Notes

- Keycloak data is stored in container - will be lost if container removed
- For persistent storage, add volume: `-v keycloak-data:/opt/keycloak/data`
- Production: Use managed Keycloak or self-hosted with proper database
- Session timeout: 15 minutes (HIPAA requirement)
- All passwords are test passwords - use strong passwords in production
