import { and, desc, eq, gt, isNull, or } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { consents, type ConsentType } from '@/models/consent.schema';

export async function grantConsent(
  tenantId: string,
  clientId: string,
  consentType: ConsentType,
  documentVersion: string,
  signatureHash: string,
): Promise<void> {
  await db.insert(consents).values({
    tenantId,
    clientId,
    consentType,
    status: 'active',
    documentVersion,
    signatureHash,
  });
}

export async function revokeConsent(
  tenantId: string,
  consentId: string,
  reason: string,
): Promise<void> {
  await db
    .update(consents)
    .set({
      status: 'revoked',
      revokedAt: new Date(),
      revocationReason: reason,
      updatedAt: new Date(),
    })
    .where(and(eq(consents.id, consentId), eq(consents.tenantId, tenantId)));
}

export async function getActiveConsents(
  tenantId: string,
  clientId: string,
) {
  return db
    .select()
    .from(consents)
    .where(
      and(
        eq(consents.tenantId, tenantId),
        eq(consents.clientId, clientId),
        eq(consents.status, 'active'),
        or(isNull(consents.expiresAt), gt(consents.expiresAt, new Date())),
      ),
    )
    .orderBy(desc(consents.grantedAt));
}

export async function isConsentValid(
  tenantId: string,
  clientId: string,
  consentType: ConsentType,
): Promise<boolean> {
  const [result] = await db
    .select({ id: consents.id })
    .from(consents)
    .where(
      and(
        eq(consents.tenantId, tenantId),
        eq(consents.clientId, clientId),
        eq(consents.consentType, consentType),
        eq(consents.status, 'active'),
        or(isNull(consents.expiresAt), gt(consents.expiresAt, new Date())),
      ),
    )
    .limit(1);

  return Boolean(result);
}

export async function getConsentHistory(
  tenantId: string,
  clientId: string,
) {
  return db
    .select()
    .from(consents)
    .where(and(eq(consents.tenantId, tenantId), eq(consents.clientId, clientId)))
    .orderBy(desc(consents.grantedAt));
}
