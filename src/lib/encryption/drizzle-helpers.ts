/**
 * Drizzle ORM Helpers for Encrypted Fields
 *
 * Provides utilities for transforming encrypted fields in Drizzle queries.
 * Handles encryption/decryption transparently when inserting/selecting data.
 *
 * Usage:
 * ```typescript
 * import { encryptFields, decryptFields } from '@/lib/encryption/drizzle-helpers';
 *
 * // Encrypting before insert
 * const encryptedData = await encryptFields({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john@example.com',
 * }, ['firstName', 'lastName', 'email']);
 *
 * // Decrypting after select
 * const decryptedData = await decryptFields(dbResult, ['firstName', 'lastName', 'email']);
 * ```
 *
 * @see CLAUDE.md for usage patterns
 */

import { getEncryptionServiceSync } from './index';

/**
 * Encrypt specified fields in an object before database insertion
 *
 * @param data - Object containing fields to encrypt
 * @param fields - Array of field names to encrypt
 * @returns New object with encrypted fields
 */
export async function encryptFields<T extends Record<string, any>>(
  data: T,
  fields: readonly (keyof T)[],
): Promise<T> {
  const service = getEncryptionServiceSync();
  const result = { ...data };

  for (const field of fields) {
    const value = data[field];
    if (value !== null && value !== undefined) {
      // Convert to string if not already
      const stringValue = typeof value === 'string' ? value : String(value);
      result[field] = service.encrypt(stringValue) as T[keyof T];
    }
  }

  return result;
}

/**
 * Decrypt specified fields in an object after database query
 *
 * @param data - Object containing encrypted fields
 * @param fields - Array of field names to decrypt
 * @returns New object with decrypted fields
 */
export function decryptFields<T extends Record<string, any>>(
  data: T,
  fields: readonly (keyof T)[],
): T {
  const service = getEncryptionServiceSync();
  const result = { ...data };

  for (const field of fields) {
    const value = data[field];
    if (value !== null && value !== undefined && typeof value === 'string') {
      result[field] = service.decrypt(value) as T[keyof T];
    }
  }

  return result;
}

/**
 * Decrypt fields in an array of objects
 *
 * @param dataArray - Array of objects containing encrypted fields
 * @param fields - Array of field names to decrypt
 * @returns New array with decrypted fields
 */
export function decryptFieldsArray<T extends Record<string, any>>(
  dataArray: T[],
  fields: readonly (keyof T)[],
): T[] {
  return dataArray.map(item => decryptFields(item, fields));
}

/**
 * Field mapping helper for PHI fields
 *
 * Maps common PHI field names to their encrypted database column names.
 * Useful when working with client/therapist data.
 */
export const PHI_FIELD_MAPPINGS = {
  // Client fields
  firstName: 'first_name_encrypted',
  lastName: 'last_name_encrypted',
  dateOfBirth: 'date_of_birth_encrypted',
  ssn: 'ssn_encrypted',
  email: 'email_encrypted',
  phone: 'phone_encrypted',
  address: 'address_encrypted',
  guardianName: 'guardian_name_encrypted',
  guardianPhone: 'guardian_phone_encrypted',
  guardianEmail: 'guardian_email_encrypted',
  emergencyContactName: 'emergency_contact_name_encrypted',
  emergencyContactPhone: 'emergency_contact_phone_encrypted',
  insuranceProvider: 'insurance_provider_encrypted',
  insurancePolicyNumber: 'insurance_policy_number_encrypted',
  insuranceGroupNumber: 'insurance_group_number_encrypted',

  // Client needs fields
  primaryConcerns: 'primary_concerns_encrypted',
  behavioralCharacteristics: 'behavioral_characteristics_encrypted',
  sensoryConsiderations: 'sensory_considerations_encrypted',
} as const;

/**
 * Get list of PHI fields for a given entity type
 */
export function getPHIFields(entityType: 'client' | 'clientNeeds'): string[] {
  switch (entityType) {
    case 'client':
      return [
        'firstName',
        'lastName',
        'dateOfBirth',
        'ssn',
        'email',
        'phone',
        'address',
        'guardianName',
        'guardianPhone',
        'guardianEmail',
        'emergencyContactName',
        'emergencyContactPhone',
        'insuranceProvider',
        'insurancePolicyNumber',
        'insuranceGroupNumber',
      ];
    case 'clientNeeds':
      return [
        'primaryConcerns',
        'behavioralCharacteristics',
        'sensoryConsiderations',
      ];
    default:
      return [];
  }
}
