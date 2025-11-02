/**
 * Audit Service
 *
 * Handles logging of authentication events and sensitive operations
 * for HIPAA compliance and security monitoring.
 */

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
  details?: Record<string, any>;
};

/**
 * Log an authentication event to the audit logs table
 *
 * @param params - Event parameters
 * @returns Promise resolving to the created audit log entry
 */
export async function logAuthEvent(params: LogAuthEventParams): Promise<void> {
  const { tenantId, userId, eventType, ipAddress, userAgent, details } = params;

  await db.insert(auditLogs).values({
    tenantId,
    userId: userId || null,
    action: eventType,
    resource: 'authentication',
    resourceId: userId || null,
    ipAddress,
    userAgent,
    phiAccessed: false, // Auth events don't access PHI
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
  details?: Record<string, any>,
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
  details?: Record<string, any>,
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
  resourceId?: string | null;
  phiAccessed?: boolean;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any> | null;
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
    resourceId = null,
    phiAccessed = false,
    ipAddress = 'unknown',
    userAgent = 'unknown',
    metadata = null,
  } = params;

  await db.insert(auditLogs).values({
    tenantId,
    userId,
    action,
    resource,
    resourceId,
    ipAddress,
    userAgent,
    phiAccessed,
    changes: metadata,
  });
}
