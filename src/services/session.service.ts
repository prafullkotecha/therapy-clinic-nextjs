import { and, eq } from 'drizzle-orm';
import { getEncryptionServiceSync } from '@/lib/encryption';
import { withTenantContext } from '@/lib/tenant-db';
import { db } from '@/libs/DB';
import { sessions } from '@/models/session.schema';
import { logAudit } from '@/services/audit.service';

export type SessionNoteInput = {
  locationId: string;
  appointmentId: string;
  clientId: string;
  therapistId: string;
  sessionDate: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  sessionType: string;
  units: number;
  clientAttendance: string;
  sessionSummary?: string;
  clinicalNotes?: string;
  createdBy: string;
};

export type SessionNoteFilters = {
  clientId?: string;
  sessionDate?: string;
};

function encryptOptionalValue(value?: string): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  return getEncryptionServiceSync().encrypt(value);
}

function decryptOptionalValue(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return getEncryptionServiceSync().decrypt(value);
}

export async function createSessionNote(
  tenantId: string,
  data: SessionNoteInput,
): Promise<typeof sessions.$inferSelect> {
  return withTenantContext(tenantId, async () => {
    const [created] = await db
      .insert(sessions)
      .values({
        tenantId,
        locationId: data.locationId,
        appointmentId: data.appointmentId,
        clientId: data.clientId,
        therapistId: data.therapistId,
        sessionDate: data.sessionDate,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: data.durationMinutes,
        sessionType: data.sessionType,
        units: data.units,
        clientAttendance: data.clientAttendance,
        sessionSummary: encryptOptionalValue(data.sessionSummary),
        clinicalNotes: encryptOptionalValue(data.clinicalNotes),
        createdBy: data.createdBy,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create session note');
    }

    await logAudit(tenantId, {
      userId: data.createdBy,
      action: 'create',
      resource: 'session_note',
      resourceId: created.id,
      phiAccessed: true,
    });

    return {
      ...created,
      sessionSummary: decryptOptionalValue(created.sessionSummary),
      clinicalNotes: decryptOptionalValue(created.clinicalNotes),
    };
  });
}

export async function getSessionNotes(
  tenantId: string,
  therapistId: string,
  filters: SessionNoteFilters = {},
): Promise<Array<typeof sessions.$inferSelect>> {
  return withTenantContext(tenantId, async () => {
    const conditions = [
      eq(sessions.tenantId, tenantId),
      eq(sessions.therapistId, therapistId),
    ];

    if (filters.clientId) {
      conditions.push(eq(sessions.clientId, filters.clientId));
    }

    if (filters.sessionDate) {
      conditions.push(eq(sessions.sessionDate, filters.sessionDate));
    }

    const rows = await db.select().from(sessions).where(and(...conditions));
    return rows.map(row => ({
      ...row,
      sessionSummary: decryptOptionalValue(row.sessionSummary),
      clinicalNotes: decryptOptionalValue(row.clinicalNotes),
    }));
  });
}

export async function getSessionNote(
  tenantId: string,
  noteId: string,
): Promise<typeof sessions.$inferSelect | null> {
  return withTenantContext(tenantId, async () => {
    const [row] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.tenantId, tenantId), eq(sessions.id, noteId)))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      ...row,
      sessionSummary: decryptOptionalValue(row.sessionSummary),
      clinicalNotes: decryptOptionalValue(row.clinicalNotes),
    };
  });
}

export async function updateSessionNote(
  tenantId: string,
  noteId: string,
  data: Partial<Pick<SessionNoteInput, 'sessionSummary' | 'clinicalNotes' | 'clientAttendance'>>,
): Promise<typeof sessions.$inferSelect> {
  return withTenantContext(tenantId, async () => {
    const [updated] = await db
      .update(sessions)
      .set({
        clientAttendance: data.clientAttendance,
        sessionSummary: data.sessionSummary === undefined ? undefined : encryptOptionalValue(data.sessionSummary),
        clinicalNotes: data.clinicalNotes === undefined ? undefined : encryptOptionalValue(data.clinicalNotes),
        updatedAt: new Date(),
      })
      .where(and(eq(sessions.tenantId, tenantId), eq(sessions.id, noteId)))
      .returning();

    if (!updated) {
      throw new Error('Session note not found');
    }

    return {
      ...updated,
      sessionSummary: decryptOptionalValue(updated.sessionSummary),
      clinicalNotes: decryptOptionalValue(updated.clinicalNotes),
    };
  });
}
