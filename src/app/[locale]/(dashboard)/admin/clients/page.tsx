import { getAuthContext } from '@/lib/auth-helpers';
import { listClients } from '@/services/client.service';

export default async function AdminClientsPage(props: { searchParams: Promise<{ search?: string }> }) {
  const { tenantId, userId, hasPermission, isAuthenticated } = await getAuthContext();
  if (!isAuthenticated || !tenantId || !userId || !hasPermission('clients', 'read')) {
    return <div className="rounded-lg bg-white p-6 text-sm text-gray-700">You are not authorized to view clients.</div>;
  }

  const { search } = await props.searchParams;
  const clients = await listClients(tenantId, userId, search ? { search } : {});

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
      <ul className="space-y-2 rounded-lg bg-white p-4 shadow-sm">
        {clients.map(client => (
          <li key={client.id} className="rounded border border-gray-100 p-2 text-sm text-gray-700">{client.id}</li>
        ))}
        {clients.length === 0 ? <li className="text-sm text-gray-500">No clients found.</li> : null}
      </ul>
    </div>
  );
}
