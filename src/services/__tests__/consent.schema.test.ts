import { getTableColumns, getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { consents } from '@/models/consent.schema';

describe('consent.schema', () => {
  it('uses consents table name', () => {
    expect(getTableName(consents)).toBe('consents');
  });

  it('defines required lifecycle columns', () => {
    const columns = getTableColumns(consents);

    expect(columns.consentType).toBeDefined();
    expect(columns.status).toBeDefined();
    expect(columns.grantedAt).toBeDefined();
    expect(columns.revokedAt).toBeDefined();
    expect(columns.expiresAt).toBeDefined();
  });

  it('defines signature and document metadata columns', () => {
    const columns = getTableColumns(consents);

    expect(columns.documentVersion).toBeDefined();
    expect(columns.signatureHash).toBeDefined();
    expect(columns.witnessUserId).toBeDefined();
  });
});
