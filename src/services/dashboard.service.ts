import { and, eq, sql } from 'drizzle-orm';
import { withTenantContext } from '@/lib/tenant-db';
import type { UserRole } from '@/lib/rbac';
import { UserRoles } from '@/lib/rbac';
import { db } from '@/libs/DB';
import { appointments } from '@/models/appointment.schema';
import { clients } from '@/models/client.schema';
import { therapists } from '@/models/therapist.schema';
import { users } from '@/models/user.schema';

export type DashboardStats = {
  totalClients: number;
  todaysAppointments: number;
  assignedClients: number;
};

export async function getDashboardStats(
  tenantId: string,
  userId: string,
  userRole: UserRole,
): Promise<DashboardStats> {
  return withTenantContext(tenantId, async () => {
    const today = new Date().toISOString().split('T')[0]!;

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
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            eq(users.isActive, true),
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
