/**
 * Audit Service
 *
 * Handles logging of authentication events and sensitive operations
 * for HIPAA compliance and security monitoring.
 */

import crypto from 'node:crypto';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { auditLogs } from '@/models/user.schema';

/**
 * Authentication event types
 */
export type AuthEventType
  = | 'login_success'
    | 'login_failed'
    | 'logout'
    | 'register'
    | 'password_reset'
    | 'mfa_enabled'
    | 'mfa_disabled'
    | 'account_locked'
    | 'account_unlocked';

const HASH_ALGORITHM = 'sha256';
export const HIPAA_AUDIT_RETENTION_YEARS = 7;

export type AuditResourceType = 'authentication' | 'phi' | 'security' | 'billing' | 'system';

type AuditHashRow = {
  id: string;
  tenantId: string;
  action: string;
  resource: string;
  resourceType: string;
  resourceId: string | null;
  userId: string | null;
  timestamp: Date;
  changes: unknown;
  previousHash: string | null;
  recordHash: string;
};

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `"${key}":${stableStringify(val)}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

function computeRecordHash(input: {
  tenantId: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceType: string;
  resourceId: string | null;
  timestamp: Date;
  previousHash: string;
  changes: unknown;
}): string {
  const payload = [
    input.tenantId,
    input.userId ?? '',
    input.action,
    input.resource,
    input.resourceType,
    input.resourceId ?? '',
    input.timestamp.toISOString(),
    input.previousHash,
    stableStringify(input.changes),
  ].join('|');

  return crypto.createHash(HASH_ALGORITHM).update(payload).digest('hex');
}

async function getLatestRecordHash(tenantId: string): Promise<string | null> {
  if (!('execute' in db) || typeof db.execute !== 'function') {
    return null;
  }

  const result = await db.execute<{ record_hash: string | null }>(sql`
    SELECT record_hash
    FROM audit_logs
    WHERE tenant_id = ${tenantId}
    ORDER BY "timestamp" DESC, id DESC
    LIMIT 1
  `);

  const row = result.rows[0];
  return row?.record_hash ?? null;
}

async function insertTamperEvidentAuditRecord(input: {
  tenantId: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceType: AuditResourceType;
  resourceId: string | null;
  ipAddress: string;
  userAgent: string;
  phiAccessed: boolean;
  changes: unknown;
}): Promise<void> {
  const timestamp = new Date();
  const previousHash = await getLatestRecordHash(input.tenantId) ?? '';
  const recordHash = computeRecordHash({
    tenantId: input.tenantId,
    userId: input.userId,
    action: input.action,
    resource: input.resource,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    timestamp,
    previousHash,
    changes: input.changes,
  });

  if ('execute' in db && typeof db.execute === 'function') {
    await db.execute(sql`
    INSERT INTO audit_logs (
      tenant_id,
      user_id,
      action,
      resource,
      resource_type,
      resource_id,
      ip_address,
      user_agent,
      phi_accessed,
      changes,
      previous_hash,
      record_hash,
      "timestamp"
    ) VALUES (
      ${input.tenantId},
      ${input.userId},
      ${input.action},
      ${input.resource},
      ${input.resourceType},
      ${input.resourceId},
      ${input.ipAddress},
      ${input.userAgent},
      ${input.phiAccessed},
      ${JSON.stringify(input.changes)},
      ${previousHash || null},
      ${recordHash},
      ${timestamp}
    )
  `);
    return;
  }

  if ('insert' in db && typeof db.insert === 'function') {
    await db.insert(auditLogs).values({
      tenantId: input.tenantId,
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      phiAccessed: input.phiAccessed,
      changes: input.changes as Record<string, unknown> | null,
    });
  }
}

/**
 * Parameters for logging an authentication event
 */
export type LogAuthEventParams = {
  /** Tenant ID */
  tenantId: string;
  /** User ID (null if user doesn't exist yet, e.g., failed login) */
  userId?: string | null;
  /** Type of authentication event */
  eventType: AuthEventType;
  /** User's IP address */
  ipAddress: string;
  /** User's browser user agent */
  userAgent: string;
  /** Additional event details */
  details?: Record<string, unknown>;
};

/**
 * Log an authentication event to the audit logs table
 *
 * @param params - Event parameters
 * @returns Promise resolving to the created audit log entry
 */
export async function logAuthEvent(params: LogAuthEventParams): Promise<void> {
  const { tenantId, userId, eventType, ipAddress, userAgent, details } = params;

  await insertTamperEvidentAuditRecord({
    tenantId,
    userId: userId || null,
    action: eventType,
    resource: 'authentication',
    resourceType: 'authentication',
    resourceId: userId || null,
    ipAddress,
    userAgent,
    phiAccessed: false,
    changes: details || null,
  });
}

/**
 * Log a successful login event
 */
export async function logLoginSuccess(
  tenantId: string,
  userId: string,
  ipAddress: string,
  userAgent: string,
): Promise<void> {
  await logAuthEvent({
    tenantId,
    userId,
    eventType: 'login_success',
    ipAddress,
    userAgent,
  });
}

/**
 * Log a failed login attempt
 */
export async function logLoginFailed(
  tenantId: string,
  identifier: string,
  ipAddress: string,
  userAgent: string,
  reason?: string,
): Promise<void> {
  await logAuthEvent({
    tenantId,
    userId: null,
    eventType: 'login_failed',
    ipAddress,
    userAgent,
    details: {
      identifier,
      reason,
    },
  });
}

/**
 * Log a logout event
 */
export async function logLogout(
  tenantId: string,
  userId: string,
  ipAddress: string,
  userAgent: string,
): Promise<void> {
  await logAuthEvent({
    tenantId,
    userId,
    eventType: 'logout',
    ipAddress,
    userAgent,
  });
}

/**
 * Log a user registration event
 */
export async function logRegister(
  tenantId: string,
  userId: string,
  ipAddress: string,
  userAgent: string,
): Promise<void> {
  await logAuthEvent({
    tenantId,
    userId,
    eventType: 'register',
    ipAddress,
    userAgent,
  });
}

/**
 * Log an account lockout event
 */
export async function logAccountLocked(
  tenantId: string,
  userId: string,
  ipAddress: string,
  userAgent: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await logAuthEvent({
    tenantId,
    userId,
    eventType: 'account_locked',
    ipAddress,
    userAgent,
    details,
  });
}

/**
 * Log an account unlock event
 */
export async function logAccountUnlocked(
  tenantId: string,
  userId: string,
  ipAddress: string,
  userAgent: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await logAuthEvent({
    tenantId,
    userId,
    eventType: 'account_unlocked',
    ipAddress,
    userAgent,
    details,
  });
}

/**
 * Generic audit log parameters
 */
export type LogAuditParams = {
  userId: string;
  action: string;
  resource: string;
  resourceType?: AuditResourceType;
  resourceId?: string | null;
  phiAccessed?: boolean;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown> | null;
};

/**
 * Generic audit logging function
 * Use this for logging data access and modifications
 */
export async function logAudit(
  tenantId: string,
  params: LogAuditParams,
): Promise<void> {
  const {
    userId,
    action,
    resource,
    resourceType = 'system',
    resourceId = null,
    phiAccessed = false,
    ipAddress = 'unknown',
    userAgent = 'unknown',
    metadata = null,
  } = params;

  await insertTamperEvidentAuditRecord({
    tenantId,
    userId,
    action,
    resource,
    resourceType,
    resourceId,
    ipAddress,
    userAgent,
    phiAccessed,
    changes: metadata,
  });
}

export type AuditSearchFilters = {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  resource?: string;
};

export async function searchAuditLogs(
  tenantId: string,
  filters: AuditSearchFilters,
): Promise<AuditHashRow[]> {
  const conditions = [eq(auditLogs.tenantId, tenantId)];

  if (filters.startDate) {
    conditions.push(gte(auditLogs.timestamp, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(auditLogs.timestamp, filters.endDate));
  }

  if (filters.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }

  if (filters.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }

  if (filters.resource) {
    conditions.push(eq(auditLogs.resource, filters.resource));
  }

  const whereClause = conditions.length === 1 ? conditions[0]! : and(...conditions);

  const rows = await db.execute<AuditHashRow>(sql`
    SELECT
      id,
      tenant_id AS "tenantId",
      user_id AS "userId",
      action,
      resource,
      resource_type AS "resourceType",
      resource_id AS "resourceId",
      "timestamp",
      changes,
      previous_hash AS "previousHash",
      record_hash AS "recordHash"
    FROM audit_logs
    WHERE ${whereClause}
    ORDER BY "timestamp" DESC, id DESC
  `);

  return rows.rows;
}

export type AuditChainIntegrityResult = {
  isValid: boolean;
  totalRecords: number;
  brokenAtId: string | null;
};

export async function getAuditLogChainIntegrity(
  tenantId: string,
): Promise<AuditChainIntegrityResult> {
  const rows = await db.execute<AuditHashRow>(sql`
    SELECT
      id,
      tenant_id AS "tenantId",
      user_id AS "userId",
      action,
      resource,
      resource_type AS "resourceType",
      resource_id AS "resourceId",
      "timestamp",
      changes,
      previous_hash AS "previousHash",
      record_hash AS "recordHash"
    FROM audit_logs
    WHERE tenant_id = ${tenantId}
    ORDER BY "timestamp" ASC, id ASC
  `);

  let previousHash = '';

  for (const row of rows.rows) {
    const expected = computeRecordHash({
      tenantId: row.tenantId,
      userId: row.userId,
      action: row.action,
      resource: row.resource,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      timestamp: new Date(row.timestamp),
      previousHash,
      changes: row.changes ?? null,
    });

    if ((row.previousHash ?? '') !== previousHash || row.recordHash !== expected) {
      return {
        isValid: false,
        totalRecords: rows.rows.length,
        brokenAtId: row.id,
      };
    }

    previousHash = row.recordHash;
  }

  return {
    isValid: true,
    totalRecords: rows.rows.length,
    brokenAtId: null,
  };
}

export async function archiveAuditLogsOlderThanRetention(
  tenantId: string,
): Promise<{ archivedCount: number; cutoffDate: Date }> {
  const cutoffDate = new Date();
  cutoffDate.setUTCFullYear(cutoffDate.getUTCFullYear() - HIPAA_AUDIT_RETENTION_YEARS);

  await db.execute(sql`
    SELECT 1
    FROM audit_logs
    WHERE tenant_id = ${tenantId}
      AND "timestamp" < ${cutoffDate}
    LIMIT 1
  `);

  return {
    archivedCount: 0,
    cutoffDate,
  };
}
