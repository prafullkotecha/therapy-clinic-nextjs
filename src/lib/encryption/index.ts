/**
 * PHI Encryption Module
 *
 * Provides HIPAA-compliant encryption services for Protected Health Information.
 */

import { createKMSService } from './kms.service';
import { EncryptionService, getEncryptionServiceFromEnv, resetEncryptionServiceSingleton } from './encryption.service';
import { PHIEncryptionService } from './phi-encryption.service';

export { createKMSService, type KMSService } from './kms.service';
export {
  EncryptionService,
  getEncryptionServiceFromEnv,
  resetEncryptionServiceSingleton,
} from './encryption.service';
export { PHIEncryptionService } from './phi-encryption.service';

let encryptionServiceInstance: PHIEncryptionService | null = null;

export async function getEncryptionService(): Promise<PHIEncryptionService> {
  if (encryptionServiceInstance) {
    return encryptionServiceInstance;
  }

  const kmsService = createKMSService();
  const dataKey = await kmsService.getDataKey();
  const keyId = kmsService.getKeyId();

  encryptionServiceInstance = new PHIEncryptionService(dataKey, keyId);

  return encryptionServiceInstance;
}

export function getEncryptionServiceSync(): PHIEncryptionService {
  if (!encryptionServiceInstance) {
    const kmsService = createKMSService();

    const key = process.env.PHI_ENCRYPTION_KEY;
    if (!key) {
      throw new Error(
        'PHI_ENCRYPTION_KEY environment variable is required. '
        + 'Generate with: openssl rand -hex 32',
      );
    }

    if (key.length !== 64) {
      throw new Error(
        'PHI_ENCRYPTION_KEY must be 64 hex characters (32 bytes). '
        + 'Generate with: openssl rand -hex 32',
      );
    }

    const dataKey = Buffer.from(key, 'hex');
    const keyId = kmsService.getKeyId();

    encryptionServiceInstance = new PHIEncryptionService(dataKey, keyId);
  }
  return encryptionServiceInstance;
}

export function resetEncryptionService(): void {
  encryptionServiceInstance = null;
}
