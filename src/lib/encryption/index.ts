/**
 * PHI Encryption Module
 *
 * Provides HIPAA-compliant encryption services for Protected Health Information.
 *
 * Usage:
 * ```typescript
 * import { encryptionService } from '@/lib/encryption';
 *
 * // Encrypt PHI
 * const encrypted = encryptionService.encrypt('John Doe');
 *
 * // Decrypt PHI
 * const decrypted = encryptionService.decrypt(encrypted);
 * ```
 *
 * @see CLAUDE.md for patterns and best practices
 * @see IMPLEMENTATION_PLAN.md Section 5.1 for architecture
 */

import { createKMSService } from './kms.service';
import { PHIEncryptionService } from './phi-encryption.service';

export { createKMSService, KMSService } from './kms.service';
// Export classes for testing and advanced usage
export { PHIEncryptionService } from './phi-encryption.service';

// Singleton instance for application use
let encryptionServiceInstance: PHIEncryptionService | null = null;

/**
 * Get or create the singleton encryption service instance
 *
 * Lazily initializes the encryption service with KMS-provided keys.
 * Throws an error if required environment variables are missing.
 */
export async function getEncryptionService(): Promise<PHIEncryptionService> {
  if (encryptionServiceInstance) {
    return encryptionServiceInstance;
  }

  // Initialize KMS service
  const kmsService = createKMSService();

  // Fetch data encryption key from KMS
  const dataKey = await kmsService.getDataKey();
  const keyId = kmsService.getKeyId();

  // Create encryption service
  encryptionServiceInstance = new PHIEncryptionService(dataKey, keyId);

  return encryptionServiceInstance;
}

/**
 * Synchronous encryption service getter with lazy initialization
 *
 * Auto-initializes the service on first use if not already initialized.
 * Note: Initialization is synchronous but reads from environment variables.
 *
 * @throws Error if required environment variables are missing
 */
export function getEncryptionServiceSync(): PHIEncryptionService {
  if (!encryptionServiceInstance) {
    // Lazy initialization - create service synchronously
    const kmsService = createKMSService();

    // Note: getDataKey() is async, but we can make it sync by reading env directly
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
    const dataKey = Buffer.from(key, 'hex');
    const keyId = kmsService.getKeyId();

    encryptionServiceInstance = new PHIEncryptionService(dataKey, keyId);
  }
  return encryptionServiceInstance;
}

/**
 * Reset the encryption service instance (for testing)
 */
export function resetEncryptionService(): void {
  encryptionServiceInstance = null;
}
