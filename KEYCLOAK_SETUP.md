# Keycloak Setup Guide

## Quick Start

```bash
# Start Keycloak (and PostgreSQL)
npm run db:up

# Wait 30-60 seconds for Keycloak to initialize
# Then access admin console: http://localhost:8080
```

## Admin Credentials (Development)

- **URL**: http://localhost:8080
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change these credentials in production and store securely in AWS Secrets Manager.

## Initial Setup Steps

### 1. Create Therapy Clinic Realm

1. Log in to Keycloak admin console
2. Click dropdown in top-left (says "master")
3. Click "Create Realm"
4. Set **Realm name**: `therapy-clinic`
5. Click "Create"

### 2. Create Roles

Navigate to **Realm roles** in the left sidebar:

1. Click "Create role"
2. Create the following roles:

   - **admin**: Full system access (clinic management)
   - **therapist**: Therapist-specific features
   - **billing**: Billing and claims access
   - **receptionist**: Front desk operations

### 3. Create Client Application

Navigate to **Clients** in the left sidebar:

1. Click "Create client"
2. **General Settings**:
   - Client type: `OpenID Connect`
   - Client ID: `therapy-clinic-app`
3. Click "Next"
4. **Capability config**:
   - ✅ Client authentication: ON
   - ✅ Authorization: ON
   - Authentication flow: Enable "Standard flow" and "Direct access grants"
5. Click "Next"
6. **Login settings**:
   - Valid redirect URIs: `http://localhost:3000/*`
   - Web origins: `http://localhost:3000`
7. Click "Save"

### 4. Get Client Secret

1. Go to the **Credentials** tab of your client
2. Copy the **Client secret** value
3. Add to `.env.local`:
   ```
   KEYCLOAK_CLIENT_SECRET=<paste-secret-here>
   ```

### 5. Configure User Federation (Optional - for later)

For HIPAA compliance, consider:
- LDAP integration
- Multi-factor authentication (MFA)
- Session timeout policies

### 6. Create Test Users

Navigate to **Users** in the left sidebar:

1. Click "Create new user"
2. Fill in details:
   - Username: `test-admin`
   - Email: `admin@example.com`
   - Email verified: ON
3. Click "Create"
4. Go to **Credentials** tab:
   - Click "Set password"
   - Password: `Test123!`
   - Temporary: OFF
5. Go to **Role mapping** tab:
   - Click "Assign role"
   - Select `admin` role
   - Click "Assign"

Repeat for other roles (`test-therapist`, `test-billing`, `test-receptionist`).

## Environment Variables

Update your `.env.local`:

```bash
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=therapy-clinic
KEYCLOAK_CLIENT_ID=therapy-clinic-app
KEYCLOAK_CLIENT_SECRET=<from-step-4>
```

## Production Considerations

### Security
- Use HTTPS only (no HTTP)
- Enable security headers
- Configure CORS properly
- Set up rate limiting
- Enable bot detection (Arcjet)

### HIPAA Compliance
- Enable audit logging (all authentication events)
- Set session timeout: 15 minutes
- Require MFA for all users
- Regular security audits
- Encrypt database at rest (AWS RDS encryption)
- Sign BAA with hosting provider

### High Availability
- Run Keycloak on AWS ECS Fargate (multi-AZ)
- Use AWS RDS PostgreSQL (Multi-AZ)
- Set up Application Load Balancer
- Configure health checks
- Set up CloudWatch monitoring

## Troubleshooting

### Keycloak won't start
```bash
# Check logs
docker logs therapy-clinic-keycloak

# Restart containers
npm run db:down
npm run db:up
```

### Port 8080 already in use
```bash
# Find process using port 8080
lsof -i :8080

# Stop the process or change Keycloak port in docker-compose.yml
```

### Database connection errors
- Ensure PostgreSQL is running: `docker ps`
- Check DATABASE_URL in .env
- Verify database exists: `docker exec postgres17 psql -U postgres -l`

## Next Steps

After Keycloak is configured:
1. Complete Issue #4: Replace Clerk with Keycloak integration
2. Test authentication flow
3. Set up tenant context middleware
4. Implement RBAC permission checks
