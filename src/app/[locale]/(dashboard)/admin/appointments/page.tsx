import { getAuthContext } from '@/lib/auth-helpers';
import { getAppointments } from '@/services/appointment';

export default async function AdminAppointmentsPage(props: { searchParams: Promise<{ status?: string }> }) {
  const { tenantId, userId, hasPermission, isAuthenticated } = await getAuthContext();
  if (!isAuthenticated || !tenantId || !userId || !hasPermission('appointments', 'read')) {
    return <div className="rounded-lg bg-white p-6 text-sm text-gray-700">You are not authorized to view appointments.</div>;
  }

  const { status } = await props.searchParams;
  const appointments = await getAppointments(tenantId, userId, status ? { status: status as never } : undefined);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
      <ul className="space-y-2 rounded-lg bg-white p-4 shadow-sm">
        {appointments.map(appointment => (
          <li key={appointment.id} className="rounded border border-gray-100 p-2 text-sm text-gray-700">
            {appointment.appointmentDate}
            {' '}
            {appointment.startTime}
            {' '}
            ({appointment.status})
          </li>
        ))}
        {appointments.length === 0 ? <li className="text-sm text-gray-500">No appointments found.</li> : null}
      </ul>
    </div>
  );
}
