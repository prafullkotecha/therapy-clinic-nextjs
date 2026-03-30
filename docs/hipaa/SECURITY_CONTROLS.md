# Security Controls Checklist

- [x] Encryption at rest uses AES-256-GCM with authenticated encryption
- [x] Ciphertext format includes key identifier for rotation support
- [x] Audit log chain integrity support (`previous_hash`, `record_hash`)
- [x] Authentication lockout integration for failed login attempts
- [x] Password complexity policy for production credential auth
- [x] CSRF token verification in credentials authorization path
- [x] Security header policy exported for Next.js configuration
- [x] Explicit RBAC matrix for HIPAA least-privilege roles
- [x] Consent management schema and service for treatment/data-sharing controls
