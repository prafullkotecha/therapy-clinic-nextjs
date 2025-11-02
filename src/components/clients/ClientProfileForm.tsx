'use client';

import type { CreateClientInput, UpdateClientInput } from '@/validations/client.validation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type Location = {
  id: string;
  name: string;
};

type Specialization = {
  id: string;
  name: string;
  category: string;
};

type ClientFormProps = {
  locations: Location[];
  specializations: Specialization[];
  onSubmit: (data: CreateClientInput | UpdateClientInput) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateClientInput | UpdateClientInput>;
  isEditing?: boolean;
};

export function ClientProfileForm({
  locations,
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}: ClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic Info
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.dateOfBirth || '');
  const [ssn, setSsn] = useState(initialData?.ssn || '');

  // Contact
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState(initialData?.address || '');

  // Demographics
  const [ageGroup, setAgeGroup] = useState<'early_childhood' | 'school_age' | 'adolescent' | 'adult' | ''>(
    (initialData?.ageGroup as 'early_childhood' | 'school_age' | 'adolescent' | 'adult') || '',
  );
  const [preferredLanguage, setPreferredLanguage] = useState(initialData?.preferredLanguage || 'English');
  const [primaryLocationId, setPrimaryLocationId] = useState(initialData?.primaryLocationId || '');

  // Guardian Info (for minors)
  const [guardianName, setGuardianName] = useState(initialData?.guardianName || '');
  const [guardianRelationship, setGuardianRelationship] = useState(initialData?.guardianRelationship || '');
  const [guardianPhone, setGuardianPhone] = useState(initialData?.guardianPhone || '');
  const [guardianEmail, setGuardianEmail] = useState(initialData?.guardianEmail || '');

  // Emergency Contact
  const [emergencyContactName, setEmergencyContactName] = useState(initialData?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(initialData?.emergencyContactPhone || '');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState(initialData?.emergencyContactRelationship || '');

  // Insurance
  const [insuranceProvider, setInsuranceProvider] = useState(initialData?.insuranceProvider || '');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(initialData?.insurancePolicyNumber || '');
  const [insuranceGroupNumber, setInsuranceGroupNumber] = useState(initialData?.insuranceGroupNumber || '');

  // Status
  const [status, setStatus] = useState<'intake' | 'active' | 'inactive' | 'discharged'>(
    (initialData?.status as 'intake' | 'active' | 'inactive' | 'discharged') || 'intake',
  );
  const [intakeDate] = useState(initialData?.intakeDate || new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData: CreateClientInput | UpdateClientInput = {
        firstName,
        lastName,
        dateOfBirth,
        ssn: ssn || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        ageGroup: ageGroup || null,
        preferredLanguage,
        primaryLocationId: primaryLocationId || null,
        guardianName: guardianName || null,
        guardianRelationship: guardianRelationship || null,
        guardianPhone: guardianPhone || null,
        guardianEmail: guardianEmail || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        emergencyContactRelationship: emergencyContactRelationship || null,
        insuranceProvider: insuranceProvider || null,
        insurancePolicyNumber: insurancePolicyNumber || null,
        insuranceGroupNumber: insuranceGroupNumber || null,
        status,
        intakeDate: intakeDate || null,
      };

      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold">Basic Information</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
              First Name
              {' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium">
              Last Name
              {' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div>
            <label htmlFor="dateOfBirth" className="mb-1 block text-sm font-medium">
              Date of Birth
              {' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="dateOfBirth"
              type="date"
              required
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div>
            <label htmlFor="ssn" className="mb-1 block text-sm font-medium">
              SSN (XXX-XX-XXXX)
            </label>
            <input
              id="ssn"
              type="text"
              placeholder="123-45-6789"
              value={ssn}
              onChange={e => setSsn(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div>
            <label htmlFor="ageGroup" className="mb-1 block text-sm font-medium">
              Age Group
            </label>
            <select
              id="ageGroup"
              value={ageGroup}
              onChange={e => setAgeGroup(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="">Select age group</option>
              <option value="early_childhood">Early Childhood (0-5)</option>
              <option value="school_age">School Age (6-12)</option>
              <option value="adolescent">Adolescent (13-17)</option>
              <option value="adult">Adult (18+)</option>
            </select>
          </div>
          <div>
            <label htmlFor="preferredLanguage" className="mb-1 block text-sm font-medium">
              Preferred Language
            </label>
            <input
              id="preferredLanguage"
              type="text"
              value={preferredLanguage}
              onChange={e => setPreferredLanguage(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div>
            <label htmlFor="primaryLocationId" className="mb-1 block text-sm font-medium">
              Primary Location
            </label>
            <select
              id="primaryLocationId"
              value={primaryLocationId}
              onChange={e => setPrimaryLocationId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="">Select location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="intake">Intake</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold">Contact Information</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="address" className="mb-1 block text-sm font-medium">
              Address
            </label>
            <textarea
              id="address"
              rows={2}
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
        </div>
      </div>

      {/* Guardian Information (for minors) */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold">Guardian Information (for minors)</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="guardianName" className="mb-1 block text-sm font-medium">
              Guardian Name
            </label>
            <input
              id="guardianName"
              type="text"
              value={guardianName}
              onChange={e => setGuardianName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div>
            <label htmlFor="guardianRelationship" className="mb-1 block text-sm font-medium">
              Relationship
            </label>
            <input
              id="guardianRelationship"
              type="text"
              value={guardianRelationship}
              onChange={e => setGuardianRelationship(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div>
            <label htmlFor="guardianPhone" className="mb-1 block text-sm font-medium">
              Guardian Phone
            </label>
            <input
              id="guardianPhone"
              type="tel"
              value={guardianPhone}
              onChange={e => setGuardianPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div>
            <label htmlFor="guardianEmail" className="mb-1 block text-sm font-medium">
              Guardian Email
            </label>
            <input
              id="guardianEmail"
              type="email"
              value={guardianEmail}
              onChange={e => setGuardianEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold">Emergency Contact</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="emergencyContactName" className="mb-1 block text-sm font-medium">
              Name
            </label>
            <input
              id="emergencyContactName"
              type="text"
              value={emergencyContactName}
              onChange={e => setEmergencyContactName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div>
            <label htmlFor="emergencyContactPhone" className="mb-1 block text-sm font-medium">
              Phone
            </label>
            <input
              id="emergencyContactPhone"
              type="tel"
              value={emergencyContactPhone}
              onChange={e => setEmergencyContactPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div>
            <label htmlFor="emergencyContactRelationship" className="mb-1 block text-sm font-medium">
              Relationship
            </label>
            <input
              id="emergencyContactRelationship"
              type="text"
              value={emergencyContactRelationship}
              onChange={e => setEmergencyContactRelationship(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
        </div>
      </div>

      {/* Insurance Information */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold">Insurance Information</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="insuranceProvider" className="mb-1 block text-sm font-medium">
              Insurance Provider
            </label>
            <input
              id="insuranceProvider"
              type="text"
              value={insuranceProvider}
              onChange={e => setInsuranceProvider(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div>
            <label htmlFor="insurancePolicyNumber" className="mb-1 block text-sm font-medium">
              Policy Number
            </label>
            <input
              id="insurancePolicyNumber"
              type="text"
              value={insurancePolicyNumber}
              onChange={e => setInsurancePolicyNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div>
            <label htmlFor="insuranceGroupNumber" className="mb-1 block text-sm font-medium">
              Group Number
            </label>
            <input
              id="insuranceGroupNumber"
              type="text"
              value={insuranceGroupNumber}
              onChange={e => setInsuranceGroupNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Client' : 'Create Client'}
        </Button>
      </div>
    </form>
  );
}
