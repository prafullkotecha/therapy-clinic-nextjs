import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EncryptionService, resetEncryptionServiceSingleton } from '@/lib/encryption/encryption.service';

describe('EncryptionService', () => {
  const currentKeyId = 'key-v2';
  const currentKey = 'a'.repeat(64);
  const oldKey = 'b'.repeat(64);

  beforeEach(() => {
    vi.useRealTimers();
    resetEncryptionServiceSingleton();
  });

  it('encrypts and decrypts roundtrip plaintext', () => {
    const service = new EncryptionService({
      currentKeyId,
      currentRawKey: currentKey,
    });

    const encrypted = service.encrypt('John Doe');
    const decrypted = service.decrypt(encrypted);

    expect(encrypted).not.toBe('John Doe');
    expect(decrypted).toBe('John Doe');
  });

  it('supports empty unicode long and phi-like plaintext values', () => {
    const service = new EncryptionService({
      currentKeyId,
      currentRawKey: currentKey,
    });

    const values = [
      '',
      '患者 🔒 élan — consent',
      'X'.repeat(10_000),
      'Name: Jane Doe; DOB: 1990-01-01; SSN: 123-45-6789',
    ];

    values.forEach((value) => {
      const encrypted = service.encrypt(value);
      expect(service.isEncrypted(encrypted)).toBe(true);
      expect(service.decrypt(encrypted)).toBe(value);
    });
  });

  it('throws on invalid ciphertext format and unknown key id', () => {
    const service = new EncryptionService({
      currentKeyId,
      currentRawKey: currentKey,
    });

    expect(() => service.decrypt('not-valid')).toThrow('Invalid ciphertext format');
    expect(() => service.decrypt('old:abc:def:1234')).toThrow('Invalid ciphertext format');

    const encrypted = service.encrypt('value');
    const [key, ...parts] = encrypted.split(':');
    const replaced = ['unknown', ...parts].join(':');
    expect(key).toBe(currentKeyId);
    expect(() => service.decrypt(replaced)).toThrow('No encryption key available for key ID: unknown');
  });

  it('decrypts payloads encrypted by old keys during rotation', () => {
    const oldService = new EncryptionService({
      currentKeyId: 'key-v1',
      currentRawKey: oldKey,
    });

    const rotatedService = new EncryptionService({
      currentKeyId,
      currentRawKey: currentKey,
      oldKeys: [
        { keyId: 'key-v1', rawKey: oldKey },
      ],
    });

    const oldCipher = oldService.encrypt('legacy phi');
    expect(rotatedService.decrypt(oldCipher)).toBe('legacy phi');

    const newCipher = rotatedService.encrypt('new phi');
    expect(newCipher.startsWith(`${currentKeyId}:`)).toBe(true);
    expect(rotatedService.decrypt(newCipher)).toBe('new phi');
  });

  it('encrypts 1000 records in under 1 second', () => {
    const service = new EncryptionService({
      currentKeyId,
      currentRawKey: currentKey,
    });

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      service.encrypt(`record-${i}`);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1000);
  });

  it('detects encrypted format correctly with isEncrypted helper', () => {
    const service = new EncryptionService({
      currentKeyId,
      currentRawKey: currentKey,
    });

    const encrypted = service.encrypt('plain');

    expect(service.isEncrypted(encrypted)).toBe(true);
    expect(service.isEncrypted('plain')).toBe(false);
    expect(service.isEncrypted('key:short:tag:cipher')).toBe(false);
  });
});
