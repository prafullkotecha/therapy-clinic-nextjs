// Database enums and types for therapy clinic management system

// User roles
export const UserRole = {
  ADMIN: 'admin',
  THERAPIST: 'therapist',
  BILLING: 'billing',
  RECEPTIONIST: 'receptionist',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Appointment status
export const AppointmentStatus = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export type AppointmentStatusType = typeof AppointmentStatus[keyof typeof AppointmentStatus];

// Client status
export const ClientStatus = {
  INTAKE: 'intake',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISCHARGED: 'discharged',
} as const;

export type ClientStatusType = typeof ClientStatus[keyof typeof ClientStatus];

// Age groups
export const AgeGroup = {
  EARLY_CHILDHOOD: 'early_childhood', // 0-5
  SCHOOL_AGE: 'school_age', // 6-12
  ADOLESCENT: 'adolescent', // 13-17
  ADULT: 'adult', // 18+
} as const;

export type AgeGroupType = typeof AgeGroup[keyof typeof AgeGroup];

// Proficiency levels for therapist specializations
export const ProficiencyLevel = {
  EXPERT: 'expert',
  PROFICIENT: 'proficient',
  FAMILIAR: 'familiar',
} as const;

export type ProficiencyLevelType = typeof ProficiencyLevel[keyof typeof ProficiencyLevel];

// Urgency levels for client needs
export const UrgencyLevel = {
  URGENT: 'urgent',
  HIGH: 'high',
  STANDARD: 'standard',
  LOW: 'low',
} as const;

export type UrgencyLevelType = typeof UrgencyLevel[keyof typeof UrgencyLevel];

// Communication needs
export const CommunicationNeeds = {
  VERBAL: 'verbal',
  NON_VERBAL: 'non_verbal',
  AAC: 'aac', // Augmentative and Alternative Communication
  SIGN_LANGUAGE: 'sign_language',
} as const;

export type CommunicationNeedsType = typeof CommunicationNeeds[keyof typeof CommunicationNeeds];

// Specialization categories
export const SpecializationCategory = {
  BEHAVIORAL_APPROACH: 'behavioral_approach', // ABA, CBT, DBT, EMDR, Play Therapy
  COMMUNICATION: 'communication', // Non-verbal, AAC, Sign Language, Speech Integration
  POPULATION: 'population', // Autism, ADHD, Anxiety, Trauma, Developmental Delays
  AGE_GROUP: 'age_group', // Early Childhood, School Age, Adolescent, Adult
  MODALITY: 'modality', // Individual, Family, Group
  CULTURAL: 'cultural', // Languages, Cultural Backgrounds
} as const;

export type SpecializationCategoryType = typeof SpecializationCategory[keyof typeof SpecializationCategory];

// Appointment types
export const AppointmentType = {
  INITIAL_ASSESSMENT: 'initial_assessment',
  REGULAR_SESSION: 'regular_session',
  FAMILY_SESSION: 'family_session',
  GROUP_SESSION: 'group_session',
} as const;

export type AppointmentTypeType = typeof AppointmentType[keyof typeof AppointmentType];

// Therapy modality
export const TherapyModality = {
  INDIVIDUAL: 'individual',
  FAMILY: 'family',
  GROUP: 'group',
} as const;

export type TherapyModalityType = typeof TherapyModality[keyof typeof TherapyModality];

// Waitlist status
export const WaitlistStatus = {
  WAITING: 'waiting',
  NOTIFIED: 'notified',
  SCHEDULED: 'scheduled',
  EXPIRED: 'expired',
} as const;

export type WaitlistStatusType = typeof WaitlistStatus[keyof typeof WaitlistStatus];

// Treatment plan status
export const TreatmentPlanStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  UNDER_REVIEW: 'under_review',
  COMPLETED: 'completed',
  DISCONTINUED: 'discontinued',
} as const;

export type TreatmentPlanStatusType = typeof TreatmentPlanStatus[keyof typeof TreatmentPlanStatus];

// Consent form types
export const ConsentType = {
  HIPAA_AUTHORIZATION: 'hipaa_authorization',
  TREATMENT_CONSENT: 'treatment_consent',
  TELEHEALTH_CONSENT: 'telehealth_consent',
  PHOTO_VIDEO_RELEASE: 'photo_video_release',
} as const;

export type ConsentTypeType = typeof ConsentType[keyof typeof ConsentType];

// Consent form status
export const ConsentStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  WITHDRAWN: 'withdrawn',
  SUPERSEDED: 'superseded',
} as const;

export type ConsentStatusType = typeof ConsentStatus[keyof typeof ConsentStatus];

// Signer relationship
export const SignerRelationship = {
  SELF: 'self',
  PARENT: 'parent',
  GUARDIAN: 'guardian',
  LEGAL_REPRESENTATIVE: 'legal_representative',
} as const;

export type SignerRelationshipType = typeof SignerRelationship[keyof typeof SignerRelationship];

// Document types
export const DocumentType = {
  ASSESSMENT: 'assessment',
  REFERRAL: 'referral',
  MEDICAL_RECORD: 'medical_record',
  INSURANCE: 'insurance',
  CONSENT: 'consent',
  OTHER: 'other',
} as const;

export type DocumentTypeType = typeof DocumentType[keyof typeof DocumentType];

// Tenant status
export const TenantStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled',
} as const;

export type TenantStatusType = typeof TenantStatus[keyof typeof TenantStatus];

// Priority levels
export const Priority = {
  URGENT: 'urgent',
  STANDARD: 'standard',
} as const;

export type PriorityType = typeof Priority[keyof typeof Priority];
