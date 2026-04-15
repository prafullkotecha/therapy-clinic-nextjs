import type { UserRole } from '@/lib/rbac';
import { formatInTimeZone } from 'date-fns-tz';
import { and, desc, eq, sql } from 'drizzle-orm';
import { UserRoles } from '@/lib/rbac';
import { withTenantContext } from '@/lib/tenant-db';
import { db } from '@/libs/DB';
import { appointments } from '@/models/appointment.schema';
import { clients } from '@/models/client.schema';
import { tenants } from '@/models/tenant.schema';
import { therapists } from '@/models/therapist.schema';
import { auditLogs } from '@/models/user.schema';

export type DashboardStats = {
  totalClients: number;
  todaysAppointments: number;
  assignedClients: number;
  recentActivity: {
    id: string;
    action: string;
    resource: string;
    timestamp: Date;
  }[];
};

const CACHE_TTL_MS = 60_000;
const RECENT_ACTIVITY_LIMIT = 5;
const DEFAULT_TENANT_TIMEZONE = 'America/New_York';
const dashboardStatsCache = new Map<string, { expiresAt: number; value: DashboardStats }>();
// NOTE: This in-memory cache is process-local and best-effort.
// In multi-instance deployments, each instance has its own cache.
// For globally consistent caching across instances, use Redis.
// Cache invalidation currently relies on TTL expiry only.

export function getTodayDateString(timezone: string, date: Date = new Date()): string {
  try {
    return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  } catch {
    console.warn(`Invalid tenant timezone "${timezone}", falling back to ${DEFAULT_TENANT_TIMEZONE}.`);
    return formatInTimeZone(date, DEFAULT_TENANT_TIMEZONE, 'yyyy-MM-dd');
  }
}

export async function getDashboardStats(
  tenantId: string,
  userId: string,
  userRole: UserRole,
): Promise<DashboardStats> {
  const cacheKey = `${tenantId}:${userId}:${userRole}`;
  const now = Date.now();
  const cached = dashboardStatsCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }
  if (cached && cached.expiresAt <= now) {
    dashboardStatsCache.delete(cacheKey);
  }

  const stats = await withTenantContext(tenantId, async () => {
    const [tenant] = await db
      .select({ timezone: tenants.timezone })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    const timezone = tenant?.timezone || DEFAULT_TENANT_TIMEZONE;
    const today = getTodayDateString(timezone);

    const [clientCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clients)
      .where(eq(clients.tenantId, tenantId));

    const [todaysAppointmentsRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(appointments.appointmentDate, today),
        ),
      );

    const recentActivityWhere = userRole === UserRoles.THERAPIST
      ? and(eq(auditLogs.tenantId, tenantId), eq(auditLogs.userId, userId))
      : eq(auditLogs.tenantId, tenantId);

    const recentActivity = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resource: auditLogs.resource,
        timestamp: auditLogs.timestamp,
      })
      .from(auditLogs)
      .where(recentActivityWhere)
      .orderBy(desc(auditLogs.timestamp))
      .limit(RECENT_ACTIVITY_LIMIT);

    let assignedClients = 0;

    if (userRole === UserRoles.THERAPIST) {
      const [therapist] = await db
        .select({ id: therapists.id })
        .from(therapists)
        .where(
          and(
            eq(therapists.tenantId, tenantId),
            eq(therapists.userId, userId),
          ),
        )
        .limit(1);

      if (therapist) {
        const [assignedCountRow] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(clients)
          .where(
            and(
              eq(clients.tenantId, tenantId),
              eq(clients.assignedTherapistId, therapist.id),
            ),
          );

        assignedClients = assignedCountRow?.count ?? 0;
      }
    } else {
      const [assignedCountRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(clients)
        .where(
          and(
            eq(clients.tenantId, tenantId),
            sql`${clients.assignedTherapistId} IS NOT NULL`,
          ),
        );

      assignedClients = assignedCountRow?.count ?? 0;
    }

    return {
      totalClients: clientCountRow?.count ?? 0,
      todaysAppointments: todaysAppointmentsRow?.count ?? 0,
      assignedClients,
      recentActivity,
    };
  });

  dashboardStatsCache.set(cacheKey, {
    expiresAt: now + CACHE_TTL_MS,
    value: stats,
  });

  return stats;
}
