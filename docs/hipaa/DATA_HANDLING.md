# PHI Data Handling

## Encrypted Data
PHI values are encrypted before persistence using AES-256-GCM with this format:

`keyId:iv:authTag:ciphertext`

This supports key rotation while preserving decryptability for historical records.

## Audit and Retention
- Every audit record can include tamper-evident chaining metadata.
- Audit retention policy constant is set to 7 years.
- Archive operation is represented by a stub for future storage tier integration.

## Consent Lifecycle Data
The `consents` table tracks:
- consent type (`treatment`, `data_sharing`, `telehealth`, `research`)
- status (`active`, `revoked`, `expired`)
- grant/revoke timestamps
- signer metadata hash and document version
