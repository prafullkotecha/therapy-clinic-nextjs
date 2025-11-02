# PHI Fields Documentation

This document lists all Protected Health Information (PHI) fields that must be encrypted at rest in the database according to HIPAA regulations.

## Overview

PHI encryption uses **AES-256-GCM** with authenticated encryption. All encrypted fields are stored in the database as `text` type with the format:

```
keyId:iv:authTag:ciphertext
```

## Encryption Service

```typescript
import { getEncryptionService } from '@/lib/encryption';

// Initialize service (do this once at app startup)
const encryptionService = await getEncryptionService();

// Encrypt data
const encrypted = encryptionService.encrypt('sensitive data');

// Decrypt data
const decrypted = encryptionService.decrypt(encrypted);
```

## PHI Fields by Entity

### Clients Table (`clients`)

All personally identifiable information for clients must be encrypted:

| Field Name | Database Column | PHI Type | Required |
|------------|----------------|----------|----------|
| `firstName` | `first_name_encrypted` | Name | Yes |
| `lastName` | `last_name_encrypted` | Name | Yes |
| `dateOfBirth` | `date_of_birth_encrypted` | DOB | Yes |
| `ssn` | `ssn_encrypted` | SSN | No |
| `email` | `email_encrypted` | Contact | No |
| `phone` | `phone_encrypted` | Contact | No |
| `address` | `address_encrypted` | Address | No |
| `guardianName` | `guardian_name_encrypted` | Name | No |
| `guardianPhone` | `guardian_phone_encrypted` | Contact | No |
| `guardianEmail` | `guardian_email_encrypted` | Contact | No |
| `emergencyContactName` | `emergency_contact_name_encrypted` | Name | No |
| `emergencyContactPhone` | `emergency_contact_phone_encrypted` | Contact | No |
| `insuranceProvider` | `insurance_provider_encrypted` | Insurance | No |
| `insurancePolicyNumber` | `insurance_policy_number_encrypted` | Insurance | No |
| `insuranceGroupNumber` | `insurance_group_number_encrypted` | Insurance | No |

**Example:**
```typescript
import { encryptFields } from '@/lib/encryption/drizzle-helpers';

const clientData = {
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1990-01-15',
  email: 'john.doe@example.com',
  ageGroup: 'adult', // NOT encrypted (used for matching)
};

const encrypted = await encryptFields(clientData, [
  'firstName',
  'lastName',
  'dateOfBirth',
  'email',
]);

await db.insert(clients).values({
  ...encrypted,
  tenantId,
  ageGroup: clientData.ageGroup,
});
```

### Client Needs Table (`client_needs`)

Assessment and clinical information:

| Field Name | Database Column | PHI Type | Required |
|------------|----------------|----------|----------|
| `primaryConcerns` | `primary_concerns_encrypted` | Clinical | No |
| `behavioralCharacteristics` | `behavioral_characteristics_encrypted` | Clinical | No |
| `sensoryConsiderations` | `sensory_considerations_encrypted` | Clinical | No |

**Non-PHI Fields** (not encrypted, used for matching):
- `communicationNeeds`
- `cooccurringConditions`
- `requiredSpecializations`
- `schedulePreferences`
- `urgencyLevel`

### Therapists Table (`therapists`)

Similar to clients, therapist personal information is PHI:

| Field Name | Database Column | PHI Type | Required |
|------------|----------------|----------|----------|
| `firstName` | `first_name_encrypted` | Name | Yes |
| `lastName` | `last_name_encrypted` | Name | Yes |
| `email` | `email_encrypted` | Contact | Yes |
| `phone` | `phone_encrypted` | Contact | No |
| `address` | `address_encrypted` | Address | No |

## Non-PHI Fields

The following fields are **NOT encrypted** because they are:
1. Used for algorithmic matching
2. Aggregate/statistical data
3. Non-identifying metadata

**Client Non-PHI:**
- `ageGroup` - Broad category (early_childhood, school_age, etc.)
- `preferredLanguage` - Not individually identifying
- `status` - Clinical status (intake, active, etc.)
- `matchScore` - Computed score
- `intakeDate`, `dischargeDate` - Dates without context

**Client Needs Non-PHI:**
- `communicationNeeds` - General category
- `cooccurringConditions` - Diagnostic codes (de-identified)
- `requiredSpecializations` - Service requirements
- `schedulePreferences` - Time preferences
- `urgencyLevel` - Priority level

**Therapist Non-PHI:**
- `licenseType`, `licenseNumber`, `licenseState` - Public record
- `specializations` - Professional qualifications
- `communicationStyles` - General attributes
- `ageGroupExperience` - Professional experience
- `availability` - Schedule data

## Usage Patterns

### Pattern 1: Encrypting Before Insert

```typescript
import { db } from '@/lib/db';
import { encryptFields } from '@/lib/encryption/drizzle-helpers';
import { clients } from '@/models/client.schema';

async function createClient(data: ClientInput) {
  const encrypted = await encryptFields(data, [
    'firstName',
    'lastName',
    'dateOfBirth',
    'email',
    'phone',
  ]);

  return await db.insert(clients).values({
    ...encrypted,
    tenantId: data.tenantId,
    ageGroup: data.ageGroup,
  });
}
```

### Pattern 2: Decrypting After Select

```typescript
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { decryptFields } from '@/lib/encryption/drizzle-helpers';
import { clients } from '@/models/client.schema';

async function getClient(clientId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId));

  if (!client) {
    return null;
  }

  return decryptFields(client, [
    'firstName',
    'lastName',
    'dateOfBirth',
    'email',
    'phone',
  ]);
}
```

### Pattern 3: Decrypting Arrays

```typescript
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { decryptFieldsArray } from '@/lib/encryption/drizzle-helpers';
import { clients } from '@/models/client.schema';

async function getClientsByTenant(tenantId: string) {
  const results = await db
    .select()
    .from(clients)
    .where(eq(clients.tenantId, tenantId));

  return decryptFieldsArray(results, [
    'firstName',
    'lastName',
    'email',
  ]);
}
```

## Environment Variables

```bash
# Required: 256-bit encryption key (64 hex characters)
# Generate with: openssl rand -hex 32
PHI_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Optional: Key identifier for rotation
PHI_ENCRYPTION_KEY_ID=dev-key-1
```

## Key Rotation

When rotating encryption keys:

1. Generate new key: `openssl rand -hex 32`
2. Set new environment variables with new key ID
3. Use `reEncrypt()` method to migrate existing data:

```typescript
import { PHIEncryptionService } from '@/lib/encryption';

const oldService = new PHIEncryptionService(oldKey, 'old-key-id');
const newService = new PHIEncryptionService(newKey, 'new-key-id');

const reEncrypted = newService.reEncrypt(encryptedData, oldService);
```

## Security Best Practices

1. **Never log encrypted or decrypted PHI** - Keep PHI out of application logs
2. **Use audit logging** - Log access to PHI fields (see `@/lib/audit`)
3. **Verify tenant isolation** - Always include `tenantId` in queries
4. **Check RBAC permissions** - Verify user has permission before decrypting
5. **Secure key storage** - Never commit encryption keys to version control
6. **Rotate keys regularly** - Follow organizational key rotation policy

## References

- **HIPAA Regulations:** 45 CFR § 164.312(a)(2)(iv) - Encryption and Decryption
- **NIST Guidelines:** NIST SP 800-111 - Storage Encryption Technologies
- **Algorithm:** AES-256-GCM (NIST FIPS 197 + NIST SP 800-38D)
