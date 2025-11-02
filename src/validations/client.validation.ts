import { z } from 'zod';

/**
 * Age group options for clients
 */
export const AgeGroup = {
  EARLY_CHILDHOOD: 'early_childhood', // 0-5 years
  SCHOOL_AGE: 'school_age', // 6-12 years
  ADOLESCENT: 'adolescent', // 13-17 years
  ADULT: 'adult', // 18+ years
} as const;

export type AgeGroupType = typeof AgeGroup[keyof typeof AgeGroup];

/**
 * Client status options
 */
export const ClientStatus = {
  INTAKE: 'intake',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISCHARGED: 'discharged',
} as const;

export type ClientStatusType = typeof ClientStatus[keyof typeof ClientStatus];

/**
 * Communication needs options
 */
export const CommunicationNeeds = {
  VERBAL: 'verbal',
  NON_VERBAL: 'non_verbal',
  AAC: 'aac', // Augmentative and Alternative Communication
  SIGN_LANGUAGE: 'sign_language',
} as const;

export type CommunicationNeedsType = typeof CommunicationNeeds[keyof typeof CommunicationNeeds];

/**
 * Urgency level options
 */
export const UrgencyLevel = {
  LOW: 'low',
  STANDARD: 'standard',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type UrgencyLevelType = typeof UrgencyLevel[keyof typeof UrgencyLevel];

/**
 * Specialization importance for matching
 */
export const SpecializationImportance = {
  CRITICAL: 'critical',
  PREFERRED: 'preferred',
  NICE_TO_HAVE: 'nice_to_have',
} as const;

export type SpecializationImportanceType = typeof SpecializationImportance[keyof typeof SpecializationImportance];

/**
 * Required specialization schema for client needs
 */
export const clientRequiredSpecializationSchema = z.object({
  specializationId: z.string().uuid('Invalid specialization ID'),
  specializationName: z.string(),
  importance: z.enum(['critical', 'preferred', 'nice_to_have'] as const),
});

/**
 * Schedule preferences schema
 */
export const schedulePreferencesSchema = z.object({
  preferredDays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const)).default([]),
  preferredTimes: z.array(z.enum(['morning', 'afternoon', 'evening'] as const)).default([]),
});

/**
 * Validation schema for creating a client profile
 */
export const createClientSchema = z.object({
  primaryLocationId: z.string().uuid('Invalid location ID').optional().nullable(),

  // Basic Info (will be encrypted)
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be at most 100 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be at most 100 characters'),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  ssn: z.string()
    .regex(/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format (XXX-XX-XXXX)')
    .optional()
    .nullable(),

  // Contact (will be encrypted)
  email: z.string()
    .email('Invalid email address')
    .optional()
    .nullable(),
  phone: z.string()
    .regex(/^\+?1?\d{10,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  address: z.string()
    .max(500, 'Address must be at most 500 characters')
    .optional()
    .nullable(),

  // Demographics (non-PHI)
  ageGroup: z.enum(['early_childhood', 'school_age', 'adolescent', 'adult'] as const)
    .optional()
    .nullable(),
  preferredLanguage: z.string()
    .max(50, 'Language must be at most 50 characters')
    .default('English'),

  // Guardian info for minors (will be encrypted)
  guardianName: z.string()
    .max(200, 'Guardian name must be at most 200 characters')
    .optional()
    .nullable(),
  guardianRelationship: z.string()
    .max(50, 'Guardian relationship must be at most 50 characters')
    .optional()
    .nullable(),
  guardianPhone: z.string()
    .regex(/^\+?1?\d{10,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  guardianEmail: z.string()
    .email('Invalid email address')
    .optional()
    .nullable(),

  // Emergency contact (will be encrypted)
  emergencyContactName: z.string()
    .max(200, 'Emergency contact name must be at most 200 characters')
    .optional()
    .nullable(),
  emergencyContactPhone: z.string()
    .regex(/^\+?1?\d{10,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  emergencyContactRelationship: z.string()
    .max(50, 'Relationship must be at most 50 characters')
    .optional()
    .nullable(),

  // Insurance (will be encrypted)
  insuranceProvider: z.string()
    .max(200, 'Insurance provider must be at most 200 characters')
    .optional()
    .nullable(),
  insurancePolicyNumber: z.string()
    .max(100, 'Policy number must be at most 100 characters')
    .optional()
    .nullable(),
  insuranceGroupNumber: z.string()
    .max(100, 'Group number must be at most 100 characters')
    .optional()
    .nullable(),

  // Status
  status: z.enum(['intake', 'active', 'inactive', 'discharged'] as const)
    .default('intake'),
  intakeDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
});

/**
 * Validation schema for creating client needs/assessment
 */
export const createClientNeedsSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),

  // Assessment (will be encrypted)
  primaryConcerns: z.string()
    .max(2000, 'Primary concerns must be at most 2000 characters')
    .optional()
    .nullable(),
  behavioralCharacteristics: z.string()
    .max(2000, 'Behavioral characteristics must be at most 2000 characters')
    .optional()
    .nullable(),
  sensoryConsiderations: z.string()
    .max(2000, 'Sensory considerations must be at most 2000 characters')
    .optional()
    .nullable(),

  // Needs (non-encrypted for matching)
  communicationNeeds: z.enum(['verbal', 'non_verbal', 'aac', 'sign_language'] as const)
    .optional()
    .nullable(),
  cooccurringConditions: z.array(z.string()).default([]),

  // Required specializations for matching
  requiredSpecializations: z.array(clientRequiredSpecializationSchema)
    .min(1, 'At least one specialization is required')
    .default([]),

  // Preferences
  preferredTherapyModality: z.string()
    .max(20, 'Therapy modality must be at most 20 characters')
    .optional()
    .nullable(),
  schedulePreferences: schedulePreferencesSchema.optional().nullable(),

  // Priority
  urgencyLevel: z.enum(['low', 'standard', 'high', 'urgent'] as const)
    .default('standard'),
});

/**
 * Validation schema for updating a client profile
 */
export const updateClientSchema = z.object({
  primaryLocationId: z.string().uuid('Invalid location ID').optional().nullable(),

  // Basic Info (will be encrypted)
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be at most 100 characters')
    .optional(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be at most 100 characters')
    .optional(),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  ssn: z.string()
    .regex(/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format (XXX-XX-XXXX)')
    .optional()
    .nullable(),

  // Contact (will be encrypted)
  email: z.string()
    .email('Invalid email address')
    .optional()
    .nullable(),
  phone: z.string()
    .regex(/^\+?1?\d{10,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  address: z.string()
    .max(500, 'Address must be at most 500 characters')
    .optional()
    .nullable(),

  // Demographics (non-PHI)
  ageGroup: z.enum(['early_childhood', 'school_age', 'adolescent', 'adult'] as const)
    .optional()
    .nullable(),
  preferredLanguage: z.string()
    .max(50, 'Language must be at most 50 characters')
    .optional(),

  // Guardian info for minors (will be encrypted)
  guardianName: z.string()
    .max(200, 'Guardian name must be at most 200 characters')
    .optional()
    .nullable(),
  guardianRelationship: z.string()
    .max(50, 'Guardian relationship must be at most 50 characters')
    .optional()
    .nullable(),
  guardianPhone: z.string()
    .regex(/^\+?1?\d{10,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  guardianEmail: z.string()
    .email('Invalid email address')
    .optional()
    .nullable(),

  // Emergency contact (will be encrypted)
  emergencyContactName: z.string()
    .max(200, 'Emergency contact name must be at most 200 characters')
    .optional()
    .nullable(),
  emergencyContactPhone: z.string()
    .regex(/^\+?1?\d{10,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  emergencyContactRelationship: z.string()
    .max(50, 'Relationship must be at most 50 characters')
    .optional()
    .nullable(),

  // Insurance (will be encrypted)
  insuranceProvider: z.string()
    .max(200, 'Insurance provider must be at most 200 characters')
    .optional()
    .nullable(),
  insurancePolicyNumber: z.string()
    .max(100, 'Policy number must be at most 100 characters')
    .optional()
    .nullable(),
  insuranceGroupNumber: z.string()
    .max(100, 'Group number must be at most 100 characters')
    .optional()
    .nullable(),

  // Status
  status: z.enum(['intake', 'active', 'inactive', 'discharged'] as const)
    .optional(),
  intakeDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
  dischargeDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),

  // Assignment
  assignedTherapistId: z.string().uuid('Invalid therapist ID').optional().nullable(),
});

/**
 * Validation schema for updating client needs
 */
export const updateClientNeedsSchema = z.object({
  // Assessment (will be encrypted)
  primaryConcerns: z.string()
    .max(2000, 'Primary concerns must be at most 2000 characters')
    .optional()
    .nullable(),
  behavioralCharacteristics: z.string()
    .max(2000, 'Behavioral characteristics must be at most 2000 characters')
    .optional()
    .nullable(),
  sensoryConsiderations: z.string()
    .max(2000, 'Sensory considerations must be at most 2000 characters')
    .optional()
    .nullable(),

  // Needs (non-encrypted for matching)
  communicationNeeds: z.enum(['verbal', 'non_verbal', 'aac', 'sign_language'] as const)
    .optional()
    .nullable(),
  cooccurringConditions: z.array(z.string()).optional(),

  // Required specializations for matching
  requiredSpecializations: z.array(clientRequiredSpecializationSchema).optional(),

  // Preferences
  preferredTherapyModality: z.string()
    .max(20, 'Therapy modality must be at most 20 characters')
    .optional()
    .nullable(),
  schedulePreferences: schedulePreferencesSchema.optional().nullable(),

  // Priority
  urgencyLevel: z.enum(['low', 'standard', 'high', 'urgent'] as const).optional(),
});

/**
 * Validation schema for client query parameters
 */
export const clientQuerySchema = z.object({
  status: z.enum(['intake', 'active', 'inactive', 'discharged'] as const).optional(),
  locationId: z.string().uuid('Invalid location ID').optional(),
  assignedTherapistId: z.string().uuid('Invalid therapist ID').optional(),
  search: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateClientNeedsInput = z.infer<typeof createClientNeedsSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type UpdateClientNeedsInput = z.infer<typeof updateClientNeedsSchema>;
export type ClientQueryParams = z.infer<typeof clientQuerySchema>;
export type ClientRequiredSpecialization = z.infer<typeof clientRequiredSpecializationSchema>;
export type SchedulePreferences = z.infer<typeof schedulePreferencesSchema>;
