import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decryptFields, decryptFieldsArray, encryptFields, getPHIFields } from './drizzle-helpers';
import { PHIEncryptionService } from './phi-encryption.service';

// Mock the getEncryptionServiceSync function
let mockService: PHIEncryptionService;

// Mock the module
vi.mock('./index', () => ({
  getEncryptionServiceSync: () => mockService,
}));

describe('drizzle-helpers', () => {
  beforeEach(() => {
    const masterKey = crypto.randomBytes(32);
    mockService = new PHIEncryptionService(masterKey, 'test-key');
  });

  describe('encryptFields', () => {
    it('should encrypt specified fields', async () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        ageGroup: 'adult',
      };

      const encrypted = await encryptFields(data, ['firstName', 'lastName']);

      expect(encrypted.firstName).not.toBe('John');
      expect(encrypted.lastName).not.toBe('Doe');
      expect(encrypted.ageGroup).toBe('adult'); // Not encrypted
    });

    it('should handle null values', async () => {
      const data = {
        firstName: 'John',
        middleName: null,
        lastName: 'Doe',
      };

      const encrypted = await encryptFields(data, ['firstName', 'middleName', 'lastName']);

      expect(encrypted.firstName).not.toBe('John');
      expect(encrypted.middleName).toBeNull();
      expect(encrypted.lastName).not.toBe('Doe');
    });

    it('should handle undefined values', async () => {
      const data = {
        firstName: 'John',
        middleName: undefined,
        lastName: 'Doe',
      };

      const encrypted = await encryptFields(data, ['firstName', 'middleName', 'lastName']);

      expect(encrypted.firstName).not.toBe('John');
      expect(encrypted.middleName).toBeUndefined();
      expect(encrypted.lastName).not.toBe('Doe');
    });

    it('should convert non-string values to strings', async () => {
      const data = {
        age: 25,
        active: true,
      };

      const encrypted = await encryptFields(data, ['age', 'active']);

      const decrypted = decryptFields(encrypted, ['age', 'active']);

      expect(decrypted.age).toBe('25');
      expect(decrypted.active).toBe('true');
    });

    it('should not modify original object', async () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
      };

      const encrypted = await encryptFields(data, ['firstName', 'lastName']);

      expect(data.firstName).toBe('John');
      expect(data.lastName).toBe('Doe');
      expect(encrypted).not.toBe(data);
    });
  });

  describe('decryptFields', () => {
    it('should decrypt specified fields', () => {
      const encrypted = {
        firstName: mockService.encrypt('John'),
        lastName: mockService.encrypt('Doe'),
        ageGroup: 'adult',
      };

      const decrypted = decryptFields(encrypted, ['firstName', 'lastName']);

      expect(decrypted.firstName).toBe('John');
      expect(decrypted.lastName).toBe('Doe');
      expect(decrypted.ageGroup).toBe('adult');
    });

    it('should handle null values', () => {
      const encrypted = {
        firstName: mockService.encrypt('John'),
        middleName: null,
        lastName: mockService.encrypt('Doe'),
      };

      const decrypted = decryptFields(encrypted, ['firstName', 'middleName', 'lastName']);

      expect(decrypted.firstName).toBe('John');
      expect(decrypted.middleName).toBeNull();
      expect(decrypted.lastName).toBe('Doe');
    });

    it('should handle undefined values', () => {
      const encrypted = {
        firstName: mockService.encrypt('John'),
        middleName: undefined,
        lastName: mockService.encrypt('Doe'),
      };

      const decrypted = decryptFields(encrypted, ['firstName', 'middleName', 'lastName']);

      expect(decrypted.firstName).toBe('John');
      expect(decrypted.middleName).toBeUndefined();
      expect(decrypted.lastName).toBe('Doe');
    });

    it('should not modify original object', () => {
      const encrypted = {
        firstName: mockService.encrypt('John'),
        lastName: mockService.encrypt('Doe'),
      };

      const decrypted = decryptFields(encrypted, ['firstName', 'lastName']);

      expect(encrypted.firstName).not.toBe('John');
      expect(decrypted).not.toBe(encrypted);
    });
  });

  describe('decryptFieldsArray', () => {
    it('should decrypt fields in array of objects', () => {
      const encryptedArray = [
        {
          id: '1',
          firstName: mockService.encrypt('John'),
          lastName: mockService.encrypt('Doe'),
        },
        {
          id: '2',
          firstName: mockService.encrypt('Jane'),
          lastName: mockService.encrypt('Smith'),
        },
      ];

      const decrypted = decryptFieldsArray(encryptedArray, ['firstName', 'lastName']);

      expect(decrypted).toHaveLength(2);
      expect(decrypted[0]!.firstName).toBe('John');
      expect(decrypted[0]!.lastName).toBe('Doe');
      expect(decrypted[1]!.firstName).toBe('Jane');
      expect(decrypted[1]!.lastName).toBe('Smith');
    });

    it('should handle empty array', () => {
      const decrypted = decryptFieldsArray([], ['firstName']);

      expect(decrypted).toHaveLength(0);
    });

    it('should not modify original array', () => {
      const encryptedArray = [
        {
          firstName: mockService.encrypt('John'),
          lastName: mockService.encrypt('Doe'),
        },
      ];

      const decrypted = decryptFieldsArray(encryptedArray, ['firstName', 'lastName']);

      expect(encryptedArray[0]!.firstName).not.toBe('John');
      expect(decrypted).not.toBe(encryptedArray);
    });
  });

  describe('round-trip encryption/decryption', () => {
    it('should successfully round-trip client data', async () => {
      const clientData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-15',
        email: 'john.doe@example.com',
        phone: '555-1234',
        ageGroup: 'adult',
      };

      const phiFields = ['firstName', 'lastName', 'dateOfBirth', 'email', 'phone'] as const;

      const encrypted = await encryptFields(clientData, phiFields);
      const decrypted = decryptFields(encrypted, phiFields);

      expect(decrypted.firstName).toBe(clientData.firstName);
      expect(decrypted.lastName).toBe(clientData.lastName);
      expect(decrypted.dateOfBirth).toBe(clientData.dateOfBirth);
      expect(decrypted.email).toBe(clientData.email);
      expect(decrypted.phone).toBe(clientData.phone);
      expect(decrypted.ageGroup).toBe(clientData.ageGroup);
    });

    it('should handle partial PHI fields', async () => {
      const clientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: null,
        phone: undefined,
        ageGroup: 'adult',
      };

      const phiFields = ['firstName', 'lastName', 'email', 'phone'] as const;

      const encrypted = await encryptFields(clientData, phiFields);
      const decrypted = decryptFields(encrypted, phiFields);

      expect(decrypted.firstName).toBe('John');
      expect(decrypted.lastName).toBe('Doe');
      expect(decrypted.email).toBeNull();
      expect(decrypted.phone).toBeUndefined();
    });
  });

  describe('getPHIFields', () => {
    it('should return client PHI fields', () => {
      const fields = getPHIFields('client');

      expect(fields).toContain('firstName');
      expect(fields).toContain('lastName');
      expect(fields).toContain('dateOfBirth');
      expect(fields).toContain('ssn');
      expect(fields).toContain('email');
      expect(fields).toContain('phone');
      expect(fields).toContain('address');
      expect(fields).toContain('guardianName');
      expect(fields).toContain('insuranceProvider');
    });

    it('should return clientNeeds PHI fields', () => {
      const fields = getPHIFields('clientNeeds');

      expect(fields).toContain('primaryConcerns');
      expect(fields).toContain('behavioralCharacteristics');
      expect(fields).toContain('sensoryConsiderations');
    });

    it('should return empty array for unknown entity type', () => {
      // @ts-expect-error - Testing invalid input
      const fields = getPHIFields('unknown');

      expect(fields).toHaveLength(0);
    });
  });
});
