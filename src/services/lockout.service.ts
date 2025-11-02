/**
 * Account Lockout Service
 *
 * Implements account lockout mechanism to prevent brute force attacks.
 * - Tracks failed login attempts
 * - Locks accounts after threshold exceeded
 * - Auto-unlocks after configured period
 * - Logs all lockout/unlock events for HIPAA compliance
 */

import { and, count, eq, gt, sql } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { failedLoginAttempts, users } from '@/models/user.schema';
import { logAccountLocked, logAccountUnlocked } from './audit.service';

/**
 * Configuration constants
 */
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const ATTEMPT_WINDOW_MINUTES = 15;

/**
 * Record a failed login attempt
 *
 * @param tenantId - Tenant ID
 * @param identifier - User identifier (email, keycloakId, etc)
 * @param identifierType - Type of identifier
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent string
 * @param failureReason - Reason for failure
 * @returns Promise resolving when attempt is recorded
 */
export async function recordFailedLoginAttempt(
  tenantId: string,
  identifier: string,
  identifierType: 'email' | 'keycloak_id' | 'username',
  ipAddress: string,
  userAgent: string,
  failureReason?: string,
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + ATTEMPT_WINDOW_MINUTES);

  await db.insert(failedLoginAttempts).values({
    tenantId,
    identifier,
    identifierType,
    ipAddress,
    userAgent,
    failureReason,
    expiresAt,
  });
}

/**
 * Get count of recent failed login attempts for an identifier
 *
 * @param tenantId - Tenant ID
 * @param identifier - User identifier
 * @returns Promise resolving to count of recent failed attempts
 */
export async function getRecentFailedAttempts(
  tenantId: string,
  identifier: string,
): Promise<number> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - ATTEMPT_WINDOW_MINUTES);

  const result = await db
    .select({ count: count() })
    .from(failedLoginAttempts)
    .where(
      and(
        eq(failedLoginAttempts.tenantId, tenantId),
        eq(failedLoginAttempts.identifier, identifier),
        gt(failedLoginAttempts.attemptedAt, windowStart),
      ),
    );

  return result[0]?.count || 0;
}

/**
 * Check if account should be locked based on failed attempts
 *
 * @param tenantId - Tenant ID
 * @param identifier - User identifier (email)
 * @param ipAddress - IP address for audit logging
 * @param userAgent - User agent for audit logging
 * @returns Promise resolving to true if account was locked
 */
export async function checkAndLockAccount(
  tenantId: string,
  identifier: string,
  ipAddress: string,
  userAgent: string,
): Promise<boolean> {
  const failedAttempts = await getRecentFailedAttempts(tenantId, identifier);

  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    // Find user by email (identifier)
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          eq(users.email, identifier),
        ),
      )
      .limit(1);

    if (user && !user.isLocked) {
      // Lock the account
      await db
        .update(users)
        .set({ isLocked: true, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      // Log the lockout event
      await logAccountLocked(tenantId, user.id, ipAddress, userAgent, {
        failedAttempts,
        lockoutDuration: LOCKOUT_DURATION_MINUTES,
      });

      return true;
    }
  }

  return false;
}

/**
 * Check if an account is locked
 *
 * @param tenantId - Tenant ID
 * @param identifier - User identifier (email or keycloakId)
 * @param identifierType - Type of identifier
 * @returns Promise resolving to true if account is locked
 */
export async function isAccountLocked(
  tenantId: string,
  identifier: string,
  identifierType: 'email' | 'keycloak_id',
): Promise<boolean> {
  const whereClause = identifierType === 'email'
    ? and(
        eq(users.tenantId, tenantId),
        eq(users.email, identifier),
      )
    : and(
        eq(users.tenantId, tenantId),
        eq(users.keycloakId, identifier),
      );

  const [user] = await db
    .select()
    .from(users)
    .where(whereClause)
    .limit(1);

  return user?.isLocked || false;
}

/**
 * Unlock an account manually or automatically
 *
 * @param tenantId - Tenant ID
 * @param userId - User ID
 * @param ipAddress - IP address for audit logging
 * @param userAgent - User agent for audit logging
 * @param automatic - Whether unlock is automatic or manual
 * @returns Promise resolving when account is unlocked
 */
export async function unlockAccount(
  tenantId: string,
  userId: string,
  ipAddress: string,
  userAgent: string,
  automatic = false,
): Promise<void> {
  // Unlock the account
  await db
    .update(users)
    .set({ isLocked: false, updatedAt: new Date() })
    .where(
      and(
        eq(users.id, userId),
        eq(users.tenantId, tenantId),
      ),
    );

  // Clear failed login attempts for this user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user) {
    await db
      .delete(failedLoginAttempts)
      .where(
        and(
          eq(failedLoginAttempts.tenantId, tenantId),
          eq(failedLoginAttempts.identifier, user.email),
        ),
      );

    // Log the unlock event
    await logAccountUnlocked(tenantId, userId, ipAddress, userAgent, {
      automatic,
    });
  }
}

/**
 * Auto-unlock accounts that have been locked for the configured duration
 *
 * This should be called periodically (e.g., via cron job or scheduled task)
 *
 * @returns Promise resolving to count of accounts unlocked
 */
export async function autoUnlockExpiredAccounts(): Promise<number> {
  const unlockTime = new Date();
  unlockTime.setMinutes(unlockTime.getMinutes() - LOCKOUT_DURATION_MINUTES);

  // Find all locked users whose oldest failed attempt is beyond the lockout duration
  const lockedUsers = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      email: users.email,
      oldestAttempt: sql<Date>`MIN(${failedLoginAttempts.attemptedAt})`,
    })
    .from(users)
    .innerJoin(
      failedLoginAttempts,
      and(
        eq(users.email, failedLoginAttempts.identifier),
        eq(users.tenantId, failedLoginAttempts.tenantId),
      ),
    )
    .where(eq(users.isLocked, true))
    .groupBy(users.id, users.tenantId, users.email)
    .having(sql`MIN(${failedLoginAttempts.attemptedAt}) < ${unlockTime}`);

  let unlockedCount = 0;

  for (const user of lockedUsers) {
    await unlockAccount(
      user.tenantId,
      user.id,
      'system',
      'auto-unlock-job',
      true,
    );
    unlockedCount++;
  }

  return unlockedCount;
}

/**
 * Clear failed login attempts for a user (e.g., after successful login)
 *
 * @param tenantId - Tenant ID
 * @param identifier - User identifier (email)
 * @returns Promise resolving when attempts are cleared
 */
export async function clearFailedAttempts(
  tenantId: string,
  identifier: string,
): Promise<void> {
  await db
    .delete(failedLoginAttempts)
    .where(
      and(
        eq(failedLoginAttempts.tenantId, tenantId),
        eq(failedLoginAttempts.identifier, identifier),
      ),
    );
}

/**
 * Cleanup expired failed login attempts
 *
 * This should be called periodically to remove old records
 *
 * @returns Promise resolving to count of records deleted
 */
export async function cleanupExpiredAttempts(): Promise<number> {
  const now = new Date();

  const result = await db
    .delete(failedLoginAttempts)
    .where(sql`${failedLoginAttempts.expiresAt} < ${now}`)
    .returning({ id: failedLoginAttempts.id });

  return result.length;
}
