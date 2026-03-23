import { and, eq, sql } from 'drizzle-orm';
import { withTenantContext } from '@/lib/tenant-db';
import type { UserRole } from '@/lib/rbac';
import { UserRoles } from '@/lib/rbac';
import { db } from '@/libs/DB';
import { appointments } from '@/models/appointment.schema';
import { clients } from '@/models/client.schema';
import { therapists } from '@/models/therapist.schema';

export type DashboardStats = {
  totalClients: number;
  todaysAppointments: number;
  assignedClients: number;
};

export function getTodayDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]!;
}

export async function getDashboardStats(
  tenantId: string,
  userId: string,
  userRole: UserRole,
): Promise<DashboardStats> {
  return withTenantContext(tenantId, async () => {
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
    };
  });
}
