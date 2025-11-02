'use client';

import type { CreateClientInput, UpdateClientInput } from '@/validations/client.validation';
import { useEffect, useState } from 'react';
import { ClientProfileForm } from '@/components/clients/ClientProfileForm';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

type Location = {
  id: string;
  name: string;
};

type Specialization = {
  id: string;
  name: string;
  category: string;
  description: string | null;
};

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string | null;
  phone: string | null;
  ageGroup: string | null;
  status: string | null;
  primaryLocationId: string | null;
  assignedTherapistId: string | null;
  intakeDate: string | null;
  createdAt: string;
};

/**
 * Admin view for client management
 * Full CRUD access to all clients in the tenant
 */
export function AdminClientsView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClients = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/clients');
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

  const fetchReferenceData = async (): Promise<void> => {
    try {
      const [locationsRes, specializationsRes] = await Promise.all([
        fetch('/api/tenants/locations'),
        fetch('/api/admin/specializations'),
      ]);

      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        setLocations(locationsData);
      }
      if (specializationsRes.ok) {
        const specializationsData = await specializationsRes.json();
        setSpecializations(specializationsData.filter((s: Specialization) => s.description !== null));
      }
    } catch (err) {
      console.error('Failed to fetch reference data:', err);
    }
  };

  const handleCreate = async (data: CreateClientInput): Promise<void> => {
    const response = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create client');
    }

    await fetchClients();
    setIsModalOpen(false);
  };

  const handleUpdate = async (data: UpdateClientInput): Promise<void> => {
    if (!editingClient) {
      return;
    }

    const response = await fetch(`/api/admin/clients/${editingClient.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update client');
    }

    await fetchClients();
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleDelete = async (id: string): Promise<void> => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this client profile?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/clients/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }

      await fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const openCreateModal = (): void => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client): void => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchClients();
    fetchReferenceData();
  }, []);

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const email = client.email?.toLowerCase() || '';
    return fullName.includes(searchLower) || email.includes(searchLower);
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
        <h1 className="text-3xl font-bold">Client Management</h1>
        <Button onClick={openCreateModal}>
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
              placeholder="Search by name or email..."
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
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEditModal(client)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(client.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

      {filteredClients.length === 0 && !isLoading && (
        <div className="py-8 text-center text-gray-500">
          No clients found
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
            <h2 className="mb-6 text-2xl font-bold">
              {editingClient ? 'Edit Client Profile' : 'Create Client Profile'}
            </h2>
            <ClientProfileForm
              locations={locations}
              specializations={specializations}
              onSubmit={editingClient
                ? data => handleUpdate(data as UpdateClientInput)
                : data => handleCreate(data as CreateClientInput)}
              onCancel={() => {
                setIsModalOpen(false);
                setEditingClient(null);
              }}
              initialData={editingClient
                ? {
                    firstName: editingClient.firstName,
                    lastName: editingClient.lastName,
                    dateOfBirth: editingClient.dateOfBirth,
                    email: editingClient.email || undefined,
                    phone: editingClient.phone || undefined,
                    ageGroup: editingClient.ageGroup as any,
                    status: editingClient.status as any,
                    primaryLocationId: editingClient.primaryLocationId || undefined,
                    intakeDate: editingClient.intakeDate || undefined,
                  }
                : undefined}
              isEditing={!!editingClient}
            />
          </div>
        </div>
      )}
    </div>
  );
}
