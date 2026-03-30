# HIPAA Compliance Overview

This document summarizes HIPAA safeguards implemented in this codebase.

## Administrative Safeguards
- Role-based access controls for admin, therapist, billing, receptionist
- Authentication hardening with lockout and credential validation
- Audit trails for sensitive access and auth events

## Technical Safeguards
- AES-256-GCM encryption at rest for PHI fields
- Tamper-evident audit logging with hash chain (`previous_hash`, `record_hash`)
- Security headers for transport and browser hardening
- 15-minute session max age for HIPAA-aligned timeout requirements

## Physical/Operational Safeguards (Application Scope)
- Multi-tenant isolation with PostgreSQL RLS
- Consent lifecycle tracking and revocation records
- 7-year audit retention policy constant and archive hook stub
