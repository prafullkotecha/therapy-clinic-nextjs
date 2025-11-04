/**
 * Appointment Duration Constants
 *
 * Centralized constants for appointment scheduling to ensure consistency
 * across validation schemas, API routes, and service layers.
 */

/**
 * Default appointment duration in minutes
 * Used when no specific duration is specified
 */
export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 60;

/**
 * Minimum allowed appointment duration in minutes
 */
export const MIN_APPOINTMENT_DURATION_MINUTES = 15;

/**
 * Maximum allowed appointment duration in minutes (8 hours)
 */
export const MAX_APPOINTMENT_DURATION_MINUTES = 480;
