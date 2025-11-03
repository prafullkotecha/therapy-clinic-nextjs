'use client';

import type { CreateTherapistInput, UpdateTherapistInput } from '@/validations/therapist.validation';
import { useEffect, useState } from 'react';
import { TherapistProfileForm } from '@/components/therapists/TherapistProfileForm';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

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

type Therapist = {
  id: string;
  userId: string;
  primaryLocationId: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  licenseExpirationDate: string | null;
  credentials: string | null;
  bio: string | null;
  photoUrl: string | null;
  maxCaseload: number | null;
  currentCaseload: number | null;
  isAcceptingNewClients: boolean | null;
  languages: unknown;
  ageGroupExpertise: unknown;
  communicationExpertise: unknown;
  availability: unknown;
  user?: User;
  specializations?: Array<{
    id: string;
    specializationId: string;
    proficiencyLevel: string;
    yearsExperience: number | null;
    specialization: Specialization;
  }>;
};

/**
 * Admin view for therapist management
 * Full CRUD access to all therapists in the tenant
 */
export function AdminTherapistsView() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTherapists = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/therapists');
      if (!response.ok) {
        throw new Error('Failed to fetch therapists');
      }
      const data = await response.json();
      setTherapists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReferenceData = async (): Promise<void> => {
    try {
      const [usersRes, locationsRes, specializationsRes] = await Promise.all([
        fetch('/api/admin/users'), // Assuming this endpoint exists
        fetch('/api/tenants/locations'),
        fetch('/api/admin/specializations'),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
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

  const handleCreate = async (data: CreateTherapistInput): Promise<void> => {
    const response = await fetch('/api/admin/therapists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create therapist');
    }

    await fetchTherapists();
    setIsModalOpen(false);
  };

  const handleUpdate = async (data: UpdateTherapistInput): Promise<void> => {
    if (!editingTherapist) {
      return;
    }

    const response = await fetch(`/api/admin/therapists/${editingTherapist.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update therapist');
    }

    await fetchTherapists();
    setIsModalOpen(false);
    setEditingTherapist(null);
  };

  const handleDelete = async (id: string): Promise<void> => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this therapist profile?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/therapists/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete therapist');
      }

      await fetchTherapists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const openCreateModal = (): void => {
    setEditingTherapist(null);
    setIsModalOpen(true);
  };

  const openEditModal = (therapist: Therapist): void => {
    setEditingTherapist(therapist);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchTherapists();
    fetchReferenceData();
  }, []);

  const filteredTherapists = therapists.filter((therapist) => {
    const searchLower = searchTerm.toLowerCase();
    const userName = `${therapist.user?.firstName} ${therapist.user?.lastName}`.toLowerCase();
    const email = therapist.user?.email.toLowerCase() || '';
    return userName.includes(searchLower) || email.includes(searchLower);
  });

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Therapist Management</h1>
        <Button onClick={openCreateModal}>
          Add Therapist
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
              {filteredTherapists.map(therapist => (
                <Card key={therapist.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {therapist.user?.firstName}
                          {' '}
                          {therapist.user?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{therapist.user?.email}</p>
                        {therapist.credentials && (
                          <span className="mt-1 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                            {therapist.credentials}
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs ${
                          therapist.isAcceptingNewClients
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {therapist.isAcceptingNewClients ? 'Accepting' : 'Full'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="mb-3 space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Caseload:</span>
                        {' '}
                        {therapist.currentCaseload}
                        /
                        {therapist.maxCaseload}
                      </p>
                      {therapist.licenseNumber && (
                        <p>
                          <span className="font-medium">License:</span>
                          {' '}
                          {therapist.licenseNumber}
                          {' '}
                          (
                          {therapist.licenseState}
                          )
                        </p>
                      )}
                      {therapist.specializations && therapist.specializations.length > 0 && (
                        <div>
                          <span className="font-medium">Specializations:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {therapist.specializations.map(spec => (
                              <span
                                key={spec.id}
                                className="inline-block rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-800"
                              >
                                {spec.specialization.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {therapist.bio && (
                      <p className="mb-3 line-clamp-3 text-sm text-gray-600">
                        {therapist.bio}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEditModal(therapist)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(therapist.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

      {filteredTherapists.length === 0 && !isLoading && (
        <div className="py-8 text-center text-gray-500">
          No therapists found
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
            <h2 className="mb-6 text-2xl font-bold">
              {editingTherapist ? 'Edit Therapist Profile' : 'Create Therapist Profile'}
            </h2>
            <TherapistProfileForm
              users={users}
              locations={locations}
              specializations={specializations}
              onSubmit={editingTherapist
                ? data => handleUpdate(data as UpdateTherapistInput)
                : data => handleCreate(data as CreateTherapistInput)}
              onCancel={() => {
                setIsModalOpen(false);
                setEditingTherapist(null);
              }}
              initialData={editingTherapist
                ? {
                    userId: editingTherapist.userId,
                    primaryLocationId: editingTherapist.primaryLocationId || undefined,
                    licenseNumber: editingTherapist.licenseNumber || undefined,
                    licenseState: editingTherapist.licenseState || undefined,
                    licenseExpirationDate: editingTherapist.licenseExpirationDate || undefined,
                    credentials: editingTherapist.credentials || undefined,
                    bio: editingTherapist.bio || undefined,
                    photoUrl: editingTherapist.photoUrl || undefined,
                    maxCaseload: editingTherapist.maxCaseload || 25,
                    isAcceptingNewClients: editingTherapist.isAcceptingNewClients ?? true,
                    languages: (editingTherapist.languages as string[]) || ['English'],
                    ageGroupExpertise: (editingTherapist.ageGroupExpertise as Array<'early_childhood' | 'school_age' | 'adolescent' | 'adult'>) || [],
                    communicationExpertise: (editingTherapist.communicationExpertise as Array<'non-verbal' | 'aac' | 'sign_language' | 'speech_integration'>) || [],
                    availability: editingTherapist.availability && typeof editingTherapist.availability === 'object'
                      ? editingTherapist.availability
                      : {
                          monday: [],
                          tuesday: [],
                          wednesday: [],
                          thursday: [],
                          friday: [],
                          saturday: [],
                          sunday: [],
                        },
                    specializations: editingTherapist.specializations?.map(s => ({
                      specializationId: s.specializationId,
                      proficiencyLevel: s.proficiencyLevel as 'expert' | 'proficient' | 'familiar',
                      yearsExperience: s.yearsExperience,
                    })) || [],
                  } as UpdateTherapistInput
                : undefined}
              isEditing={!!editingTherapist}
            />
          </div>
        </div>
      )}
    </div>
  );
}
