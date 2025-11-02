import crypto from 'node:crypto';

/**
 * PHI Encryption Service
 *
 * HIPAA-compliant encryption service for Protected Health Information (PHI).
 * Uses AES-256-GCM with authenticated encryption.
 *
 * Format: keyId:iv:authTag:ciphertext
 * - keyId: Identifies which master key was used (for rotation)
 * - iv: Initialization vector (96 bits for GCM)
 * - authTag: Authentication tag (128 bits)
 * - ciphertext: Encrypted data
 *
 * @see CLAUDE.md for usage patterns
 * @see IMPLEMENTATION_PLAN.md Section 5.1 for architecture
 */
export class PHIEncryptionService {
  private algorithm = 'aes-256-gcm' as const;
  private keyLength = 32; // 256 bits
  private ivLength = 12; // 96 bits (recommended for GCM)
  private authTagLength = 16; // 128 bits

  constructor(
    // eslint-disable-next-line node/prefer-global/buffer
    private masterKey: Buffer,
    private keyId: string,
  ) {
    if (masterKey.length !== this.keyLength) {
      throw new Error(`Master key must be ${this.keyLength} bytes (256 bits)`);
    }
    if (!keyId || keyId.trim().length === 0) {
      throw new Error('Key ID must be provided');
    }
  }

  /**
   * Encrypt PHI data
   *
   * @param plaintext - Data to encrypt (will be converted to string)
   * @returns Encrypted string in format: keyId:iv:authTag:ciphertext
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new Error('Plaintext cannot be empty');
    }

    // Generate random IV for each encryption
    const iv = crypto.randomBytes(this.ivLength);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv, {
      authTagLength: this.authTagLength,
    });

    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Format: keyId:iv:authTag:ciphertext
    return [
      this.keyId,
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted,
    ].join(':');
  }

  /**
   * Decrypt PHI data
   *
   * @param ciphertext - Encrypted string in format: keyId:iv:authTag:ciphertext
   * @returns Decrypted plaintext
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) {
      throw new Error('Ciphertext cannot be empty');
    }

    // Parse encrypted data
    const parts = ciphertext.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid ciphertext format. Expected: keyId:iv:authTag:ciphertext');
    }

    const [keyId, ivHex, authTagHex, encrypted] = parts;

    // TypeScript narrow: ensure all parts exist
    if (!keyId || !ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid ciphertext format: missing components');
    }

    // Verify key ID matches
    if (keyId !== this.keyId) {
      throw new Error(`Encryption key mismatch. Expected: ${this.keyId}, got: ${keyId}`);
    }

    // Convert from hex
    // eslint-disable-next-line node/prefer-global/buffer
    const iv = Buffer.from(ivHex, 'hex');
    // eslint-disable-next-line node/prefer-global/buffer
    const authTag = Buffer.from(authTagHex, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv, {
      authTagLength: this.authTagLength,
    });

    // Set authentication tag
    decipher.setAuthTag(authTag);

    // Decrypt data
    const decryptedBuffer = decipher.update(encrypted, 'hex', 'utf8');
    const finalBuffer = decipher.final('utf8');
    const decrypted = decryptedBuffer + finalBuffer;

    return decrypted;
  }

  /**
   * Re-encrypt data with a new key (for key rotation)
   *
   * @param ciphertext - Data encrypted with old key
   * @param oldService - PHIEncryptionService instance with old key
   * @returns Data encrypted with current key
   */
  reEncrypt(ciphertext: string, oldService: PHIEncryptionService): string {
    const plaintext = oldService.decrypt(ciphertext);
    return this.encrypt(plaintext);
  }

  /**
   * Get the current key ID
   */
  getKeyId(): string {
    return this.keyId;
  }
}
