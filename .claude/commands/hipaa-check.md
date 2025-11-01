---
description: Audit codebase for HIPAA compliance issues
---

# HIPAA Compliance Audit

Perform a comprehensive HIPAA compliance check on the codebase.

## PHI Encryption Audit

1. **Find all PHI fields** in database schemas:
   ```bash
   grep -r "firstName\|lastName\|dateOfBirth\|ssn\|phone\|email\|address\|medicalRecord" src/models/
   ```

2. **Verify encryption**:
   - Check all PHI fields use `text` type (for encrypted storage)
   - Verify encryption service is used before insert/update
   - Check decryption on read
   - Verify format: `keyId:iv:authTag:ciphertext`

## Audit Logging Check

1. **Find PHI access points**:
   ```bash
   grep -r "select.*from.*clients\|therapists\|appointments" src/
   ```

2. **Verify audit logs**:
   - All PHI reads logged
   - All PHI writes logged
   - Log includes: userId, action, resourceType, resourceId, timestamp
   - Logs stored securely (encrypted, access-controlled)

## Access Control Audit

1. **Check RBAC implementation**:
   - All routes have permission checks
   - Principle of least privilege enforced
   - No hardcoded admin bypasses
   - Session timeout enforced (15 minutes)

2. **Verify tenant isolation**:
   ```bash
   grep -r "select.*from" src/app/api/
   ```
   - All queries include tenantId filter
   - RLS policies active on all PHI tables

## Security Vulnerabilities

1. **SQL Injection**:
   - Use parameterized queries (Drizzle ORM)
   - No string concatenation in queries

2. **XSS Prevention**:
   - React escapes by default
   - Verify `dangerouslySetInnerHTML` usage
   - Sanitize user input

3. **Secrets Management**:
   ```bash
   git log -p | grep -E "password|secret|key|token" | head -100
   ```
   - No secrets in git history
   - .env files in .gitignore
   - AWS KMS for encryption keys

## Logging Compliance

Search for PHI in logs:
```bash
grep -r "console.log\|logger\|Sentry" src/ | grep -E "firstName\|lastName\|dateOfBirth"
```

**Issues to flag**:
- PHI in console.log
- PHI in Sentry error messages
- PHI in CloudWatch logs

## Session Security

- [ ] Session timeout: 15 minutes (HIPAA requirement)
- [ ] Secure cookies (httpOnly, secure, sameSite)
- [ ] Redis session storage
- [ ] Automatic logout on timeout

## Report Format

Provide a report with:
1. **Critical Issues** (immediate fix required)
2. **Major Issues** (fix before production)
3. **Minor Issues** (improvements)
4. **Compliant Patterns** (good examples)
5. **Recommendations**

Add issues to GitHub with `hipaa` label if critical.
