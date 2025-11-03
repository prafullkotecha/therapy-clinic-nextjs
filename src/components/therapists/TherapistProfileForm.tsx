'use client';

import type { CreateTherapistInput, UpdateTherapistInput } from '@/validations/therapist.validation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type Specialization = {
  id: string;
  name: string;
  category: string;
};

type TherapistFormProps = {
  users: Array<{ id: string; email: string; firstName: string; lastName: string }>;
  locations: Array<{ id: string; name: string }>;
  specializations: Specialization[];
  onSubmit: (data: CreateTherapistInput | UpdateTherapistInput) => Promise<void>;
  onCancel: () => void;
  initialData?: CreateTherapistInput | UpdateTherapistInput;
  isEditing?: boolean;
};

type TimeSlot = {
  start: string;
  end: string;
};

type WeeklyAvailability = {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
};

const defaultAvailability: WeeklyAvailability = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

export function TherapistProfileForm({
  users,
  locations,
  specializations,
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}: TherapistFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [userId, setUserId] = useState(
    (initialData && 'userId' in initialData ? initialData.userId : '') || '',
  );
  const [primaryLocationId, setPrimaryLocationId] = useState(initialData?.primaryLocationId || '');
  const [licenseNumber, setLicenseNumber] = useState(initialData?.licenseNumber || '');
  const [licenseState, setLicenseState] = useState(initialData?.licenseState || '');
  const [licenseExpirationDate, setLicenseExpirationDate] = useState(
    initialData?.licenseExpirationDate || '',
  );
  const [credentials, setCredentials] = useState(initialData?.credentials || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || '');
  const [maxCaseload, setMaxCaseload] = useState(initialData?.maxCaseload || 25);
  const [isAcceptingNewClients, setIsAcceptingNewClients] = useState(
    initialData?.isAcceptingNewClients ?? true,
  );
  const [languages, setLanguages] = useState<string[]>(initialData?.languages || ['English']);
  const [ageGroupExpertise, setAgeGroupExpertise] = useState<Array<'early_childhood' | 'school_age' | 'adolescent' | 'adult'>>(
    (initialData?.ageGroupExpertise as Array<'early_childhood' | 'school_age' | 'adolescent' | 'adult'>) || [],
  );
  const [communicationExpertise, setCommunicationExpertise] = useState<Array<'non-verbal' | 'aac' | 'sign_language' | 'speech_integration'>>(
    (initialData?.communicationExpertise as Array<'non-verbal' | 'aac' | 'sign_language' | 'speech_integration'>) || [],
  );
  const [availability, setAvailability] = useState<WeeklyAvailability>(
    initialData?.availability && typeof initialData.availability === 'object'
      ? (initialData.availability as WeeklyAvailability)
      : defaultAvailability,
  );
  const [selectedSpecializations, setSelectedSpecializations] = useState<
    Array<{ specializationId: string; proficiencyLevel: 'expert' | 'proficient' | 'familiar'; yearsExperience: number | null }>
  >(
    (initialData?.specializations?.map(s => ({
      ...s,
      proficiencyLevel: s.proficiencyLevel as 'expert' | 'proficient' | 'familiar',
    })) || []) as Array<{ specializationId: string; proficiencyLevel: 'expert' | 'proficient' | 'familiar'; yearsExperience: number | null }>,
  );

  const [languageInput, setLanguageInput] = useState('');

  const handleAddLanguage = (): void => {
    if (languageInput.trim() && !languages.includes(languageInput.trim())) {
      setLanguages([...languages, languageInput.trim()]);
      setLanguageInput('');
    }
  };

  const handleRemoveLanguage = (lang: string): void => {
    setLanguages(languages.filter(l => l !== lang));
  };

  const handleAgeGroupChange = (value: 'early_childhood' | 'school_age' | 'adolescent' | 'adult'): void => {
    if (ageGroupExpertise.includes(value)) {
      setAgeGroupExpertise(ageGroupExpertise.filter(a => a !== value));
    } else {
      setAgeGroupExpertise([...ageGroupExpertise, value]);
    }
  };

  const handleCommunicationExpertiseChange = (value: 'non-verbal' | 'aac' | 'sign_language' | 'speech_integration'): void => {
    if (communicationExpertise.includes(value)) {
      setCommunicationExpertise(communicationExpertise.filter(c => c !== value));
    } else {
      setCommunicationExpertise([...communicationExpertise, value]);
    }
  };

  const handleAddTimeSlot = (day: keyof WeeklyAvailability): void => {
    setAvailability({
      ...availability,
      [day]: [...availability[day], { start: '09:00', end: '17:00' }],
    });
  };

  const handleRemoveTimeSlot = (day: keyof WeeklyAvailability, index: number): void => {
    setAvailability({
      ...availability,
      [day]: availability[day].filter((_, i) => i !== index),
    });
  };

  const handleTimeSlotChange = (
    day: keyof WeeklyAvailability,
    index: number,
    field: 'start' | 'end',
    value: string,
  ): void => {
    const updated = [...availability[day]];
    const slot = updated[index];
    if (slot) {
      slot[field] = value;
      setAvailability({ ...availability, [day]: updated });
    }
  };

  const handleAddSpecialization = (): void => {
    const firstSpec = specializations[0];
    if (firstSpec) {
      setSelectedSpecializations([
        ...selectedSpecializations,
        {
          specializationId: firstSpec.id,
          proficiencyLevel: 'proficient' as const,
          yearsExperience: null,
        },
      ]);
    }
  };

  const handleRemoveSpecialization = (index: number): void => {
    setSelectedSpecializations(selectedSpecializations.filter((_, i) => i !== index));
  };

  const handleSpecializationChange = (
    index: number,
    field: 'specializationId' | 'proficiencyLevel' | 'yearsExperience',
    value: string | number | null,
  ): void => {
    const updated = [...selectedSpecializations];
    const current = updated[index];
    if (!current) {
      return;
    }

    if (field === 'proficiencyLevel') {
      updated[index] = {
        specializationId: current.specializationId,
        proficiencyLevel: value as 'expert' | 'proficient' | 'familiar',
        yearsExperience: current.yearsExperience,
      };
    } else if (field === 'specializationId') {
      updated[index] = {
        specializationId: value as string,
        proficiencyLevel: current.proficiencyLevel,
        yearsExperience: current.yearsExperience,
      };
    } else {
      updated[index] = {
        specializationId: current.specializationId,
        proficiencyLevel: current.proficiencyLevel,
        yearsExperience: value as number | null,
      };
    }
    setSelectedSpecializations(updated);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data: CreateTherapistInput | UpdateTherapistInput = {
        ...(!isEditing && { userId }),
        primaryLocationId: primaryLocationId || null,
        licenseNumber: licenseNumber || null,
        licenseState: licenseState || null,
        licenseExpirationDate: licenseExpirationDate || null,
        credentials: credentials || null,
        bio: bio || null,
        photoUrl: photoUrl || null,
        maxCaseload,
        isAcceptingNewClients,
        languages,
        ageGroupExpertise,
        communicationExpertise,
        availability,
        specializations: selectedSpecializations,
      };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save therapist profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysOfWeek: Array<keyof WeeklyAvailability> = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {!isEditing && (
        <div>
          <label htmlFor="userId" className="mb-2 block text-sm font-medium">
            User
            {' '}
            <span className="text-red-500">*</span>
          </label>
          <select
            id="userId"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2"
            required
          >
            <option value="">Select a user</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.firstName}
                {' '}
                {user.lastName}
                {' '}
                (
                {user.email}
                )
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="primaryLocationId" className="mb-2 block text-sm font-medium">
          Primary Location
        </label>
        <select
          id="primaryLocationId"
          value={primaryLocationId}
          onChange={e => setPrimaryLocationId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2"
        >
          <option value="">No primary location</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="licenseNumber" className="mb-2 block text-sm font-medium">
            License Number
          </label>
          <input
            id="licenseNumber"
            type="text"
            value={licenseNumber}
            onChange={e => setLicenseNumber(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2"
            maxLength={100}
          />
        </div>
        <div>
          <label htmlFor="licenseState" className="mb-2 block text-sm font-medium">
            License State
          </label>
          <input
            id="licenseState"
            type="text"
            value={licenseState}
            onChange={e => setLicenseState(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-gray-300 px-4 py-2"
            maxLength={2}
            placeholder="e.g., CA, TX"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="licenseExpirationDate" className="mb-2 block text-sm font-medium">
            License Expiration Date
          </label>
          <input
            id="licenseExpirationDate"
            type="date"
            value={licenseExpirationDate}
            onChange={e => setLicenseExpirationDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2"
          />
        </div>
        <div>
          <label htmlFor="credentials" className="mb-2 block text-sm font-medium">
            Credentials
          </label>
          <input
            id="credentials"
            type="text"
            value={credentials}
            onChange={e => setCredentials(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2"
            placeholder="e.g., BCBA, LCSW, LPC"
            maxLength={255}
          />
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="mb-2 block text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={e => setBio(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2"
          rows={4}
          maxLength={2000}
          placeholder="Professional background, experience, approach..."
        />
      </div>

      <div>
        <label htmlFor="photoUrl" className="mb-2 block text-sm font-medium">
          Photo URL
        </label>
        <input
          id="photoUrl"
          type="url"
          value={photoUrl}
          onChange={e => setPhotoUrl(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2"
          placeholder="https://example.com/photo.jpg"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="maxCaseload" className="mb-2 block text-sm font-medium">
            Max Caseload
          </label>
          <input
            id="maxCaseload"
            type="number"
            value={maxCaseload}
            onChange={e => setMaxCaseload(Number.parseInt(e.target.value, 10))}
            className="w-full rounded-lg border border-gray-300 px-4 py-2"
            min={1}
            max={100}
            required
          />
        </div>
        <div className="flex items-center pt-8">
          <input
            id="isAcceptingNewClients"
            type="checkbox"
            checked={isAcceptingNewClients}
            onChange={e => setIsAcceptingNewClients(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="isAcceptingNewClients" className="ml-2 text-sm font-medium">
            Accepting New Clients
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="language-input" className="mb-2 block text-sm font-medium">
          Languages
        </label>
        <div className="flex gap-2">
          <input
            id="language-input"
            type="text"
            value={languageInput}
            onChange={e => setLanguageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddLanguage();
              }
            }}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
            placeholder="Add a language"
          />
          <Button type="button" variant="secondary" onClick={handleAddLanguage}>
            Add
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {languages.map(lang => (
            <span
              key={lang}
              className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
            >
              {lang}
              <button
                type="button"
                onClick={() => handleRemoveLanguage(lang)}
                className="hover:text-blue-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Age Group Expertise
          {' '}
          <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {([
            { value: 'early_childhood' as const, label: 'Early Childhood (0-5)' },
            { value: 'school_age' as const, label: 'School Age (6-12)' },
            { value: 'adolescent' as const, label: 'Adolescent (13-17)' },
            { value: 'adult' as const, label: 'Adult (18+)' },
          ] as const).map(age => (
            <label key={age.value} className="flex items-center">
              <input
                type="checkbox"
                checked={ageGroupExpertise.includes(age.value)}
                onChange={() => handleAgeGroupChange(age.value)}
                className="mr-2 h-4 w-4 rounded border-gray-300"
              />
              {age.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium">
          Communication Expertise
        </span>
        <div className="space-y-2">
          {([
            { value: 'non-verbal' as const, label: 'Non-Verbal' },
            { value: 'aac' as const, label: 'AAC (Augmentative and Alternative Communication)' },
            { value: 'sign_language' as const, label: 'Sign Language' },
            { value: 'speech_integration' as const, label: 'Speech Integration' },
          ] as const).map(comm => (
            <label key={comm.value} className="flex items-center">
              <input
                type="checkbox"
                checked={communicationExpertise.includes(comm.value)}
                onChange={() => handleCommunicationExpertiseChange(comm.value)}
                className="mr-2 h-4 w-4 rounded border-gray-300"
              />
              {comm.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">
            Specializations
            {' '}
            <span className="text-red-500">*</span>
          </span>
          <Button type="button" variant="secondary" size="sm" onClick={handleAddSpecialization}>
            Add Specialization
          </Button>
        </div>
        <div className="space-y-3">
          {selectedSpecializations.map(spec => (
            <div key={spec.specializationId} className="rounded-lg border border-gray-300 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor={`specialization-${spec.specializationId}`} className="mb-1 block text-xs font-medium">Specialization</label>
                  <select
                    id={`specialization-${spec.specializationId}`}
                    value={spec.specializationId}
                    onChange={e => handleSpecializationChange(selectedSpecializations.indexOf(spec), 'specializationId', e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                  >
                    {specializations.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`proficiency-${spec.specializationId}`} className="mb-1 block text-xs font-medium">Proficiency</label>
                  <select
                    id={`proficiency-${spec.specializationId}`}
                    value={spec.proficiencyLevel}
                    onChange={e => handleSpecializationChange(selectedSpecializations.indexOf(spec), 'proficiencyLevel', e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                  >
                    <option value="familiar">Familiar</option>
                    <option value="proficient">Proficient</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`years-${spec.specializationId}`} className="mb-1 block text-xs font-medium">Years Experience</label>
                  <div className="flex gap-2">
                    <input
                      id={`years-${spec.specializationId}`}
                      type="number"
                      value={spec.yearsExperience || ''}
                      onChange={e =>
                        handleSpecializationChange(
                          selectedSpecializations.indexOf(spec),
                          'yearsExperience',
                          e.target.value ? Number.parseInt(e.target.value, 10) : null,
                        )}
                      className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
                      min={0}
                      placeholder="Optional"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialization(selectedSpecializations.indexOf(spec))}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium">
          Weekly Availability
        </span>
        <div className="space-y-4">
          {daysOfWeek.map(day => (
            <div key={day} className="rounded-lg border border-gray-300 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium capitalize">{day}</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddTimeSlot(day)}
                >
                  Add Time Slot
                </Button>
              </div>
              <div className="space-y-2">
                {(availability[day] || []).map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.start}
                      onChange={e => handleTimeSlotChange(day, index, 'start', e.target.value)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={e => handleTimeSlotChange(day, index, 'end', e.target.value)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTimeSlot(day, index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {(availability[day] || []).length === 0 && (
                  <p className="text-sm text-gray-500">No availability set</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          {isEditing ? 'Update Profile' : 'Create Profile'}
        </Button>
        <Button type="button" variant="secondary" fullWidth onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
