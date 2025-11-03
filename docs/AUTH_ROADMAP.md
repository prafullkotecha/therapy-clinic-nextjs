# Authentication Roadmap

This document outlines the authentication strategy for the therapy clinic application, from development to production.

## Overview

The application supports three authentication methods, each designed for different use cases:

1. **Development Bypass** (Current) - Quick testing without auth setup
2. **Username/Password Credentials** (Future) - Traditional login for smaller deployments
3. **Keycloak OIDC** (Production) - Enterprise SSO for HIPAA compliance

## Current State: Development Bypass

**Status:** ✅ Implemented (Issue #75)

### Purpose
Enable rapid development and testing without external auth dependencies.

### How It Works
- Uses NextAuth.js Credentials provider
- Fetches real users from database by email
- Only enabled when `DEV_BYPASS_AUTH=true` AND `NODE_ENV=development`
- Production safety check prevents accidental enablement

### Features
- Role selection page (`/dev-login`)
- Visual warning banner when active
- Quick user switching
- No Keycloak setup required

### Security Controls
1. **Environment Check:**
   ```typescript
   const isDevBypassEnabled = Env.DEV_BYPASS_AUTH === 'true' && Env.NODE_ENV === 'development';

   if (Env.DEV_BYPASS_AUTH === 'true' && Env.NODE_ENV === 'production') {
     throw new Error('SECURITY ERROR: DEV_BYPASS_AUTH cannot be enabled in production!');
   }
   ```

2. **Session Structure:** Matches Keycloak JWT format for consistency
3. **Audit Logging:** All logins logged (even in dev mode)
4. **Session Timeout:** 15 minutes (HIPAA requirement)

### Use Cases
- ✅ Local development
- ✅ Feature testing
- ✅ RBAC verification
- ✅ E2E testing
- ❌ Staging environments
- ❌ Production

### Files
- `src/lib/auth.ts` - Credentials provider implementation
- `src/app/dev-login/page.tsx` - Role selection UI
- `src/components/DevBypassWarning.tsx` - Warning banner
- `docs/DEV_AUTH_TESTING.md` - Testing guide

## Future: Username/Password Credentials

**Status:** 📋 Planned (Issue #77)

### Purpose
Provide traditional username/password authentication for:
- Smaller clinics without SSO infrastructure
- Demo environments
- Client trials
- Backup authentication method

### Planned Features
1. **User Registration Flow**
   - Email verification required
   - Password strength requirements (HIPAA)
   - Two-factor authentication (2FA)

2. **Password Management**
   - Secure password hashing (bcrypt/Argon2)
   - Password reset via email
   - Forced password rotation (90 days)
   - Password history (prevent reuse)

3. **Account Security**
   - Account lockout after failed attempts (already implemented)
   - Session management (already implemented)
   - Device tracking
   - Login notifications

4. **Compliance Features**
   - Audit logging (already implemented)
   - PHI access tracking (already implemented)
   - Session timeout (already implemented)
   - Secure cookie settings

### Implementation Plan

#### Phase 1: Core Authentication (1 week)
- Add Credentials provider (username/password)
- Password hashing with bcrypt
- Login/logout flow
- Session management

#### Phase 2: Password Security (3 days)
- Password strength validation
- Password reset flow
- Email verification
- Account lockout integration (exists)

#### Phase 3: Two-Factor Authentication (1 week)
- TOTP-based 2FA (Google Authenticator, Authy)
- Backup codes generation
- SMS 2FA option (via Twilio with BAA)
- 2FA enforcement for admins

#### Phase 4: Account Management (3 days)
- User profile settings
- Password change
- Active sessions view
- Login history

#### Phase 5: Compliance & Audit (2 days)
- Enhanced audit logging
- Suspicious activity detection
- Admin security dashboard
- Compliance reports

### Technical Details

**Provider Configuration:**
```typescript
Credentials({
  id: 'credentials',
  name: 'Username/Password',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials) {
    // 1. Validate input
    // 2. Check account lockout
    // 3. Verify password hash
    // 4. Check 2FA if enabled
    // 5. Update last login
    // 6. Log audit event
    // 7. Return user object
  },
})
```

**Password Hashing:**
```typescript
import bcrypt from 'bcrypt';

// Registration
const hashedPassword = await bcrypt.hash(password, 12);

// Login
const isValid = await bcrypt.compare(password, user.hashedPassword);
```

**Database Schema Changes:**
```typescript
// Add to users table
hashedPassword: text('hashed_password'),
passwordChangedAt: timestamp('password_changed_at'),
passwordHistory: jsonb('password_history'), // Last 5 hashes
twoFactorEnabled: boolean('two_factor_enabled').default(false),
twoFactorSecret: text('two_factor_secret_encrypted'),
backupCodes: jsonb('backup_codes_encrypted'),
```

### Security Considerations
1. **Password Requirements:**
   - Minimum 12 characters
   - Must include uppercase, lowercase, numbers, symbols
   - Cannot contain user's name or email
   - Cannot be in common password list

2. **Rate Limiting:**
   - Max 5 login attempts per 15 minutes per IP
   - Account lockout after 10 failed attempts
   - CAPTCHA after 3 failed attempts

3. **Session Security:**
   - HTTP-only cookies
   - Secure flag in production
   - SameSite=Strict
   - Short-lived tokens (15 min)

4. **Audit Trail:**
   - Log all login attempts (success/failure)
   - Track IP address, user agent
   - Monitor suspicious patterns
   - Alert on unusual activity

### Use Cases
- ✅ Small clinic deployments (<50 users)
- ✅ Demo environments
- ✅ Client trials
- ✅ Backup authentication
- ⚠️ Staging (prefer Keycloak)
- ❌ Large enterprise deployments (use Keycloak)

## Production: Keycloak OIDC

**Status:** 🔧 Partially Implemented

### Purpose
Enterprise-grade authentication and SSO for HIPAA-compliant production deployments.

### Current Implementation
- NextAuth.js Keycloak provider configured
- JWT token handling
- Role mapping from Keycloak
- Tenant ID extraction
- Session management

### Missing Components
1. **Keycloak Server Setup**
   - Self-hosted Keycloak instance
   - Realm configuration
   - Client setup
   - User federation (optional)

2. **User Provisioning**
   - Admin user creation
   - Role assignment in Keycloak
   - Group management
   - Attribute mapping

3. **Advanced Features**
   - Single Sign-On (SSO)
   - Multi-factor authentication
   - Social login (optional)
   - Account self-service

### Keycloak Setup Guide

#### 1. Deploy Keycloak (AWS ECS)
```bash
# Docker Compose (local testing)
docker run -d \
  -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest start-dev

# Production: Deploy to AWS ECS Fargate
# - Use RDS PostgreSQL for Keycloak database
# - Enable SSL/TLS
# - Configure load balancer
# - Set up CloudWatch logging
```

#### 2. Create Realm
- Name: `therapy-clinic`
- Display name: `Therapy Clinic Management`
- Enabled: Yes
- User registration: No (admin-managed only)

#### 3. Create Client
- Client ID: `therapy-clinic-app`
- Client Protocol: `openid-connect`
- Access Type: `confidential`
- Valid Redirect URIs: `https://yourdomain.com/*`
- Web Origins: `https://yourdomain.com`

#### 4. Configure Client Scopes
- Add custom mapper for `tenant_id`
- Map realm roles to `realm_access.roles`
- Include email, profile scopes

#### 5. Create Roles
- `admin` - Full system access
- `therapist` - Clinical access
- `billing` - Financial access
- `receptionist` - Scheduling access

#### 6. Create Users
- Import from existing database, or
- Manually create via Keycloak admin console
- Assign roles and tenant ID attribute

### Environment Variables
```bash
# Keycloak Configuration
KEYCLOAK_URL=https://auth.yourdomain.com
KEYCLOAK_REALM=therapy-clinic
KEYCLOAK_CLIENT_ID=therapy-clinic-app
KEYCLOAK_CLIENT_SECRET=your_secure_client_secret

# NextAuth Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret
```

### HIPAA Compliance Features
1. **Access Control:**
   - Role-based access control (RBAC)
   - Fine-grained permissions
   - Attribute-based access control (ABAC)

2. **Audit Logging:**
   - All authentication events logged
   - Login/logout tracking
   - Failed attempt monitoring
   - Integration with CloudWatch

3. **Session Management:**
   - 15-minute session timeout
   - Automatic logout on inactivity
   - Secure token handling
   - Revocation support

4. **Multi-Factor Authentication:**
   - TOTP (Google Authenticator)
   - SMS verification
   - Email verification
   - Backup codes

5. **Account Security:**
   - Strong password policies
   - Password rotation enforcement
   - Account lockout
   - Brute force protection

### Use Cases
- ✅ Production deployments
- ✅ Staging environments
- ✅ Large organizations (50+ users)
- ✅ Multi-tenant SaaS
- ✅ Enterprise SSO integration
- ⚠️ Local development (use dev bypass)
- ❌ Demo/trial environments (use credentials)

### Migration Path
When moving from dev bypass or credentials to Keycloak:

1. **Export Users:**
   ```sql
   SELECT id, email, first_name, last_name, role, tenant_id
   FROM users WHERE is_active = true;
   ```

2. **Import to Keycloak:**
   - Use Keycloak Admin API
   - Bulk import via JSON
   - Set initial passwords (force change on first login)

3. **Configure Environment:**
   - Update `.env` with Keycloak URLs
   - Remove DEV_BYPASS_AUTH
   - Test authentication flow

4. **Update Documentation:**
   - User onboarding guide
   - Password reset instructions
   - MFA setup guide

## Comparison Matrix

| Feature | Dev Bypass | Credentials | Keycloak |
|---------|-----------|-------------|----------|
| **Setup Complexity** | ✅ Minimal | 🟡 Medium | 🔴 High |
| **Security** | 🔴 None | 🟡 Good | ✅ Excellent |
| **SSO Support** | ❌ No | ❌ No | ✅ Yes |
| **MFA Support** | ❌ No | ✅ Yes | ✅ Yes |
| **User Management** | ❌ Manual | 🟡 Basic | ✅ Advanced |
| **HIPAA Compliance** | ❌ No | 🟡 Partial | ✅ Full |
| **Cost** | ✅ Free | ✅ Free | 🟡 Infrastructure |
| **Maintenance** | ✅ None | 🟡 Low | 🔴 High |
| **Recommended For** | Dev/Testing | Small Clinics | Enterprise |

## Decision Tree

```
Is this production?
├─ No → Use Development Bypass
│   └─ Enable DEV_BYPASS_AUTH=true
│
└─ Yes → How many users?
    ├─ < 50 users → Consider Username/Password
    │   ├─ Need SSO? → Use Keycloak
    │   └─ No SSO needed → Username/Password is sufficient
    │
    └─ 50+ users → Use Keycloak
        └─ Enterprise SSO required for compliance
```

## Timeline

| Milestone | Status | Target Date |
|-----------|--------|-------------|
| Development Bypass | ✅ Complete | Dec 2024 |
| Credentials Provider | 📋 Planned | Q1 2025 |
| Keycloak Setup Guide | 📝 In Progress | Q1 2025 |
| Keycloak Production Deploy | ⏳ Pending | Q2 2025 |
| SSO Integration | ⏳ Pending | Q2 2025 |

## Next Steps

1. **Immediate (Q1 2025):**
   - Test development bypass thoroughly
   - Document any issues
   - Create Keycloak setup video tutorial

2. **Short Term (Q1 2025):**
   - Implement username/password credentials provider (Issue #77)
   - Add 2FA support
   - Build password management UI

3. **Medium Term (Q2 2025):**
   - Deploy Keycloak to staging
   - Test full SSO flow
   - Train staff on Keycloak

4. **Long Term (Q2 2025):**
   - Production Keycloak deployment
   - User migration
   - Deprecate dev bypass (keep for testing)

## Related Documentation

- **Development Auth Testing:** `docs/DEV_AUTH_TESTING.md`
- **HIPAA Compliance:** `docs/HIPAA_COMPLIANCE.md` (TBD)
- **Security Architecture:** `docs/SECURITY.md` (TBD)
- **Keycloak Setup:** `docs/KEYCLOAK_SETUP.md` (TBD)

## References

- [NextAuth.js Documentation](https://authjs.dev)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
