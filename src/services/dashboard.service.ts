import { and, desc, eq, sql } from 'drizzle-orm';
import { withTenantContext } from '@/lib/tenant-db';
import type { UserRole } from '@/lib/rbac';
import { UserRoles } from '@/lib/rbac';
import { db } from '@/libs/DB';
import { appointments } from '@/models/appointment.schema';
import { clients } from '@/models/client.schema';
import { auditLogs } from '@/models/user.schema';
import { therapists } from '@/models/therapist.schema';

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
const dashboardStatsCache = new Map<string, { expiresAt: number; value: DashboardStats }>();
// NOTE: This in-memory cache is process-local and best-effort.
// In multi-instance deployments, each instance has its own cache.
// For globally consistent caching across instances, use Redis.
// Cache invalidation currently relies on TTL expiry only.

export function getTodayDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]!;
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

  const stats = await withTenantContext(tenantId, async () => {
    const today = getTodayDateString();

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
