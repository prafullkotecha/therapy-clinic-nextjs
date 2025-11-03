import { z } from 'zod';

/**
 * Max results configuration for matching API
 */
export const MAX_RESULTS_MIN = 1;
export const MAX_RESULTS_MAX = 20;
export const MAX_RESULTS_DEFAULT = 5;

// Specialization importance levels
export const specializationImportanceSchema = z.enum([
  'critical',
  'preferred',
  'nice_to_have',
]);

// Urgency levels
export const urgencyLevelSchema = z.enum(['urgent', 'high', 'standard', 'low']);

// Required specialization schema
export const requiredSpecializationSchema = z.object({
  specializationId: z.string().uuid(),
  specializationName: z.string().optional(),
  importance: specializationImportanceSchema,
});

// Match criteria schema (request body)
export const matchCriteriaSchema = z.object({
  requiredSpecializations: z.array(requiredSpecializationSchema),
  communicationNeeds: z.string().optional(),
  ageGroup: z.string().optional(),
  preferredTimes: z.array(z.string()).optional(),
  urgency: urgencyLevelSchema.optional(),
  maxResults: z
    .number()
    .int()
    .min(MAX_RESULTS_MIN)
    .max(MAX_RESULTS_MAX)
    .default(MAX_RESULTS_DEFAULT),
});

// Match details schema
export const matchDetailsSchema = z.object({
  specializationScore: z.number().min(0).max(100),
  communicationScore: z.number().min(0).max(100),
  availabilityScore: z.number().min(0).max(100),
  ageMatchScore: z.number().min(0).max(100),
  caseloadScore: z.number().min(0).max(100),
});

// Therapist match schema (response)
export const therapistMatchSchema = z.object({
  therapistId: z.string().uuid(),
  matchScore: z.number().min(0).max(100),
  matchReasoning: z.string(),
  details: matchDetailsSchema,
});

// Find therapists response schema
export const findTherapistsResponseSchema = z.object({
  matches: z.array(therapistMatchSchema),
  totalMatches: z.number().int().min(0),
});

// Export types
export type MatchCriteriaInput = z.infer<typeof matchCriteriaSchema>;
export type TherapistMatchOutput = z.infer<typeof therapistMatchSchema>;
export type FindTherapistsResponse = z.infer<typeof findTherapistsResponseSchema>;
