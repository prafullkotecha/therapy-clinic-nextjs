import { getAuthContext } from '@/lib/auth-helpers';
import { getSessionNote } from '@/services/session.service';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TherapistSessionDetailPage({ params }: PageProps) {
  const { tenantId, hasPermission, isAuthenticated } = await getAuthContext();
  if (!isAuthenticated || !tenantId || !hasPermission('appointments', 'read')) {
    return <div className="rounded-lg bg-white p-6 text-sm text-gray-700">You are not authorized to view this note.</div>;
  }

  const { id } = await params;
  const note = await getSessionNote(tenantId, id);

  if (!note) {
    return <div className="rounded-lg bg-white p-6 text-sm text-gray-700">Session note not found.</div>;
  }

  return (
    <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">Session Note</h1>
      <div className="text-sm text-gray-700">Date: {note.sessionDate}</div>
      <div className="text-sm text-gray-700">Type: {note.sessionType}</div>
      <div className="text-sm text-gray-700">Attendance: {note.clientAttendance}</div>
      <div className="text-sm text-gray-700">Summary: {note.sessionSummary || '—'}</div>
      <div className="text-sm text-gray-700">Clinical Notes: {note.clinicalNotes || '—'}</div>
    </div>
  );
}
