# Therapy Clinic Management System - Implementation Plan
**Version:** 1.0
**Date:** November 1, 2025
**Base Template:** ixartz Next.js Boilerplate
**Architecture:** Multi-Tenant SaaS

---

## Executive Summary

Building HIPAA-compliant, multi-tenant behavioral therapy clinic management system using ixartz Next.js Boilerplate. System supports multiple clinic organizations (tenants), each with multiple locations, intelligent therapist-client matching, appointment scheduling, and comprehensive compliance infrastructure.

**Timeline:** 12 months (8 phases)
**Team:** 4.75 FTE
**Budget:** $200K-280K Year 1

---

## 1. Tech Stack

### 1.1 Core Stack (from Boilerplate)

**Framework & Language:**
- Next.js 16 (App Router + Page Router)
- TypeScript (strict mode)
- React 19

**Database:**
- Drizzle ORM
- PostgreSQL 15+ (AWS RDS with encryption)

**Styling:**
- Tailwind CSS 4
- PostCSS

**Development:**
- ESLint + Prettier + Lefthook
- Vitest + Playwright + Testing Library
- Storybook

**Utilities:**
- React Hook Form + Zod
- next-intl (i18n)
- T3 Env (type-safe env vars)

### 1.2 Replaced/Removed

❌ **Clerk** → ✅ **Keycloak** (self-hosted, HIPAA-compliant)

### 1.3 Added Services

**Infrastructure:**
- AWS RDS PostgreSQL (HIPAA-compliant managed DB)
- AWS ElastiCache Redis (session management)
- AWS S3 (encrypted document storage)
- AWS KMS (encryption key management)
- AWS Secrets Manager (credentials)
- AWS CloudWatch + CloudTrail (monitoring, audit logs)

**Authentication & Security:**
- Keycloak (SSO, MFA, RBAC)
- Custom PHI encryption service (AES-256)
- Audit logging system
- Arcjet (WAF, bot detection) ✓

**Monitoring:**
- Sentry (with BAA) ✓
- LogTape ✓

**Communications:**
- SendGrid (email with BAA)
- Twilio (SMS with BAA)

**PWA:**
- Workbox (service workers)
- Push notifications

---

## 2. Multi-Tenancy Architecture

### 2.1 Overview

**Model:** Shared schema, isolated data
**Isolation Level:** Row-level security (PostgreSQL RLS)
**Tenant Context:** Extracted from Keycloak JWT, injected via middleware

**Hierarchy:**
```
Tenant (Clinic Organization)
├── Settings (branding, compliance config)
├── Locations (multiple physical clinics)
│   ├── Address, contact info
│   └── Operating hours
├── Users (admin, therapists, billing, receptionist)
│   ├── Roles & permissions
│   └── Location assignments
├── Clients (PHI data, encrypted)
├── Therapists
├── Appointments
├── Specializations (tenant-specific taxonomy)
└── Documents (encrypted files in S3)
```

### 2.2 Database Design

**Every table includes:**
```typescript
tenantId: uuid('tenant_id').references(() => tenants.id).notNull();
```

**RLS Policies (PostgreSQL):**
```sql
-- Example policy for clients table
CREATE POLICY tenant_isolation_policy ON clients
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Set tenant context per request
SET LOCAL app.current_tenant = '<tenant-id-from-jwt>';
```

**Tenant Middleware:**
```typescript
// middleware/tenant.middleware.ts
export async function tenantMiddleware(req: NextRequest) {
  const token = await getKeycloakToken(req);
  const tenantId = token.tenant_id;

  // Inject into request context
  req.headers.set('x-tenant-id', tenantId);

  // Set PostgreSQL session variable
  await db.execute(sql`SET LOCAL app.current_tenant = ${tenantId}`);
}
```

### 2.3 Tenant Provisioning

**New Tenant Onboarding:**
1. Create tenant record
2. Create default admin user in Keycloak
3. Provision tenant-specific Keycloak realm settings
4. Create default specializations taxonomy
5. Set up location(s)
6. Configure consent form templates
7. Send welcome email

---

## 3. Database Schema

### 3.1 Multi-Tenancy Core

**Tenants:**
```typescript
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),

  // Settings
  timezone: varchar('timezone', { length: 50 }).default('America/New_York'),
  locale: varchar('locale', { length: 10 }).default('en-US'),

  // Branding
  logo: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 7 }).default('#3B82F6'),

  // Subscription
  plan: varchar('plan', { length: 50 }).default('standard'),
  status: varchar('status', { length: 20 }).default('active'),
  // active, suspended, cancelled
  maxLocations: integer('max_locations').default(5),
  maxTherapists: integer('max_therapists').default(50),
  maxActiveClients: integer('max_active_clients').default(500),

  // Billing
  billingEmail: varchar('billing_email', { length: 255 }),
  subscriptionStart: date('subscription_start'),
  subscriptionEnd: date('subscription_end'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zipCode: varchar('zip_code', { length: 10 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),

  // Operating hours (JSON)
  operatingHours: jsonb('operating_hours'),
  // { monday: { open: '09:00', close: '17:00' }, ... }

  isActive: boolean('is_active').default(true),
  isPrimary: boolean('is_primary').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### 3.2 Users & Authentication

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  keycloakId: varchar('keycloak_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  // admin, therapist, billing, receptionist

  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),

  // Location assignment (can work at multiple locations)
  assignedLocations: jsonb('assigned_locations'), // Array of location IDs

  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
  mfaEnabled: boolean('mfa_enabled').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),

  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  phiAccessed: boolean('phi_accessed').default(false),
  changes: jsonb('changes'),

  timestamp: timestamp('timestamp').defaultNow(),
});
```

### 3.3 Specializations

```typescript
export const specializations = pgTable('specializations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  // behavioral_approach, communication, population, age_group, modality, cultural
  description: text('description'),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow(),
});

// Categories:
// - behavioral_approach: ABA, CBT, DBT, EMDR, Play Therapy
// - communication: Non-verbal, AAC, Sign Language, Speech Integration
// - population: Autism, ADHD, Anxiety, Trauma, Developmental Delays
// - age_group: Early Childhood (0-5), School Age (6-12), Adolescent (13-17), Adult (18+)
// - modality: Individual, Family, Group
// - cultural: Languages, Cultural Backgrounds
```

### 3.4 Therapists

```typescript
export const therapists = pgTable('therapists', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  userId: uuid('user_id').references(() => users.id).notNull(),
  primaryLocationId: uuid('primary_location_id').references(() => locations.id),

  // Credentials
  licenseNumber: varchar('license_number', { length: 100 }),
  licenseState: varchar('license_state', { length: 2 }),
  licenseExpirationDate: date('license_expiration_date'),
  credentials: varchar('credentials', { length: 255 }), // BCBA, LCSW, LPC, etc.

  bio: text('bio'),
  photoUrl: text('photo_url'),

  // Caseload
  maxCaseload: integer('max_caseload').default(25),
  currentCaseload: integer('current_caseload').default(0),
  isAcceptingNewClients: boolean('is_accepting_new_clients').default(true),

  // Capabilities
  languages: jsonb('languages'), // ['English', 'Spanish']
  ageGroupExpertise: jsonb('age_group_expertise'), // ['early_childhood', 'school_age']
  communicationExpertise: jsonb('communication_expertise'), // ['non-verbal', 'aac']

  // Availability template (JSON)
  availability: jsonb('availability'),
  // { monday: [{ start: '09:00', end: '17:00' }], ... }

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const therapistSpecializations = pgTable('therapist_specializations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  therapistId: uuid('therapist_id').references(() => therapists.id).notNull(),
  specializationId: uuid('specialization_id').references(() => specializations.id).notNull(),
  proficiencyLevel: varchar('proficiency_level', { length: 20 }).notNull(),
  // expert, proficient, familiar
  yearsExperience: integer('years_experience'),

  createdAt: timestamp('created_at').defaultNow(),
});
```

### 3.5 Clients (PHI - Encrypted)

```typescript
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  primaryLocationId: uuid('primary_location_id').references(() => locations.id),

  // Basic Info (ENCRYPTED with format: keyId:iv:authTag:ciphertext)
  firstName: text('first_name_encrypted').notNull(),
  lastName: text('last_name_encrypted').notNull(),
  dateOfBirth: text('date_of_birth_encrypted').notNull(),
  ssn: text('ssn_encrypted'), // Optional

  // Contact (ENCRYPTED)
  email: text('email_encrypted'),
  phone: text('phone_encrypted'),
  address: text('address_encrypted'),

  // Demographics (non-PHI, for matching)
  ageGroup: varchar('age_group', { length: 20 }),
  // early_childhood, school_age, adolescent, adult
  preferredLanguage: varchar('preferred_language', { length: 50 }),

  // Guardian (for minors) (ENCRYPTED)
  guardianName: text('guardian_name_encrypted'),
  guardianRelationship: varchar('guardian_relationship', { length: 50 }),
  guardianPhone: text('guardian_phone_encrypted'),
  guardianEmail: text('guardian_email_encrypted'),

  // Emergency Contact (ENCRYPTED)
  emergencyContactName: text('emergency_contact_name_encrypted'),
  emergencyContactPhone: text('emergency_contact_phone_encrypted'),
  emergencyContactRelationship: varchar('emergency_contact_relationship', { length: 50 }),

  // Insurance (ENCRYPTED)
  insuranceProvider: text('insurance_provider_encrypted'),
  insurancePolicyNumber: text('insurance_policy_number_encrypted'),
  insuranceGroupNumber: text('insurance_group_number_encrypted'),

  // Status
  status: varchar('status', { length: 20 }).default('intake'),
  // intake, active, inactive, discharged
  intakeDate: date('intake_date'),
  dischargeDate: date('discharge_date'),

  // Assignment
  assignedTherapistId: uuid('assigned_therapist_id').references(() => therapists.id),
  matchScore: integer('match_score'),
  matchReasoning: text('match_reasoning'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
});

export const clientNeeds = pgTable('client_needs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),

  // Assessment (ENCRYPTED)
  primaryConcerns: text('primary_concerns_encrypted'),
  behavioralCharacteristics: text('behavioral_characteristics_encrypted'),
  sensoryConsiderations: text('sensory_considerations_encrypted'),

  // Needs (non-encrypted for matching)
  communicationNeeds: varchar('communication_needs', { length: 50 }),
  // verbal, non_verbal, aac, sign_language
  cooccurringConditions: jsonb('cooccurring_conditions'),

  // Required Specializations (for matching algorithm)
  requiredSpecializations: jsonb('required_specializations'),
  // [{ specializationId, importance: 'critical' | 'preferred' | 'nice_to_have' }]

  // Preferences
  preferredTherapyModality: varchar('preferred_therapy_modality', { length: 20 }),
  schedulePreferences: jsonb('schedule_preferences'),
  // { preferredDays: ['Monday', 'Wednesday'], preferredTimes: ['morning'] }

  // Priority
  urgencyLevel: varchar('urgency_level', { length: 20 }).default('standard'),
  // urgent, high, standard, low

  assessmentDate: timestamp('assessment_date').defaultNow(),
  assessedBy: uuid('assessed_by').references(() => users.id),
  nextReassessment: date('next_reassessment'),
});
```

### 3.6 Appointments

```typescript
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  locationId: uuid('location_id').references(() => locations.id).notNull(),

  clientId: uuid('client_id').references(() => clients.id).notNull(),
  therapistId: uuid('therapist_id').references(() => therapists.id).notNull(),

  // Scheduling
  appointmentDate: date('appointment_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  duration: integer('duration').notNull(), // minutes

  // Type
  appointmentType: varchar('appointment_type', { length: 50 }).notNull(),
  // initial_assessment, regular_session, family_session, group_session

  // Location details
  roomNumber: varchar('room_number', { length: 20 }),

  // Status
  status: varchar('status', { length: 20 }).default('scheduled'),
  // scheduled, confirmed, checked_in, in_progress, completed, cancelled, no_show

  // Recurrence
  isRecurring: boolean('is_recurring').default(false),
  recurrencePattern: jsonb('recurrence_pattern'),
  // { frequency: 'weekly', interval: 1, daysOfWeek: [1, 3], endDate: '2025-12-31' }
  parentAppointmentId: uuid('parent_appointment_id').references(() => appointments.id),

  // Notifications
  reminderSent48h: boolean('reminder_sent_48h').default(false),
  reminderSent24h: boolean('reminder_sent_24h').default(false),
  reminderSent2h: boolean('reminder_sent_2h').default(false),

  // Cancellation
  cancelledAt: timestamp('cancelled_at'),
  cancelledBy: uuid('cancelled_by').references(() => users.id),
  cancellationReason: varchar('cancellation_reason', { length: 100 }),
  cancellationNote: text('cancellation_note'),

  // Session tracking
  checkInTime: timestamp('check_in_time'),
  checkOutTime: timestamp('check_out_time'),
  appointmentNotes: text('appointment_notes_encrypted'), // Encrypted

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
});

export const waitlist = pgTable('waitlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  clientId: uuid('client_id').references(() => clients.id).notNull(),
  therapistId: uuid('therapist_id').references(() => therapists.id).notNull(),

  preferredDates: jsonb('preferred_dates'),
  preferredTimes: jsonb('preferred_times'),
  priority: varchar('priority', { length: 20 }).default('standard'),

  addedAt: timestamp('added_at').defaultNow(),
  notifiedAt: timestamp('notified_at'),
  status: varchar('status', { length: 20 }).default('waiting'),
  // waiting, notified, scheduled, expired
});
```

### 3.7 Progress Notes & Documentation

```typescript
export const progressNotes = pgTable('progress_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  appointmentId: uuid('appointment_id').references(() => appointments.id).notNull(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  therapistId: uuid('therapist_id').references(() => therapists.id).notNull(),

  // SOAP Format (ALL ENCRYPTED)
  subjective: text('subjective_encrypted'),
  objective: text('objective_encrypted'),
  assessment: text('assessment_encrypted'),
  plan: text('plan_encrypted'),

  interventions: text('interventions_encrypted'),
  clientResponse: text('client_response_encrypted'),
  homework: text('homework_encrypted'),

  sessionDuration: integer('session_duration'), // minutes
  noteDate: date('note_date').notNull(),

  // Signatures
  signedBy: uuid('signed_by').references(() => users.id),
  signedAt: timestamp('signed_at'),
  digitalSignature: text('digital_signature'),
  isLocked: boolean('is_locked').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const treatmentPlans = pgTable('treatment_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  clientId: uuid('client_id').references(() => clients.id).notNull(),
  therapistId: uuid('therapist_id').references(() => therapists.id).notNull(),

  // Plan (ENCRYPTED)
  diagnosis: text('diagnosis_encrypted'),
  goals: text('goals_encrypted'),
  objectives: text('objectives_encrypted'),
  interventions: text('interventions_encrypted'),

  startDate: date('start_date').notNull(),
  reviewDate: date('review_date'),
  endDate: date('end_date'),

  status: varchar('status', { length: 20 }).default('active'),
  // draft, active, under_review, completed, discontinued

  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const consentForms = pgTable('consent_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),

  consentType: varchar('consent_type', { length: 50 }).notNull(),
  // hipaa_authorization, treatment_consent, telehealth_consent, photo_video_release
  version: varchar('version', { length: 20 }).notNull(),

  consentGiven: boolean('consent_given').notNull(),
  consentDate: date('consent_date').notNull(),
  expirationDate: date('expiration_date'),

  signedBy: varchar('signed_by', { length: 100 }),
  signerRelationship: varchar('signer_relationship', { length: 50 }),
  // self, parent, guardian, legal_representative
  digitalSignature: text('digital_signature'),
  ipAddress: varchar('ip_address', { length: 45 }),

  documentUrl: text('document_url'), // S3 key (encrypted)

  status: varchar('status', { length: 20 }).default('active'),
  // active, expired, withdrawn, superseded

  withdrawnAt: timestamp('withdrawn_at'),
  withdrawnBy: uuid('withdrawn_by').references(() => users.id),

  createdAt: timestamp('created_at').defaultNow(),
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  clientId: uuid('client_id').references(() => clients.id),

  documentType: varchar('document_type', { length: 50 }).notNull(),
  // assessment, referral, medical_record, insurance, consent, other

  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),

  // S3 storage
  s3Bucket: varchar('s3_bucket', { length: 100 }),
  s3Key: text('s3_key'), // Encrypted at rest in S3
  encryptionKeyId: varchar('encryption_key_id', { length: 100 }),

  description: text('description'),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  containsPHI: boolean('contains_phi').default(true),

  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft delete
});
```

### 3.8 Matching Outcomes

```typescript
export const matchOutcomes = pgTable('match_outcomes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  clientId: uuid('client_id').references(() => clients.id),
  therapistId: uuid('therapist_id').references(() => therapists.id),
  matchScore: integer('match_score'),

  // Tracking
  sessionCount: integer('session_count').default(0),
  clientSatisfaction: integer('client_satisfaction'), // 1-5
  therapistSatisfaction: integer('therapist_satisfaction'), // 1-5
  wasReassigned: boolean('was_reassigned').default(false),
  reassignmentReason: varchar('reassignment_reason', { length: 100 }),

  matchDate: date('match_date'),
  endDate: date('end_date'),

  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 4. Matching Algorithm Implementation

### 4.1 Algorithm Logic

```typescript
// services/matching.service.ts

type MatchFactors = {
  requiredSpecializations: Array<{
    specializationId: string;
    specializationName: string;
    importance: 'critical' | 'preferred' | 'nice_to_have';
  }>;
  communicationNeeds: string;
  ageGroup: string;
  preferredTimes: TimePreference[];
  urgency: 'urgent' | 'high' | 'standard' | 'low';
};

type TherapistScore = {
  therapistId: string;
  totalScore: number;
  breakdown: {
    specializationScore: number;
    communicationScore: number;
    availabilityScore: number;
    ageMatchScore: number;
    scheduleScore: number;
  };
  reasoning: string[];
};

export class MatchingService {
  private readonly WEIGHTS = {
    specialization: 0.40, // 40%
    communication: 0.30, // 30%
    availability: 0.15, // 15%
    ageMatch: 0.10, // 10%
    schedule: 0.05, // 5%
  };

  private readonly MIN_MATCH_THRESHOLD = 70;

  async calculateMatches(
    tenantId: string,
    clientNeeds: MatchFactors,
    availableTherapists: Therapist[]
  ): Promise<TherapistScore[]> {
    const scores: TherapistScore[] = [];

    for (const therapist of availableTherapists) {
      const score = await this.scoreTherapist(clientNeeds, therapist);

      if (score.totalScore >= this.MIN_MATCH_THRESHOLD) {
        scores.push(score);
      }
    }

    // Sort by total score descending, return top 5
    return scores.sort((a, b) => b.totalScore - a.totalScore).slice(0, 5);
  }

  private async scoreTherapist(
    needs: MatchFactors,
    therapist: Therapist
  ): Promise<TherapistScore> {
    const reasoning: string[] = [];

    // 1. Specialization Match (40%)
    const specScore = this.scoreSpecializations(
      needs.requiredSpecializations,
      therapist.specializations,
      reasoning
    );

    // 2. Communication Match (30%)
    const commScore = this.scoreCommunication(
      needs.communicationNeeds,
      therapist.communicationExpertise,
      reasoning
    );

    // 3. Availability/Caseload (15%)
    const availScore = this.scoreAvailability(
      therapist.currentCaseload,
      therapist.maxCaseload,
      reasoning
    );

    // 4. Age/Population Match (10%)
    const ageScore = this.scoreAgeMatch(
      needs.ageGroup,
      therapist.ageGroupExpertise,
      reasoning
    );

    // 5. Schedule Compatibility (5%)
    const schedScore = await this.scoreSchedule(
      needs.preferredTimes,
      therapist.availability,
      reasoning
    );

    const totalScore
      = specScore * this.WEIGHTS.specialization
        + commScore * this.WEIGHTS.communication
        + availScore * this.WEIGHTS.availability
        + ageScore * this.WEIGHTS.ageMatch
        + schedScore * this.WEIGHTS.schedule;

    return {
      therapistId: therapist.id,
      totalScore: Math.round(totalScore),
      breakdown: {
        specializationScore: specScore,
        communicationScore: commScore,
        availabilityScore: availScore,
        ageMatchScore: ageScore,
        scheduleScore: schedScore,
      },
      reasoning,
    };
  }

  private scoreSpecializations(
    required: MatchFactors['requiredSpecializations'],
    therapistSpecs: TherapistSpecialization[],
    reasoning: string[]
  ): number {
    if (required.length === 0) {
      return 100;
    }

    let totalWeight = 0;
    let weightedScore = 0;

    for (const req of required) {
      const weight = req.importance === 'critical'
        ? 3
        : req.importance === 'preferred' ? 2 : 1;
      totalWeight += weight;

      const match = therapistSpecs.find(
        ts => ts.specializationId === req.specializationId
      );

      if (match) {
        let score = 0;
        if (match.proficiencyLevel === 'expert') {
          score = 100;
          reasoning.push(`Expert in ${req.specializationName}`);
        } else if (match.proficiencyLevel === 'proficient') {
          score = 80;
          reasoning.push(`Proficient in ${req.specializationName}`);
        } else {
          score = 60;
          reasoning.push(`Familiar with ${req.specializationName}`);
        }
        weightedScore += score * weight;
      } else {
        reasoning.push(`No match for ${req.specializationName}`);
      }
    }

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  private scoreCommunication(
    clientNeeds: string,
    therapistExpertise: string[],
    reasoning: string[]
  ): number {
    if (!clientNeeds) {
      return 100;
    }

    if (therapistExpertise.includes(clientNeeds)) {
      reasoning.push(`Expertise in ${clientNeeds} communication`);
      return 100;
    }

    reasoning.push(`No ${clientNeeds} communication experience`);
    return 0;
  }

  private scoreAvailability(
    current: number,
    max: number,
    reasoning: string[]
  ): number {
    const utilizationRate = (current / max) * 100;

    if (utilizationRate < 80) {
      reasoning.push(`Available capacity (${100 - utilizationRate}% free)`);
      return 100;
    } else if (utilizationRate < 90) {
      reasoning.push(`Moderate capacity (${100 - utilizationRate}% free)`);
      return 70;
    } else if (utilizationRate < 100) {
      reasoning.push(`Limited capacity (${100 - utilizationRate}% free)`);
      return 30;
    }

    reasoning.push(`At full capacity`);
    return 0;
  }

  private scoreAgeMatch(
    clientAge: string,
    therapistExpertise: string[],
    reasoning: string[]
  ): number {
    if (therapistExpertise.includes(clientAge)) {
      reasoning.push(`Specializes in ${clientAge} age group`);
      return 100;
    }

    reasoning.push(`Limited experience with ${clientAge}`);
    return 30;
  }

  private async scoreSchedule(
    preferredTimes: TimePreference[],
    therapistAvailability: Availability,
    reasoning: string[]
  ): Promise<number> {
    if (!preferredTimes || preferredTimes.length === 0) {
      return 100;
    }

    const matchCount = preferredTimes.filter(pref =>
      this.isTimeAvailable(pref, therapistAvailability)
    ).length;

    const matchRate = (matchCount / preferredTimes.length) * 100;

    if (matchRate === 100) {
      reasoning.push(`All preferred times available`);
      return 100;
    } else if (matchRate >= 50) {
      reasoning.push(`Some preferred times available`);
      return 60;
    }

    reasoning.push(`Limited time overlap`);
    return 30;
  }

  private isTimeAvailable(pref: TimePreference, avail: Availability): boolean {
    // Implementation to check if specific time slot is available
    return true; // Placeholder
  }
}
```

---

## 5. Security Implementation

### 5.1 PHI Encryption Service

```typescript
// lib/encryption/phi-encryption.service.ts
import crypto from 'node:crypto';

export class PHIEncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits

  constructor(
    private masterKey: Buffer, // From AWS KMS
    private keyId: string
  ) {}

  encrypt(plaintext: string): string {
    if (!plaintext) {
      return '';
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: keyId:iv:authTag:ciphertext
    return `${this.keyId}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    if (!ciphertext) {
      return '';
    }

    const parts = ciphertext.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data');
    }

    const [keyId, ivHex, authTagHex, encrypted] = parts;

    if (keyId !== this.keyId) {
      throw new Error('Encryption key mismatch');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  hash(value: string): string {
    return crypto
      .createHmac('sha256', this.masterKey)
      .update(value)
      .digest('hex');
  }
}
```

### 5.2 Audit Logging Middleware

```typescript
// middleware/audit.middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLogs } from '@/models/audit.schema';

export async function auditMiddleware(
  req: NextRequest,
  handler: () => Promise<NextResponse>
) {
  const startTime = Date.now();
  const tenantId = req.headers.get('x-tenant-id');
  const userId = req.headers.get('x-user-id');
  const action = req.method;
  const resource = extractResource(req.url);
  const resourceId = extractResourceId(req.url);

  try {
    const response = await handler();

    // Log successful actions
    await db.insert(auditLogs).values({
      tenantId,
      userId,
      action: mapMethodToAction(action),
      resource,
      resourceId,
      ipAddress: req.ip || req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
      phiAccessed: isPhiResource(resource),
      timestamp: new Date(),
    });

    return response;
  } catch (error) {
    // Log failed attempts
    await db.insert(auditLogs).values({
      tenantId,
      userId,
      action: mapMethodToAction(action),
      resource,
      resourceId,
      ipAddress: req.ip || req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
      phiAccessed: false,
      timestamp: new Date(),
    });

    throw error;
  }
}

function isPhiResource(resource: string): boolean {
  const phiResources = ['clients', 'appointments', 'notes', 'documents'];
  return phiResources.some(r => resource.includes(r));
}
```

### 5.3 RBAC Middleware

```typescript
// middleware/rbac.middleware.ts
import { NextRequest, NextResponse } from 'next/server';

type Role = 'admin' | 'therapist' | 'billing' | 'receptionist';

type Permission = {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  scope?: 'all' | 'own' | 'limited';
};

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    { resource: '*', action: 'create', scope: 'all' },
    { resource: '*', action: 'read', scope: 'all' },
    { resource: '*', action: 'update', scope: 'all' },
    { resource: '*', action: 'delete', scope: 'all' },
  ],
  therapist: [
    { resource: 'clients', action: 'read', scope: 'own' },
    { resource: 'clients', action: 'update', scope: 'own' },
    { resource: 'appointments', action: 'read', scope: 'own' },
    { resource: 'appointments', action: 'update', scope: 'own' },
    { resource: 'notes', action: 'create', scope: 'own' },
    { resource: 'notes', action: 'read', scope: 'own' },
  ],
  receptionist: [
    { resource: 'clients', action: 'create', scope: 'all' },
    { resource: 'clients', action: 'read', scope: 'limited' },
    { resource: 'appointments', action: 'create', scope: 'all' },
    { resource: 'appointments', action: 'read', scope: 'all' },
    { resource: 'appointments', action: 'update', scope: 'all' },
  ],
  billing: [
    { resource: 'clients', action: 'read', scope: 'limited' },
    { resource: 'billing', action: 'create', scope: 'all' },
    { resource: 'billing', action: 'read', scope: 'all' },
  ],
};

export function checkPermission(
  userRole: Role,
  resource: string,
  action: Permission['action'],
  resourceOwnerId?: string,
  userId?: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];

  const match = permissions.find(
    p =>
      (p.resource === resource || p.resource === '*')
      && (p.action === action || p.resource === '*')
  );

  if (!match) {
    return false;
  }

  if (match.scope === 'all') {
    return true;
  }
  if (match.scope === 'own') {
    return resourceOwnerId === userId;
  }
  if (match.scope === 'limited') {
    return true;
  }

  return false;
}
```

---

## 6. Implementation Phases

### PHASE 1: Foundation & Infrastructure (Months 1-2)

**Sprint 1 (Weeks 1-2): Project Setup**

**Issue #1: Clone and Initialize Boilerplate**
- Clone ixartz boilerplate
- Remove Clerk dependencies
- Update package.json
- Configure TypeScript paths
- Set up ESLint/Prettier
- Initialize git repo

**Issue #2: Configure PostgreSQL**
- Provision AWS RDS PostgreSQL (db.r6g.large, Multi-AZ)
- Enable encryption at rest
- Configure automated backups (30-day retention)
- Set up connection pooling (RDS Proxy)
- Configure SSL/TLS connections
- Test disaster recovery

**Sprint 2 (Weeks 3-4): Authentication**

**Issue #3: Set Up Keycloak**
- Deploy Keycloak on AWS ECS Fargate
- Configure therapy-clinic realm
- Set up SAML 2.0 / OIDC
- Enable MFA (TOTP)
- Configure session timeout (15 min)
- Set password policies (12+ chars, complexity)
- Add tenant custom attributes

**Issue #4: Keycloak Integration**
- Install keycloak-js client
- Build auth provider wrapper
- Implement login/logout flows
- Add MFA enrollment UI
- Create session management with Redis
- Build protected route middleware
- Extract tenant context from JWT

**Deliverables:**
- Next.js app with Keycloak auth
- AWS RDS PostgreSQL provisioned
- Development environment docs

---

### PHASE 2: Multi-Tenancy & Core Models (Months 2-3)

**Sprint 3 (Weeks 5-6): Multi-Tenant Schema**

**NEW Issue: Multi-Tenancy Foundation**
- Design tenant + location schemas
- Implement tenant middleware (context injection)
- Create PostgreSQL RLS policies
- Build tenant provisioning service
- Add tenant switcher UI (admin only)
- Test tenant isolation

**Issue #5: Drizzle Schema Conversion**
- Create all table schemas (see Section 3)
- Add tenant_id to all tables
- Set up Drizzle migration system
- Create initial migration
- Add encryption helpers for PHI

**Issue #6: Client & Therapist Models**
- Implement client schema (encrypted fields)
- Implement therapist schema
- Create specialization taxonomy seed data
- Build therapist-specialization junction

**Sprint 4 (Weeks 7-8): Supporting Models**

**Issue #7: Scheduling Models**
- Implement appointment schema
- Create waitlist schema
- Build recurrence pattern support
- Add appointment indexes

**Issue #8: Audit & Security Models**
- Implement audit log schema
- Create consent management schema
- Build document storage schema
- Add match outcomes tracking

**Issue #9: PHI Encryption Layer**
- Build encryption service (AES-256-GCM)
- Integrate with AWS KMS
- Implement field-level encryption helpers
- Create decryption utilities
- Set up key rotation strategy
- Test encryption/decryption

**Deliverables:**
- Complete multi-tenant database
- Encryption service functional
- Seed data for specializations
- Database documentation

---

### PHASE 3: RBAC & Security (Month 3)

**Sprint 5 (Weeks 9-10): Auth & RBAC**

**Issue #10: Keycloak Auth Hooks**
- Build server-side auth middleware
- Implement JWT validation
- Create session refresh mechanism
- Add automatic session timeout
- Handle token expiration

**Issue #11: Role-Based Middleware**
- Define roles in Keycloak
- Build RBAC middleware
- Implement permission checking
- Create role-based UI components
- Add route guards

**Sprint 6 (Weeks 11-12): Security Features**

**Issue #12: Audit Logging**
- Build audit middleware
- Implement PHI access tracking
- Create audit log viewer (admin)
- Add failed login tracking
- Build audit reports

**Issue #13: Account Lockout**
- Implement failed login counter (Redis)
- Build lockout mechanism (5 attempts)
- Create unlock workflow (admin)
- Add suspicious activity alerts
- Implement IP-based rate limiting

**Deliverables:**
- Complete auth with MFA
- RBAC fully functional
- Comprehensive audit logging
- Security testing passed

---

### PHASE 4: Core Features (Months 4-6)

**Sprint 7-8 (Weeks 13-16): Profile Management**

**Issue #14: Specialization Management (Admin)**
- Build specialization CRUD UI
- Implement category system
- Add search/filter
- Create bulk import (CSV)
- Build specialization analytics

**Issue #15: Therapist Profile Management**
- Build therapist profile forms
- Implement specialization assignment UI
- Create availability calendar setup
- Add license tracking + expiration alerts
- Build therapist directory view
- Add photo upload

**Issue #16: Client Profile Management**
- Build client intake forms (multi-step wizard)
- Implement needs assessment form
- Create client profile view (encrypted data display)
- Add document upload (S3)
- Build client search/filter
- Create client timeline view

**Issue #17: Matching Algorithm**
- Implement weighted scoring (see Section 4)
- Build match calculation service
- Create match recommendation UI (top 5)
- Add manual override with justification
- Implement match quality tracking
- Build match analytics

**Sprint 9-10 (Weeks 17-20): Scheduling System**

**Issue #18: Appointment Scheduling**
- Integrate FullCalendar component
- Build availability checking service
- Create appointment booking flow
- Add conflict detection
- Implement recurring appointments
- Build drag-and-drop rescheduling
- Add multi-location support

**Issue #19: Therapist View**
- Build therapist dashboard
- Create therapist calendar view
- Implement appointment management
- Add client quick-view modal
- Build schedule preferences UI
- Create PTO/vacation blocking

**Issue #20: Session Notes**
- Build SOAP note templates
- Implement note creation/editing
- Add digital signature
- Create note locking (after signature)
- Build note history view
- Add voice-to-text (future)

**Issue #21: Admin Dashboard**
- Build main dashboard UI
- Create appointment overview widget
- Add therapist utilization metrics
- Implement pending matches widget
- Build quick action buttons
- Add real-time notifications

**Deliverables:**
- Full client/therapist management
- Working matching algorithm
- Complete scheduling system
- Session documentation
- Admin operational dashboard

---

### PHASE 5: Notifications & Enhancements (Month 7)

**Sprint 11-12 (Weeks 21-24): Communication**

**NEW Issue: Notification Service**
- Build notification service abstraction
- Integrate SendGrid (BAA required)
- Set up email templates
- Implement notification queue (Redis)
- Add notification preferences
- Build notification logs

**NEW Issue: SMS Reminders**
- Integrate Twilio (BAA required)
- Implement reminder scheduler (48h/24h/2h)
- Create SMS templates
- Add opt-out management
- Build reminder logs
- Test reminder timing

**NEW Issue: Waitlist Management**
- Build waitlist UI
- Implement auto-matching when slots open
- Create waitlist notification system
- Add priority handling
- Build waitlist analytics

**NEW Issue: Cancellation & Rescheduling**
- Build cancellation workflow
- Implement 24h policy enforcement
- Create rescheduling UI with suggestions
- Add no-show tracking
- Build cancellation analytics
- Implement late cancellation fees (future)

**NEW Issue: Internal Messaging**
- Build HIPAA-compliant messaging system
- Implement conversation threading
- Add file attachments (encrypted in S3)
- Create urgent message flagging
- Build notification integration
- Add read receipts

**Deliverables:**
- Automated email/SMS notifications
- Waitlist system operational
- Cancellation workflows
- Internal messaging

---

### PHASE 6: Compliance & Hardening (Months 8-9)

**Sprint 13 (Weeks 25-26): Compliance**

**Issue #22: Comprehensive Audit Trail**
- Enhance audit log completeness
- Build audit report generator
- Create PHI access reports
- Implement log retention policy (7 years)
- Add compliance dashboard
- Build breach detection alerts

**Issue #23: Data Encryption Verification**
- Audit all PHI field encryption
- Verify S3 bucket encryption
- Test key rotation
- Document encryption strategy
- Create encryption compliance report
- Test data at rest encryption

**Sprint 14 (Weeks 27-28): Security Hardening**

**Issue #24: Access Controls**
- Implement IP whitelisting (optional)
- Add device fingerprinting
- Build suspicious activity detection
- Create security incident logging
- Implement CSP headers
- Add CORS configuration

**Issue #25: HIPAA Documentation**
- Create HIPAA compliance documentation
- Document security policies
- Build BAA templates
- Create incident response plan
- Write backup/DR procedures
- Prepare training materials
- Build compliance checklist

**NEW Issue: Consent Management**
- Build consent form workflow
- Implement version control
- Create consent tracking dashboard
- Add expiration notifications
- Build withdrawal process
- Create consent templates

**NEW Issue: Security Audit**
- Conduct internal security review
- Hire third-party pen testing
- Fix identified vulnerabilities
- Create security audit report
- Implement recommendations
- Retest critical findings

**Deliverables:**
- HIPAA compliance ready
- Complete security documentation
- Pen testing report
- Training materials
- Consent management system

---

### PHASE 7: PWA & Optimization (Month 10)

**Sprint 15-16 (Weeks 29-32): PWA & Performance**

**NEW Issue: PWA Implementation**
- Configure Workbox service workers
- Create app manifest
- Implement offline caching (read-only)
- Add push notifications
- Build install prompts
- Test offline functionality

**NEW Issue: Performance Optimization**
- Implement code splitting
- Add lazy loading for routes
- Optimize database queries (indexes)
- Set up Redis caching layer
- Add query result caching
- Conduct performance testing
- Optimize images (Next.js Image)

**NEW Issue: Reporting & Analytics**
- Build custom report builder
- Create standard reports:
  - Therapist utilization
  - Appointment attendance
  - Client demographics (de-identified)
  - Matching effectiveness
  - Cancellation patterns
- Add export (PDF, CSV)
- Implement de-identification
- Build scheduled reports

**NEW Issue: Treatment Plans**
- Build treatment plan templates
- Implement goal tracking
- Create progress visualization
- Add outcome measurement
- Build review/approval workflow
- Create goal achievement reports

**Deliverables:**
- PWA fully functional
- Performance optimized (<2s)
- Comprehensive reporting
- Treatment plan system

---

### PHASE 8: Testing & Launch (Months 11-12)

**Sprint 17-18 (Weeks 33-36): Testing**

**NEW Issue: Unit & Integration Testing**
- Write service tests (80%+ coverage)
- Create integration tests
- Add E2E tests (Playwright)
- Implement security tests
- Run load testing (JMeter)
- Fix identified issues

**NEW Issue: UAT**
- Recruit beta testers (3-5 therapists)
- Create UAT scenarios
- Conduct usability testing
- Gather feedback
- Iterate on UX issues
- Document known issues

**Sprint 19-20 (Weeks 37-40): Migration & Training**

**NEW Issue: Data Migration**
- Extract data from current system
- Clean and validate data
- Build migration scripts
- Test in staging
- Execute production migration
- Verify data integrity

**NEW Issue: Training Program**
- Create user documentation
- Build video tutorials
- Conduct live training (2 sessions)
- Create quick reference guides
- Set up support ticketing
- Build FAQ

**NEW Issue: Launch Prep**
- Set up production AWS infrastructure
- Configure CloudWatch monitoring
- Set up PagerDuty alerts
- Create runbooks
- Conduct DR drill
- Finalize go-live checklist

**Sprint 21-22 (Weeks 41-44): Launch**

**NEW Issue: Soft Launch**
- Deploy to production
- Monitor system closely (24/7 first week)
- Provide on-site support
- Track critical metrics
- Address urgent issues
- Collect feedback

**NEW Issue: Post-Launch Optimization**
- Analyze usage patterns
- Optimize based on data
- Refine matching algorithm
- Adjust notification timing
- Fine-tune performance
- Build optimization roadmap

**Deliverables:**
- All tests passing
- Production live
- Staff trained
- Data migrated
- Support system active

---

## 7. AWS Infrastructure

### 7.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Route 53 (DNS)                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                    CloudFront (CDN)                          │
│  - Static assets caching                                     │
│  - SSL/TLS termination                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              Application Load Balancer                       │
│  - Health checks                                             │
│  - SSL termination                                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              ECS Fargate (Next.js App)                       │
│  - Auto-scaling (2-10 tasks)                                 │
│  - Container: Node.js 22 + Next.js 16                        │
└─────┬───────────────────────────┬───────────────────────────┘
      │                           │
      │                           │
┌─────▼─────────┐   ┌─────────────▼──────┐   ┌───────────────┐
│  RDS Postgres │   │  ElastiCache Redis │   │   S3 Bucket   │
│  Multi-AZ     │   │  (Sessions)        │   │  (Documents)  │
│  Encrypted    │   │  cache.r6g.large   │   │  Encrypted    │
└─────┬─────────┘   └────────────────────┘   └───────┬───────┘
      │                                                │
┌─────▼─────────────────────────────────────────────┬─▼───────┐
│                  AWS KMS                           │         │
│  - Master encryption keys                          │         │
│  - Key rotation                                    │         │
└────────────────────────────────────────────────────┴─────────┘

┌────────────────────────────────────────────────────────────┐
│              Keycloak (ECS Fargate)                         │
│  - Separate task from main app                              │
│  - Own database (RDS)                                       │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                  Monitoring                                 │
│  - CloudWatch (logs, metrics)                               │
│  - CloudTrail (audit logs)                                  │
│  - Sentry (error tracking)                                  │
│  - PagerDuty (alerts)                                       │
└────────────────────────────────────────────────────────────┘
```

### 7.2 Infrastructure as Code (Terraform)

```hcl
# infrastructure/terraform/main.tf

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "therapy-clinic-vpc"
    Environment = var.environment
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier        = "therapy-clinic-db"
  engine            = "postgres"
  engine_version    = "15.5"
  instance_class    = "db.r6g.large"
  allocated_storage = 100

  db_name  = "therapy_clinic"
  username = var.db_username
  password = var.db_password

  multi_az               = true
  storage_encrypted      = true
  kms_key_id            = aws_kms_key.rds.arn
  backup_retention_period = 30
  backup_window          = "03:00-04:00"

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name        = "therapy-clinic-db"
    Environment = var.environment
    HIPAA       = "compliant"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "therapy-clinic-redis"
  engine               = "redis"
  node_type            = "cache.r6g.large"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379

  security_group_ids = [aws_security_group.redis.id]
  subnet_group_name  = aws_elasticache_subnet_group.main.name

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = {
    Name        = "therapy-clinic-redis"
    Environment = var.environment
  }
}

# S3 Bucket (PHI Documents)
resource "aws_s3_bucket" "documents" {
  bucket = "therapy-clinic-phi-documents-${var.environment}"

  tags = {
    Name        = "therapy-clinic-documents"
    Environment = var.environment
    HIPAA       = "compliant"
  }
}

resource "aws_s3_bucket_encryption" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# KMS Keys
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "therapy-clinic-rds-key"
  }
}

resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "therapy-clinic-s3-key"
  }
}

resource "aws_kms_key" "phi" {
  description             = "KMS key for PHI field encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "therapy-clinic-phi-key"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "therapy-clinic-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "therapy-clinic-cluster"
    Environment = var.environment
  }
}

# ECS Task Definition (Next.js App)
resource "aws_ecs_task_definition" "app" {
  family                   = "therapy-clinic-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "app"
    image = "${var.ecr_repository_url}:${var.image_tag}"

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "DATABASE_URL", value = "postgresql://..." },
      { name = "REDIS_URL", value = "redis://..." }
    ]

    secrets = [
      {
        name      = "KEYCLOAK_CLIENT_SECRET"
        valueFrom = aws_secretsmanager_secret.keycloak_secret.arn
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.app.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "app"
      }
    }
  }])
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "therapy-clinic-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.https]
}

# Auto Scaling
resource "aws_appautoscaling_target" "app" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.app.resource_id
  scalable_dimension = aws_appautoscaling_target.app.scalable_dimension
  service_namespace  = aws_appautoscaling_target.app.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 70.0

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
```

### 7.3 Cost Estimate (Monthly)

| Service | Configuration | Cost |
|---------|--------------|------|
| ECS Fargate (App) | 2-10 tasks, 1 vCPU, 2GB RAM | $70-350 |
| ECS Fargate (Keycloak) | 1-2 tasks, 1 vCPU, 2GB RAM | $35-70 |
| RDS PostgreSQL | db.r6g.large, Multi-AZ | $400-500 |
| ElastiCache Redis | cache.r6g.large | $200-250 |
| S3 | 100GB storage, 10K requests | $5-10 |
| CloudFront | 500GB transfer | $40-60 |
| KMS | 3 keys, 10K requests | $5 |
| CloudWatch | Logs, metrics | $20-40 |
| ALB | 1 load balancer | $20-25 |
| Data Transfer | 500GB out | $45-50 |
| Backups & Snapshots | RDS, S3 versioning | $50-100 |
| **Total** | | **$890-1,460/month** |

**Annual:** $10,680-17,520

**Additional Costs:**
- SendGrid (50K emails/month): $20-50/month
- Twilio SMS (1000 msgs/month): $15-30/month
- Sentry (100K events/month): $50/month
- **Total 3rd Party:** $85-130/month

**Grand Total:** $975-1,590/month ($11,700-19,080/year)

---

## 8. Testing Strategy

### 8.1 Unit Tests (Vitest)

**Coverage Target:** 80%+

```typescript
// tests/unit/services/matching.service.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { MatchingService } from '@/services/matching.service';

describe('MatchingService', () => {
  let service: MatchingService;

  beforeEach(() => {
    service = new MatchingService();
  });

  it('should return therapists with score >= 70', async () => {
    const clientNeeds = {
      requiredSpecializations: [
        { specializationId: '1', specializationName: 'ABA', importance: 'critical' }
      ],
      communicationNeeds: 'non-verbal',
      ageGroup: 'early_childhood',
      preferredTimes: [],
      urgency: 'standard',
    };

    const therapists = [createMockTherapist({ /* ... */ })];
    const matches = await service.calculateMatches('tenant-1', clientNeeds, therapists);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].totalScore).toBeGreaterThanOrEqual(70);
  });
});
```

### 8.2 Integration Tests

```typescript
// tests/integration/appointment-booking.test.ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Appointment Booking Flow', () => {
  beforeAll(async () => {
    await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it('should book appointment with tenant isolation', async () => {
    const client = await createTestClient({ tenantId: 'tenant-1' });
    const matches = await matchClient(client.id);

    const appointment = await bookAppointment({
      tenantId: 'tenant-1',
      clientId: client.id,
      therapistId: matches[0].therapistId,
      date: '2025-01-15',
      startTime: '10:00',
      duration: 60,
    });

    expect(appointment.status).toBe('scheduled');
    expect(appointment.tenantId).toBe('tenant-1');
  });

  it('should prevent cross-tenant data access', async () => {
    const client = await createTestClient({ tenantId: 'tenant-1' });

    await expect(
      getClient(client.id, 'tenant-2')
    ).rejects.toThrow('Not found');
  });
});
```

### 8.3 E2E Tests (Playwright)

```typescript
// tests/e2e/client-intake.spec.ts
import { expect, test } from '@playwright/test';

test.describe('Client Intake Flow', () => {
  test('admin can complete full client intake', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@tenant1.test');
    await page.fill('[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/admin/dashboard');

    // Navigate to new client
    await page.click('text=New Client');

    // Fill basic info
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.fill('[name="dateOfBirth"]', '2015-03-15');
    await page.click('button:has-text("Next")');

    // Needs assessment
    await page.check('[value="non-verbal"]');
    await page.check('[value="ABA"]');
    await page.click('button:has-text("Next")');

    // View matches
    await page.click('button:has-text("Find Matches")');

    await expect(page.locator('.match-card')).toHaveCount.greaterThan(0);

    // Select therapist
    await page.click('.match-card:first-child button:has-text("Select")');

    await expect(page.locator('text=John Doe')).toBeVisible();
  });
});
```

---

## 9. Timeline & Milestones

### 9.1 Gantt Chart (Simplified)

```
Month 1-2: Foundation ████████
Month 2-3: Multi-Tenancy & Models ████████
Month 3: RBAC & Security ████
Month 4-6: Core Features ████████████
Month 7: Notifications ████
Month 8-9: Compliance ████████
Month 10: PWA & Optimization ████
Month 11-12: Testing & Launch ████████
```

### 9.2 Key Milestones

- **M1 (Week 4):** Auth working, DB provisioned
- **M2 (Week 8):** Multi-tenant schema complete
- **M3 (Week 12):** RBAC + audit logging functional
- **M4 (Week 20):** Core features (matching, scheduling) complete
- **M5 (Week 24):** Notifications operational
- **M6 (Week 28):** HIPAA compliance ready
- **M7 (Week 32):** PWA + reporting done
- **M8 (Week 44):** Production launch

### 9.3 Critical Path

1. Keycloak setup → Multi-tenancy → RBAC → All features
2. Database schema → Encryption → All features
3. Matching algorithm → Client intake → Scheduling
4. Scheduling → Appointments → Notes

---

## 10. Team Structure

### 10.1 Roles & Responsibilities

**Senior Full-Stack Developer (Lead):**
- Architecture decisions
- Keycloak integration
- Multi-tenancy implementation
- Code reviews
- Security implementation

**Mid-Level Developer #1:**
- Client/therapist management
- Matching algorithm
- Admin dashboard
- Testing

**Mid-Level Developer #2:**
- Scheduling system
- Appointment management
- Calendar integration
- Notifications

**DevOps Engineer (50%):**
- AWS infrastructure (Terraform)
- CI/CD pipelines
- Monitoring setup
- Security hardening

**QA Engineer:**
- Test strategy
- E2E tests (Playwright)
- UAT coordination
- Bug tracking

**UX/UI Designer (25%):**
- UI/UX design
- Component design (Storybook)
- User flows
- Accessibility

**Security Consultant (Contractor):**
- HIPAA compliance review
- Penetration testing
- Security audit
- Recommendations

---

## 11. Risk Management

### 11.1 Top Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Multi-tenancy bugs (data leak) | Critical | Medium | Early RLS testing, audit all queries, security review |
| Keycloak learning curve | High | High | POC in Phase 1, consultant, documentation |
| Matching algorithm inaccuracy | Medium | Medium | Pilot test, feedback loops, manual override |
| AWS cost overruns | Medium | Low | Cost monitoring, budget alerts, right-sizing |
| Staff adoption issues | High | Medium | Involve in design, training, support |
| Security breach | Critical | Low | Pen testing, encryption, audit logs, insurance |

### 11.2 Mitigation Strategies

**Multi-Tenancy Data Isolation:**
- Automated RLS policy testing
- Query auditing (ensure all include tenant_id)
- Integration tests for cross-tenant access
- Code review checklist

**Keycloak Complexity:**
- Week 1: POC with basic auth
- Week 2: MFA + tenant attributes
- Consultant on retainer
- Comprehensive documentation

**Performance:**
- Load testing before launch
- Database query optimization
- Redis caching strategy
- Auto-scaling configuration

---

## 12. Success Metrics & KPIs

### 12.1 Technical Metrics

- **Page Load Time:** <2 seconds (95th percentile)
- **API Response Time:** <500ms (95th percentile)
- **Uptime:** 99.5%+
- **Test Coverage:** 80%+
- **Security Score:** A+ (Mozilla Observatory)
- **Accessibility:** WCAG 2.1 AA compliant

### 12.2 Business Metrics

- **Match Time:** <5 minutes (new client → matched therapist)
- **Scheduling Time:** <2 minutes per appointment
- **Therapist Utilization:** 85%+
- **Match Accuracy:** 95%+ (no reassignment needed)
- **Admin Time Savings:** 10+ hours/week
- **No-Show Rate:** <10%

### 12.3 Compliance Metrics

- **HIPAA Violations:** 0
- **Audit Log Completeness:** 100%
- **Security Incidents:** 0
- **Staff Training Completion:** 100%

---

## 13. Post-Launch Roadmap

### Phase 9: Client Portal (Months 13-15)

- Client self-service portal
- Appointment requests
- Secure messaging with therapist
- Pre-session questionnaires
- Access to session summaries
- Payment portal

### Phase 10: Advanced Features (Months 16-18)

- Group therapy scheduling
- Outcome measurement tools
- Client satisfaction surveys
- Referral management
- Insurance claims submission
- Telehealth integration (Zoom/Doxy.me)

### Phase 11: Analytics & ML (Months 19-21)

- Machine learning for match optimization
- Predictive analytics (no-show risk)
- Therapist burnout indicators
- Client outcome prediction
- Advanced business intelligence

### Phase 12: Multi-Location Enhancements (Months 22-24)

- Cross-location scheduling
- Resource sharing
- Multi-location reporting
- Franchising support
- White-label options

---

## 14. Appendices

### Appendix A: Tech Stack Summary

**Frontend:**
- Next.js 16, React 19, TypeScript
- Tailwind CSS 4
- React Hook Form + Zod
- FullCalendar

**Backend:**
- Next.js API Routes
- Drizzle ORM + PostgreSQL
- Redis (sessions, caching)
- Keycloak (auth)

**Infrastructure:**
- AWS ECS Fargate
- AWS RDS PostgreSQL
- AWS ElastiCache Redis
- AWS S3, KMS, CloudWatch

**Third-Party:**
- SendGrid (email)
- Twilio (SMS)
- Sentry (errors)
- Arcjet (WAF)

### Appendix B: Folder Structure

```
therapy-clinic-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes
│   │   ├── (dashboard)/       # Protected routes
│   │   │   ├── admin/
│   │   │   │   ├── clients/
│   │   │   │   ├── therapists/
│   │   │   │   ├── appointments/
│   │   │   │   └── reports/
│   │   │   └── therapist/
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── clients/
│   │   ├── therapists/
│   │   ├── scheduling/
│   │   └── ui/
│   ├── lib/
│   │   ├── keycloak/
│   │   ├── encryption/
│   │   ├── audit/
│   │   └── matching/
│   ├── services/
│   ├── models/                # Drizzle schemas
│   ├── middleware/
│   ├── utils/
│   └── validations/
├── infrastructure/
│   └── terraform/
├── migrations/
├── tests/
├── docs/
└── public/
```

### Appendix C: Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL="redis://..."

# Keycloak
KEYCLOAK_URL="https://auth.therapy-clinic.com"
KEYCLOAK_REALM="therapy-clinic"
KEYCLOAK_CLIENT_ID="therapy-clinic-app"
KEYCLOAK_CLIENT_SECRET="xxx"

# AWS
AWS_REGION="us-east-1"
AWS_S3_BUCKET="therapy-clinic-phi-documents"
AWS_KMS_KEY_ID="xxx"

# Encryption
ENCRYPTION_MASTER_KEY="xxx" # From KMS

# Notifications
SENDGRID_API_KEY="xxx"
TWILIO_ACCOUNT_SID="xxx"
TWILIO_AUTH_TOKEN="xxx"
TWILIO_PHONE_NUMBER="+1xxx"

# Monitoring
SENTRY_DSN="xxx"
SENTRY_HIPAA_MODE="true"

# Feature Flags
ENABLE_CLIENT_PORTAL="false"
ENABLE_BILLING="false"
```

---

**End of Implementation Plan**

**Next Actions:**
1. ✅ Create this document
2. Update CLAUDE.md
3. Create multi-tenancy issues
4. Update existing GitHub issues
5. Begin Sprint 1
