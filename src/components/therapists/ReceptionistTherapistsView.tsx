'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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
  credentials: string | null;
  bio: string | null;
  maxCaseload: number | null;
  currentCaseload: number | null;
  isAcceptingNewClients: boolean | null;
  languages: unknown;
  ageGroupExpertise: unknown;
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
 * Receptionist/Therapist view for therapist directory
 * Read-only access to view therapist profiles and availability for scheduling/referrals
 */
export function ReceptionistTherapistsView() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    fetchTherapists();
  }, []);

  const filteredTherapists = therapists.filter((therapist) => {
    const searchLower = searchTerm.toLowerCase();
    const userName = `${therapist.user?.firstName} ${therapist.user?.lastName}`.toLowerCase();
    const email = therapist.user?.email.toLowerCase() || '';
    return userName.includes(searchLower) || email.includes(searchLower);
  });

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Therapist Directory</h1>
        <p className="mt-2 text-gray-600">View therapist profiles and availability</p>
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
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

      {filteredTherapists.length === 0 && !isLoading && (
        <div className="py-8 text-center text-gray-500">
          {searchTerm ? 'No therapists found matching your search' : 'No therapists found'}
        </div>
      )}
    </div>
  );
}
