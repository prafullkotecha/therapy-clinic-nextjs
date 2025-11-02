/**
 * Key Management Service
 *
 * Manages master encryption keys for PHI encryption.
 * Uses environment variables for key storage.
 * Future: Can be extended to integrate with external key management systems.
 *
 * @see IMPLEMENTATION_PLAN.md Section 5.1 for architecture
 */

type KMSConfig = {
  keyId: string;
};

export class KMSService {
  private config: KMSConfig;

  constructor(config: KMSConfig) {
    this.config = config;
  }

  /**
   * Fetch data encryption key
   *
   * Retrieves the master encryption key from environment variables.
   * In the future, this can be extended to fetch from external key management systems.
   *
   * @returns Buffer containing 256-bit encryption key
   */
  // eslint-disable-next-line node/prefer-global/buffer
  async getDataKey(): Promise<Buffer> {
    const key = process.env.PHI_ENCRYPTION_KEY;
    if (!key) {
      throw new Error(
        'PHI_ENCRYPTION_KEY environment variable is required. '
        + 'Generate with: openssl rand -hex 32',
      );
    }

    // Validate key length (64 hex chars = 32 bytes = 256 bits)
    if (key.length !== 64) {
      throw new Error(
        'PHI_ENCRYPTION_KEY must be 64 hex characters (32 bytes). '
        + 'Generate with: openssl rand -hex 32',
      );
    }

    // eslint-disable-next-line node/prefer-global/buffer
    return Buffer.from(key, 'hex');
  }

  /**
   * Get the current key ID
   */
  getKeyId(): string {
    return this.config.keyId;
  }
}

/**
 * Create KMS service instance from environment variables
 */
export function createKMSService(): KMSService {
  const keyId = process.env.PHI_ENCRYPTION_KEY_ID || 'dev-key-1';

  return new KMSService({ keyId });
}
