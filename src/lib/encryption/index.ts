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
 * Synchronous encryption service getter
 *
 * WARNING: Only use this after the service has been initialized.
 * Call `await getEncryptionService()` first during app startup.
 *
 * @throws Error if service hasn't been initialized yet
 */
export function getEncryptionServiceSync(): PHIEncryptionService {
  if (!encryptionServiceInstance) {
    throw new Error(
      'Encryption service not initialized. '
      + 'Call `await getEncryptionService()` during app startup.',
    );
  }
  return encryptionServiceInstance;
}

/**
 * Reset the encryption service instance (for testing)
 */
export function resetEncryptionService(): void {
  encryptionServiceInstance = null;
}
