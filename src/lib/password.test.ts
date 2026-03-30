import { describe, expect, it } from 'vitest';
import { hashPassword, hashPasswordSync, PASSWORD_HASH_PARAMS, verifyPassword } from './password';

describe('password', () => {
  it('hashPasswordSync and verifyPassword should validate correct password', async () => {
    const hash = hashPasswordSync('Password123!@#');

    await expect(verifyPassword('Password123!@#', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('hashPassword should produce scrypt hash format', async () => {
    const hash = await hashPassword('Password123!@#');

    expect(hash.startsWith('scrypt$')).toBe(true);
    await expect(verifyPassword('Password123!@#', hash)).resolves.toBe(true);
  });

  it('rejects hashes with unexpected scrypt parameters', async () => {
    const hash = hashPasswordSync('Password123!@#');
    const tampered = hash.replace(
      `scrypt$${PASSWORD_HASH_PARAMS.n}$${PASSWORD_HASH_PARAMS.r}$${PASSWORD_HASH_PARAMS.p}$`,
      `scrypt$${PASSWORD_HASH_PARAMS.n * 2}$${PASSWORD_HASH_PARAMS.r}$${PASSWORD_HASH_PARAMS.p}$`,
    );

    await expect(verifyPassword('Password123!@#', tampered)).resolves.toBe(false);
  });
});
