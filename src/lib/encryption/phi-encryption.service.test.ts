import crypto from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { PHIEncryptionService } from './phi-encryption.service';

describe('PHIEncryptionService', () => {
  let service: PHIEncryptionService;
  // eslint-disable-next-line node/prefer-global/buffer
  let masterKey: Buffer;
  const keyId = 'test-key-1';

  beforeEach(() => {
    // Generate a random 256-bit key for testing
    masterKey = crypto.randomBytes(32);
    service = new PHIEncryptionService(masterKey, keyId);
  });

  describe('constructor', () => {
    it('should create service with valid key', () => {
      expect(service).toBeDefined();
      expect(service.getKeyId()).toBe(keyId);
    });

    it('should throw error if master key is wrong length', () => {
      const invalidKey = crypto.randomBytes(16); // Only 128 bits

      expect(() => new PHIEncryptionService(invalidKey, keyId)).toThrow(
        'Master key must be 32 bytes (256 bits)',
      );
    });

    it('should throw error if key ID is empty', () => {
      expect(() => new PHIEncryptionService(masterKey, '')).toThrow(
        'Key ID must be provided',
      );
    });
  });

  describe('encrypt', () => {
    it('should encrypt plaintext successfully', () => {
      const plaintext = 'John Doe';
      const ciphertext = service.encrypt(plaintext);

      expect(ciphertext).toBeDefined();
      expect(typeof ciphertext).toBe('string');
      expect(ciphertext).not.toBe(plaintext);
    });

    it('should return ciphertext in correct format', () => {
      const plaintext = 'sensitive@email.com';
      const ciphertext = service.encrypt(plaintext);

      // Format: keyId:iv:authTag:ciphertext
      const parts = ciphertext.split(':');

      expect(parts).toHaveLength(4);
      expect(parts[0]).toBe(keyId);
    });

    it('should produce different ciphertexts for same plaintext', () => {
      const plaintext = 'John Doe';
      const ciphertext1 = service.encrypt(plaintext);
      const ciphertext2 = service.encrypt(plaintext);

      // Should be different due to random IV
      expect(ciphertext1).not.toBe(ciphertext2);
    });

    it('should throw error for empty plaintext', () => {
      expect(() => service.encrypt('')).toThrow('Plaintext cannot be empty');
    });

    it('should encrypt special characters', () => {
      const plaintext = 'Email: test@example.com, Phone: (555) 123-4567!';
      const ciphertext = service.encrypt(plaintext);

      expect(ciphertext).toBeDefined();
    });

    it('should encrypt unicode characters', () => {
      const plaintext = '日本語 émojis 🔒';
      const ciphertext = service.encrypt(plaintext);

      expect(ciphertext).toBeDefined();
    });
  });

  describe('decrypt', () => {
    it('should decrypt ciphertext successfully', () => {
      const plaintext = 'John Doe';
      const ciphertext = service.encrypt(plaintext);
      const decrypted = service.decrypt(ciphertext);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt special characters', () => {
      const plaintext = 'SSN: 123-45-6789, DOB: 01/15/1990';
      const ciphertext = service.encrypt(plaintext);
      const decrypted = service.decrypt(ciphertext);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt unicode characters', () => {
      const plaintext = '日本語 émojis 🔒';
      const ciphertext = service.encrypt(plaintext);
      const decrypted = service.decrypt(ciphertext);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for empty ciphertext', () => {
      expect(() => service.decrypt('')).toThrow('Ciphertext cannot be empty');
    });

    it('should throw error for invalid format', () => {
      expect(() => service.decrypt('invalid-format')).toThrow(
        'Invalid ciphertext format',
      );
    });

    it('should throw error for mismatched key ID', () => {
      const ciphertext = service.encrypt('test');
      const wrongKeyIdCiphertext = ciphertext.replace(keyId, 'wrong-key');

      expect(() => service.decrypt(wrongKeyIdCiphertext)).toThrow(
        'Encryption key mismatch',
      );
    });

    it('should throw error for tampered ciphertext', () => {
      const ciphertext = service.encrypt('test');
      const parts = ciphertext.split(':');
      // Tamper with the encrypted data
      parts[3] = parts[3]!.replace('a', 'b');
      const tamperedCiphertext = parts.join(':');

      expect(() => service.decrypt(tamperedCiphertext)).toThrow();
    });

    it('should throw error for tampered auth tag', () => {
      const ciphertext = service.encrypt('test');
      const parts = ciphertext.split(':');
      // Tamper with the auth tag
      parts[2] = parts[2]!.replace('a', 'b');
      const tamperedCiphertext = parts.join(':');

      expect(() => service.decrypt(tamperedCiphertext)).toThrow();
    });
  });

  describe('round-trip encryption', () => {
    const testCases = [
      'John Doe',
      'test@example.com',
      '123-45-6789',
      '(555) 123-4567',
      '123 Main St, Apt 4B, City, State 12345',
      'Complex: !@#$%^&*()_+-=[]{}|;:,.<>?',
      '日本語',
      'Émojis: 🔒🔐🗝️',
      'Multi\nLine\nText',
      'Very long text '.repeat(100),
    ];

    testCases.forEach((testCase) => {
      it(`should encrypt and decrypt: ${testCase.substring(0, 30)}...`, () => {
        const encrypted = service.encrypt(testCase);
        const decrypted = service.decrypt(encrypted);

        expect(decrypted).toBe(testCase);
      });
    });
  });

  describe('reEncrypt', () => {
    it('should re-encrypt data with new key', () => {
      const plaintext = 'John Doe';

      // Encrypt with old service
      const oldCiphertext = service.encrypt(plaintext);

      // Create new service with different key
      const newMasterKey = crypto.randomBytes(32);
      const newKeyId = 'test-key-2';
      const newService = new PHIEncryptionService(newMasterKey, newKeyId);

      // Re-encrypt
      const newCiphertext = newService.reEncrypt(oldCiphertext, service);

      // Verify new ciphertext is different
      expect(newCiphertext).not.toBe(oldCiphertext);

      // Verify new key ID is in ciphertext
      expect(newCiphertext.startsWith(newKeyId)).toBe(true);

      // Verify decryption with new service works
      const decrypted = newService.decrypt(newCiphertext);

      expect(decrypted).toBe(plaintext);

      // Verify old service can still decrypt old ciphertext
      const oldDecrypted = service.decrypt(oldCiphertext);

      expect(oldDecrypted).toBe(plaintext);
    });

    it('should handle multiple re-encryptions', () => {
      const plaintext = 'Sensitive Data';

      // Version 1
      const v1Ciphertext = service.encrypt(plaintext);

      // Version 2
      const v2Key = crypto.randomBytes(32);
      const v2Service = new PHIEncryptionService(v2Key, 'key-v2');
      const v2Ciphertext = v2Service.reEncrypt(v1Ciphertext, service);

      // Version 3
      const v3Key = crypto.randomBytes(32);
      const v3Service = new PHIEncryptionService(v3Key, 'key-v3');
      const v3Ciphertext = v3Service.reEncrypt(v2Ciphertext, v2Service);

      // All should decrypt correctly
      expect(service.decrypt(v1Ciphertext)).toBe(plaintext);
      expect(v2Service.decrypt(v2Ciphertext)).toBe(plaintext);
      expect(v3Service.decrypt(v3Ciphertext)).toBe(plaintext);
    });
  });

  describe('getKeyId', () => {
    it('should return correct key ID', () => {
      expect(service.getKeyId()).toBe(keyId);
    });
  });

  describe('security properties', () => {
    it('should use different IVs for each encryption', () => {
      const plaintext = 'test';
      const ciphertext1 = service.encrypt(plaintext);
      const ciphertext2 = service.encrypt(plaintext);

      const iv1 = ciphertext1.split(':')[1];
      const iv2 = ciphertext2.split(':')[1];

      expect(iv1).not.toBe(iv2);
    });

    it('should include authentication tag', () => {
      const plaintext = 'test';
      const ciphertext = service.encrypt(plaintext);
      const parts = ciphertext.split(':');

      // Auth tag should be 128 bits = 32 hex characters
      expect(parts[2]!.length).toBe(32);
    });

    it('should use correct IV length (96 bits)', () => {
      const plaintext = 'test';
      const ciphertext = service.encrypt(plaintext);
      const parts = ciphertext.split(':');

      // IV should be 96 bits = 24 hex characters
      expect(parts[1]!.length).toBe(24);
    });
  });
});
