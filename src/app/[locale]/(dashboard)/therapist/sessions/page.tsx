import Link from 'next/link';
import { getAuthContext } from '@/lib/auth-helpers';
import { getSessionNotes } from '@/services/session.service';

export default async function TherapistSessionsPage() {
  const { tenantId, userId, hasPermission, isAuthenticated } = await getAuthContext();
  if (!isAuthenticated || !tenantId || !userId || !hasPermission('appointments', 'read')) {
    return <div className="rounded-lg bg-white p-6 text-sm text-gray-700">You are not authorized to view session notes.</div>;
  }

  const notes = await getSessionNotes(tenantId, userId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Session Notes</h1>
      <ul className="space-y-2 rounded-lg bg-white p-4 shadow-sm">
        {notes.map(note => (
          <li key={note.id} className="rounded border border-gray-100 p-2 text-sm text-gray-700">
            <Link href={`/dashboard/therapist/sessions/${note.id}`} className="text-primary-700 hover:underline">
              {note.sessionDate}
              {' '}
              •
              {' '}
              {note.sessionType}
            </Link>
          </li>
        ))}
        {notes.length === 0 ? <li className="text-sm text-gray-500">No session notes found.</li> : null}
      </ul>
    </div>
  );
}
