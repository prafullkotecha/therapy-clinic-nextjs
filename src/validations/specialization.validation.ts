import { z } from 'zod';

/**
 * Specialization categories based on schema definition
 */
export const SpecializationCategory = {
  BEHAVIORAL_APPROACH: 'behavioral_approach',
  COMMUNICATION: 'communication',
  POPULATION: 'population',
  AGE_GROUP: 'age_group',
  MODALITY: 'modality',
  CULTURAL: 'cultural',
} as const;

export type SpecializationCategoryType = typeof SpecializationCategory[keyof typeof SpecializationCategory];

/**
 * Validation schema for creating a specialization
 */
export const createSpecializationSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .trim(),

  category: z.enum([
    'behavioral_approach',
    'communication',
    'population',
    'age_group',
    'modality',
    'cultural',
  ] as const, {
    message: 'Invalid category',
  }),

  description: z.string()
    .max(1000, 'Description must be at most 1000 characters')
    .trim()
    .optional()
    .nullable(),

  isActive: z.boolean()
    .default(true)
    .optional(),
});

/**
 * Validation schema for updating a specialization
 */
export const updateSpecializationSchema = createSpecializationSchema.partial();

/**
 * Validation schema for specialization query parameters
 */
export const specializationQuerySchema = z.object({
  category: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

export type CreateSpecializationInput = z.infer<typeof createSpecializationSchema>;
export type UpdateSpecializationInput = z.infer<typeof updateSpecializationSchema>;
export type SpecializationQueryParams = z.infer<typeof specializationQuerySchema>;
