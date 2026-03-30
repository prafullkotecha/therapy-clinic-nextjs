import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDataKeyMock = vi.fn();
const getKeyIdMock = vi.fn();

vi.mock('@/lib/encryption/kms.service', () => ({
  createKMSService: vi.fn(() => ({
    getDataKey: getDataKeyMock,
    getKeyId: getKeyIdMock,
  })),
}));

describe('encryption index exports', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('getEncryptionService creates singleton from kms service', async () => {
    getDataKeyMock.mockResolvedValueOnce(Buffer.alloc(32, 1));
    getKeyIdMock.mockReturnValue('key-1');

    const { getEncryptionService } = await import('@/lib/encryption');
    const first = await getEncryptionService();
    const second = await getEncryptionService();

    expect(first).toBe(second);
    expect(getDataKeyMock).toHaveBeenCalledTimes(1);
  });

  it('getEncryptionServiceSync throws when PHI key is missing', async () => {
    const original = process.env.PHI_ENCRYPTION_KEY;
    delete process.env.PHI_ENCRYPTION_KEY;

    const { getEncryptionServiceSync, resetEncryptionService } = await import('@/lib/encryption');
    resetEncryptionService();
    expect(() => getEncryptionServiceSync()).toThrow(/PHI_ENCRYPTION_KEY environment variable is required/);

    process.env.PHI_ENCRYPTION_KEY = original;
  });

  it('resetEncryptionService clears singleton state', async () => {
    process.env.PHI_ENCRYPTION_KEY = 'c'.repeat(64);
    getKeyIdMock.mockReturnValue('key-2');

    const { getEncryptionServiceSync, resetEncryptionService } = await import('@/lib/encryption');
    const first = getEncryptionServiceSync();
    resetEncryptionService();
    const second = getEncryptionServiceSync();

    expect(first).not.toBe(second);
  });
});
