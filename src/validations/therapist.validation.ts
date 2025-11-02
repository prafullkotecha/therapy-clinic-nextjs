import { z } from 'zod';

/**
 * Proficiency levels for therapist specializations
 */
export const ProficiencyLevel = {
  FAMILIAR: 'familiar',
  PROFICIENT: 'proficient',
  EXPERT: 'expert',
} as const;

export type ProficiencyLevelType = typeof ProficiencyLevel[keyof typeof ProficiencyLevel];

/**
 * Age group expertise options
 */
export const AgeGroupExpertise = {
  EARLY_CHILDHOOD: 'early_childhood', // 0-5 years
  SCHOOL_AGE: 'school_age', // 6-12 years
  ADOLESCENT: 'adolescent', // 13-17 years
  ADULT: 'adult', // 18+ years
} as const;

export type AgeGroupExpertiseType = typeof AgeGroupExpertise[keyof typeof AgeGroupExpertise];

/**
 * Communication expertise options
 */
export const CommunicationExpertise = {
  NON_VERBAL: 'non-verbal',
  AAC: 'aac', // Augmentative and Alternative Communication
  SIGN_LANGUAGE: 'sign_language',
  SPEECH_INTEGRATION: 'speech_integration',
} as const;

export type CommunicationExpertiseType = typeof CommunicationExpertise[keyof typeof CommunicationExpertise];

/**
 * Time slot schema for availability
 */
export const timeSlotSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
});

/**
 * Weekly availability schema
 */
export const availabilitySchema = z.object({
  monday: z.array(timeSlotSchema).default([]),
  tuesday: z.array(timeSlotSchema).default([]),
  wednesday: z.array(timeSlotSchema).default([]),
  thursday: z.array(timeSlotSchema).default([]),
  friday: z.array(timeSlotSchema).default([]),
  saturday: z.array(timeSlotSchema).default([]),
  sunday: z.array(timeSlotSchema).default([]),
});

/**
 * Therapist specialization input schema
 */
export const therapistSpecializationInputSchema = z.object({
  specializationId: z.string().uuid('Invalid specialization ID'),
  proficiencyLevel: z.enum(['familiar', 'proficient', 'expert'] as const, {
    message: 'Invalid proficiency level',
  }),
  yearsExperience: z.number()
    .int('Years of experience must be an integer')
    .min(0, 'Years of experience cannot be negative')
    .optional()
    .nullable(),
});

/**
 * Validation schema for creating a therapist profile
 */
export const createTherapistSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  primaryLocationId: z.string().uuid('Invalid location ID').optional().nullable(),

  // Credentials
  licenseNumber: z.string()
    .max(100, 'License number must be at most 100 characters')
    .optional()
    .nullable(),
  licenseState: z.string()
    .length(2, 'License state must be 2 characters (e.g., CA, TX)')
    .toUpperCase()
    .optional()
    .nullable(),
  licenseExpirationDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
  credentials: z.string()
    .max(255, 'Credentials must be at most 255 characters')
    .optional()
    .nullable(),

  bio: z.string()
    .max(2000, 'Bio must be at most 2000 characters')
    .optional()
    .nullable(),
  photoUrl: z.string()
    .url('Invalid photo URL')
    .optional()
    .nullable(),

  // Caseload
  maxCaseload: z.number()
    .int('Max caseload must be an integer')
    .min(1, 'Max caseload must be at least 1')
    .max(100, 'Max caseload cannot exceed 100')
    .default(25),
  isAcceptingNewClients: z.boolean().default(true),

  // Capabilities
  languages: z.array(z.string()).default(['English']),
  ageGroupExpertise: z.array(
    z.enum(['early_childhood', 'school_age', 'adolescent', 'adult'] as const),
  ).min(1, 'At least one age group expertise is required'),
  communicationExpertise: z.array(
    z.enum(['non-verbal', 'aac', 'sign_language', 'speech_integration'] as const),
  ).default([]),

  // Availability
  availability: availabilitySchema.optional().nullable(),

  // Specializations (junction table data)
  specializations: z.array(therapistSpecializationInputSchema)
    .min(1, 'At least one specialization is required'),
});

/**
 * Validation schema for updating a therapist profile
 */
export const updateTherapistSchema = z.object({
  primaryLocationId: z.string().uuid('Invalid location ID').optional().nullable(),

  // Credentials
  licenseNumber: z.string()
    .max(100, 'License number must be at most 100 characters')
    .optional()
    .nullable(),
  licenseState: z.string()
    .length(2, 'License state must be 2 characters (e.g., CA, TX)')
    .toUpperCase()
    .optional()
    .nullable(),
  licenseExpirationDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
  credentials: z.string()
    .max(255, 'Credentials must be at most 255 characters')
    .optional()
    .nullable(),

  bio: z.string()
    .max(2000, 'Bio must be at most 2000 characters')
    .optional()
    .nullable(),
  photoUrl: z.string()
    .url('Invalid photo URL')
    .optional()
    .nullable(),

  // Caseload
  maxCaseload: z.number()
    .int('Max caseload must be an integer')
    .min(1, 'Max caseload must be at least 1')
    .max(100, 'Max caseload cannot exceed 100')
    .optional(),
  isAcceptingNewClients: z.boolean().optional(),

  // Capabilities
  languages: z.array(z.string()).optional(),
  ageGroupExpertise: z.array(
    z.enum(['early_childhood', 'school_age', 'adolescent', 'adult'] as const),
  ).optional(),
  communicationExpertise: z.array(
    z.enum(['non-verbal', 'aac', 'sign_language', 'speech_integration'] as const),
  ).optional(),

  // Availability
  availability: availabilitySchema.optional().nullable(),

  // Specializations (junction table data)
  specializations: z.array(therapistSpecializationInputSchema).optional(),
});

/**
 * Validation schema for therapist query parameters
 */
export const therapistQuerySchema = z.object({
  isAcceptingNewClients: z.enum(['true', 'false']).optional(),
  locationId: z.string().uuid('Invalid location ID').optional(),
  specializationId: z.string().uuid('Invalid specialization ID').optional(),
  search: z.string().optional(),
});

export type CreateTherapistInput = z.infer<typeof createTherapistSchema>;
export type UpdateTherapistInput = z.infer<typeof updateTherapistSchema>;
export type TherapistQueryParams = z.infer<typeof therapistQuerySchema>;
export type TherapistSpecializationInput = z.infer<typeof therapistSpecializationInputSchema>;
export type TimeSlot = z.infer<typeof timeSlotSchema>;
export type Availability = z.infer<typeof availabilitySchema>;
