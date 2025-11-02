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
  ageGroup: string | null;
  status: string | null;
  primaryLocationId: string | null;
  assignedTherapistId: string | null;
  intakeDate: string | null;
};

/**
 * Receptionist view for client management
 * Read/update access to all clients, focus on contact info and scheduling
 */
export function ReceptionistClientsView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClients = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch all clients with receptionist-relevant fields
      const response = await fetch('/api/admin/clients?role=receptionist');
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
    const phone = client.phone || '';
    return fullName.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);
  });

  const getAgeGroupLabel = (ageGroup: string | null): string => {
    if (!ageGroup) {
      return 'N/A';
    }
    const labels: Record<string, string> = {
      early_childhood: 'Early Childhood',
      school_age: 'School Age',
      adolescent: 'Adolescent',
      adult: 'Adult',
    };
    return labels[ageGroup] || ageGroup;
  };

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Directory</h1>
          <p className="mt-2 text-gray-600">Manage client contact information and scheduling</p>
        </div>
        <Button onClick={() => {
          // TODO: Implement add client functionality
          // eslint-disable-next-line no-alert
          alert('Add client functionality coming soon');
        }}
        >
          Add Client
        </Button>
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
              placeholder="Search by name, email, or phone..."
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
                      <p>
                        <span className="font-medium">Age Group:</span>
                        {' '}
                        {getAgeGroupLabel(client.ageGroup)}
                      </p>
                      {client.phone && (
                        <p>
                          <span className="font-medium">Phone:</span>
                          {' '}
                          {client.phone}
                        </p>
                      )}
                      {client.intakeDate && (
                        <p>
                          <span className="font-medium">Intake Date:</span>
                          {' '}
                          {new Date(client.intakeDate).toLocaleDateString()}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Therapist:</span>
                        {' '}
                        {client.assignedTherapistId ? 'Assigned' : 'Not yet assigned'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          // TODO: Implement edit contact info
                          // eslint-disable-next-line no-alert
                          alert('Edit contact functionality coming soon');
                        }}
                      >
                        Edit Contact
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          // TODO: Implement schedule appointment
                          // eslint-disable-next-line no-alert
                          alert('Schedule appointment functionality coming soon');
                        }}
                      >
                        Schedule
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
