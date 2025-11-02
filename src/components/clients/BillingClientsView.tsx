'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  insuranceGroupNumber: string | null;
};

/**
 * Billing view for client management
 * Read access to all clients with insurance focus, can update insurance details
 */
export function BillingClientsView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClients = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch all clients with billing-relevant fields
      const response = await fetch('/api/admin/clients?role=billing');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const email = client.email?.toLowerCase() || '';
    const insurance = client.insuranceProvider?.toLowerCase() || '';
    return fullName.includes(searchLower) || email.includes(searchLower) || insurance.includes(searchLower);
  });

  const getStatusColor = (status: string | null): string => {
    const colors: Record<string, string> = {
      intake: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      discharged: 'bg-red-100 text-red-800',
    };
    return colors[status || 'intake'] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Client Billing</h1>
        <p className="mt-2 text-gray-600">Manage client insurance and billing information</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardBody>
          <div>
            <label htmlFor="search" className="mb-2 block text-sm font-medium">
              Search
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by name, email, or insurance provider..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
        </CardBody>
      </Card>

      {isLoading
        ? (
            <div className="py-8 text-center">Loading...</div>
          )
        : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map(client => (
                <Card key={client.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {client.firstName}
                          {' '}
                          {client.lastName}
                        </h3>
                        {client.email && (
                          <p className="text-sm text-gray-600">{client.email}</p>
                        )}
                      </div>
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs ${
                          getStatusColor(client.status)
                        }`}
                      >
                        {client.status || 'intake'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="mb-3 space-y-1 text-sm">
                      {client.phone && (
                        <p>
                          <span className="font-medium">Phone:</span>
                          {' '}
                          {client.phone}
                        </p>
                      )}
                      <div className="mt-2 border-t pt-2">
                        <p className="font-medium text-blue-600">Insurance Information</p>
                        {client.insuranceProvider
                          ? (
                              <>
                                <p>
                                  <span className="font-medium">Provider:</span>
                                  {' '}
                                  {client.insuranceProvider}
                                </p>
                                {client.insurancePolicyNumber && (
                                  <p>
                                    <span className="font-medium">Policy #:</span>
                                    {' '}
                                    {client.insurancePolicyNumber}
                                  </p>
                                )}
                                {client.insuranceGroupNumber && (
                                  <p>
                                    <span className="font-medium">Group #:</span>
                                    {' '}
                                    {client.insuranceGroupNumber}
                                  </p>
                                )}
                              </>
                            )
                          : (
                              <p className="text-gray-500">No insurance on file</p>
                            )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          // TODO: Implement edit insurance modal
                          // eslint-disable-next-line no-alert
                          alert('Edit insurance functionality coming soon');
                        }}
                      >
                        Edit Insurance
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

      {filteredClients.length === 0 && !isLoading && (
        <div className="py-8 text-center text-gray-500">
          {searchTerm ? 'No clients found matching your search' : 'No clients found'}
        </div>
      )}
    </div>
  );
}
