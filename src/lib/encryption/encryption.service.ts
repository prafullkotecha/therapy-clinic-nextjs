import crypto from 'node:crypto';

const CIPHERTEXT_PARTS_COUNT = 4;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const KEY_BYTES = 32;

export type EncryptionKeyConfig = {
  keyId: string;
  rawKey: string;
};

export type EncryptionServiceConfig = {
  currentKeyId?: string;
  currentRawKey?: string;
  oldKeys?: EncryptionKeyConfig[];
};

function deriveKey(rawKey: string): Buffer {
  if (rawKey.length === 64 && /^[0-9a-fA-F]+$/.test(rawKey)) {
    return Buffer.from(rawKey, 'hex');
  }

  return crypto
    .createHash('sha256')
    .update(rawKey, 'utf8')
    .digest();
}

function parseOldKeys(rawOldKeys: string | undefined): EncryptionKeyConfig[] {
  if (!rawOldKeys) {
    return [];
  }

  return rawOldKeys
    .split(',')
    .map((entry) => {
      const [keyIdPart, keyPart] = entry.split('=');
      const keyId = keyIdPart?.trim();
      const rawKey = keyPart?.trim();

      if (!keyId || !rawKey) {
        return null;
      }

      return { keyId, rawKey };
    })
    .filter((entry): entry is EncryptionKeyConfig => entry !== null);
}

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly currentKeyId: string;
  private readonly keysById: Map<string, Buffer>;

  constructor(config: EncryptionServiceConfig = {}) {
    const currentRawKey = config.currentRawKey ?? process.env.PHI_ENCRYPTION_KEY;
    const currentKeyId = config.currentKeyId ?? process.env.PHI_ENCRYPTION_KEY_ID ?? 'dev-key-1';
    const oldKeys = config.oldKeys ?? parseOldKeys(process.env.PHI_ENCRYPTION_OLD_KEYS);

    if (!currentRawKey) {
      throw new Error('PHI_ENCRYPTION_KEY environment variable is required');
    }

    this.currentKeyId = currentKeyId;
    this.keysById = new Map<string, Buffer>();

    const currentDerivedKey = deriveKey(currentRawKey);
    if (currentDerivedKey.length !== KEY_BYTES) {
      throw new Error('Derived key must be 32 bytes');
    }

    this.keysById.set(currentKeyId, currentDerivedKey);

    oldKeys.forEach((keyConfig) => {
      const derived = deriveKey(keyConfig.rawKey);
      if (derived.length === KEY_BYTES) {
        this.keysById.set(keyConfig.keyId, derived);
      }
    });
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(this.algorithm, this.requireKey(this.currentKeyId), iv, {
      authTagLength: AUTH_TAG_BYTES,
    });

    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]).toString('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${this.currentKeyId}:${iv.toString('hex')}:${authTag}:${ciphertext}`;
  }

  decrypt(ciphertext: string): string {
    const [keyId, ivHex, authTagHex, encryptedHex] = this.parseCiphertext(ciphertext);
    const key = this.requireKey(keyId);

    const decipher = crypto.createDecipheriv(this.algorithm, key, Buffer.from(ivHex, 'hex'), {
      authTagLength: AUTH_TAG_BYTES,
    });

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final(),
    ]);

    return plaintext.toString('utf8');
  }

  isEncrypted(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    const parts = value.split(':');
    if (parts.length !== CIPHERTEXT_PARTS_COUNT) {
      return false;
    }

    const [keyId, ivHex, authTagHex, encryptedHex] = parts;
    if (!keyId || !ivHex || !authTagHex || encryptedHex === undefined) {
      return false;
    }

    return /^[0-9a-f]+$/i.test(ivHex)
      && /^[0-9a-f]+$/i.test(authTagHex)
      && /^[0-9a-f]*$/i.test(encryptedHex)
      && ivHex.length === IV_BYTES * 2
      && authTagHex.length === AUTH_TAG_BYTES * 2;
  }

  private parseCiphertext(ciphertext: string): [string, string, string, string] {
    const parts = ciphertext.split(':');

    if (parts.length !== CIPHERTEXT_PARTS_COUNT) {
      throw new Error('Invalid ciphertext format. Expected keyId:iv:authTag:ciphertext');
    }

    const [keyId, ivHex, authTagHex, encryptedHex] = parts;

    if (!keyId || !ivHex || !authTagHex || encryptedHex === undefined) {
      throw new Error('Invalid ciphertext format. Missing required parts');
    }

    if (!this.isEncrypted(ciphertext)) {
      throw new Error('Invalid ciphertext format');
    }

    return [keyId, ivHex, authTagHex, encryptedHex];
  }

  private requireKey(keyId: string): Buffer {
    const key = this.keysById.get(keyId);
    if (!key) {
      throw new Error(`No encryption key available for key ID: ${keyId}`);
    }

    return key;
  }
}

let singleton: EncryptionService | null = null;

export function getEncryptionServiceFromEnv(): EncryptionService {
  if (!singleton) {
    singleton = new EncryptionService();
  }

  return singleton;
}

export function resetEncryptionServiceSingleton(): void {
  singleton = null;
}
