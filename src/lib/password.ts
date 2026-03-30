import { randomBytes, scrypt as nodeScrypt, scryptSync, timingSafeEqual } from 'node:crypto';

// OWASP-recommended interactive login baseline for scrypt (2024):
// N=2^14, r=8, p=1. This provides strong password hashing resistance
// while keeping authentication latency practical for web sign-in flows.
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

export const PASSWORD_HASH_PARAMS = {
  n: SCRYPT_N,
  r: SCRYPT_R,
  p: SCRYPT_P,
} as const;

function encodeHash(salt: Buffer, key: Buffer): string {
  return [
    'scrypt',
    SCRYPT_N.toString(),
    SCRYPT_R.toString(),
    SCRYPT_P.toString(),
    salt.toString('base64url'),
    key.toString('base64url'),
  ].join('$');
}

function parseHash(encodedHash: string): {
  n: number;
  r: number;
  p: number;
  salt: Buffer;
  expected: Buffer;
} | null {
  const parts = encodedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return null;
  }

  const [, nRaw, rRaw, pRaw, saltRaw, expectedRaw] = parts;
  const n = Number.parseInt(nRaw ?? '', 10);
  const r = Number.parseInt(rRaw ?? '', 10);
  const p = Number.parseInt(pRaw ?? '', 10);

  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p) || !saltRaw || !expectedRaw) {
    return null;
  }

  return {
    n,
    r,
    p,
    salt: Buffer.from(saltRaw, 'base64url'),
    expected: Buffer.from(expectedRaw, 'base64url'),
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(password, salt, KEY_LENGTH, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
    }, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(Buffer.from(derivedKey));
    });
  });

  return encodeHash(salt, key);
}

export function hashPasswordSync(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  }) as Buffer;
  return encodeHash(salt, key);
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const parsed = parseHash(encodedHash);
  if (!parsed) {
    return false;
  }
  const { n, r, p, salt, expected } = parsed;
  if (n !== PASSWORD_HASH_PARAMS.n || r !== PASSWORD_HASH_PARAMS.r || p !== PASSWORD_HASH_PARAMS.p) {
    return false;
  }

  const actual = await new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(password, salt, expected.length, {
      N: n,
      r,
      p,
    }, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(Buffer.from(derivedKey));
    });
  });

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
