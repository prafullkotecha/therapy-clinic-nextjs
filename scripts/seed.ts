/**
 * Database Seed Script
 *
 * Populates the database with realistic demo data for development and testing.
 *
 * Usage:
 *   npm run db:seed              # Seed the database
 *   npm run db:seed -- --force   # Skip confirmation prompt
 *
 * This script is idempotent - it clears existing data before seeding.
 */

import type { PHIEncryptionService } from '@/lib/encryption';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';
import { getEncryptionService } from '@/lib/encryption';
import { db } from '@/libs/DB';

import { appointments } from '@/models/appointment.schema';
import { clientNeeds, clients } from '@/models/client.schema';
import { specializations } from '@/models/specialization.schema';
// Import all schemas
import { locations, tenants } from '@/models/tenant.schema';
import { therapists, therapistSpecializations } from '@/models/therapist.schema';
// Import types
import {
  AgeGroup,
  AppointmentStatus,
  AppointmentType,
  ClientStatus,
  CommunicationNeeds,
  ProficiencyLevel,
  SpecializationCategory,
  UrgencyLevel,
  UserRole,
} from '@/models/types';

import { users } from '@/models/user.schema';

/**
 * Main seed function
 */
async function seed(): Promise<void> {
  console.log('🌱 Starting database seed...\n');

  // Initialize encryption service
  console.log('🔐 Initializing encryption service...');
  const encryption = await getEncryptionService();
  console.log('✅ Encryption service initialized\n');

  // Clear existing data (in reverse dependency order)
  await clearDatabase();

  // Seed data in dependency order
  const tenantId = await seedTenant();
  const locationIds = await seedLocations(tenantId);
  const specializationIds = await seedSpecializations(tenantId);
  const userIds = await seedUsers(tenantId, locationIds);
  const therapistIds = await seedTherapists(
    tenantId,
    userIds,
    locationIds,
  );
  await seedTherapistSpecializations(therapistIds, specializationIds);
  const clientIds = await seedClients(
    tenantId,
    locationIds,
    therapistIds,
    encryption,
  );
  await seedClientNeeds(clientIds, specializationIds, encryption, tenantId);
  await seedAppointments(
    tenantId,
    locationIds,
    clientIds,
    therapistIds,
    userIds,
  );

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - 1 tenant (clinic organization)`);
  console.log(`  - ${locationIds.length} locations`);
  console.log(`  - ${Object.keys(specializationIds).length} specializations`);
  console.log(`  - ${Object.keys(userIds).length} users`);
  console.log(`  - ${therapistIds.length} therapists`);
  console.log(`  - ${clientIds.length} clients`);
  console.log(`  - Appointments created`);

  console.log('\n👥 Demo Accounts:');
  console.log('  Admin:');
  console.log('    - Email: admin@brightfutures.test');
  console.log('    - Keycloak ID: (fake UUID for dev)');
  console.log('  Therapists:');
  console.log('    - dr.sarah.johnson@brightfutures.test (ABA/Autism)');
  console.log('    - michael.chen@brightfutures.test (CBT/Anxiety)');
  console.log('    - emma.rodriguez@brightfutures.test (Trauma/EMDR)');
  console.log('  Billing:');
  console.log('    - lisa.anderson@brightfutures.test');
  console.log('  Receptionist:');
  console.log('    - james.wilson@brightfutures.test\n');

  process.exit(0);
}

/**
 * Clear all data from database
 */
async function clearDatabase(): Promise<void> {
  const shouldContinue = process.argv.includes('--force')
    || (await confirm('⚠️  This will DELETE all existing data. Continue? (y/N): '));

  if (!shouldContinue) {
    console.log('❌ Seed cancelled');
    process.exit(0);
  }

  console.log('🗑️  Clearing existing data...');

  // Delete in reverse dependency order
  await db.delete(appointments);
  await db.delete(clientNeeds);
  await db.delete(clients);
  await db.delete(therapistSpecializations);
  await db.delete(therapists);
  await db.delete(specializations);
  await db.delete(users);
  await db.delete(locations);
  await db.delete(tenants);

  console.log('✅ Database cleared\n');
}

/**
 * Seed tenant (clinic organization)
 */
async function seedTenant(): Promise<string> {
  console.log('🏥 Seeding tenant...');

  const result = await db
    .insert(tenants)
    .values({
      name: 'Bright Futures Therapy',
      slug: 'bright-futures',
      timezone: 'America/New_York',
      locale: 'en-US',
      primaryColor: '#10B981', // Green
      plan: 'professional',
      status: 'active',
      maxLocations: 10,
      maxTherapists: 50,
      maxActiveClients: 500,
      billingEmail: 'billing@brightfutures.test',
      subscriptionStart: '2024-01-01',
      subscriptionEnd: '2025-12-31',
    })
    .returning({ id: tenants.id });

  const tenant = result[0];
  if (!tenant) {
    throw new Error('Failed to create tenant');
  }

  console.log(`✅ Tenant created: ${tenant.id}\n`);
  return tenant.id;
}

/**
 * Seed locations
 */
async function seedLocations(tenantId: string): Promise<string[]> {
  console.log('📍 Seeding locations...');

  const locationData = [
    {
      tenantId,
      name: 'Main Office',
      address: '123 Therapy Lane',
      city: 'Boston',
      state: 'MA',
      zipCode: '02101',
      phone: '(617) 555-0100',
      email: 'main@brightfutures.test',
      isPrimary: true,
      isActive: true,
      operatingHours: {
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '17:00' },
        saturday: { open: '09:00', close: '13:00' },
        sunday: { open: null, close: null },
      },
    },
    {
      tenantId,
      name: 'Satellite Office - Cambridge',
      address: '456 Harvard Street',
      city: 'Cambridge',
      state: 'MA',
      zipCode: '02138',
      phone: '(617) 555-0200',
      email: 'cambridge@brightfutures.test',
      isPrimary: false,
      isActive: true,
      operatingHours: {
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '17:00' },
        friday: { open: '09:00', close: '16:00' },
        saturday: { open: null, close: null },
        sunday: { open: null, close: null },
      },
    },
  ];

  const insertedLocations = await db
    .insert(locations)
    .values(locationData)
    .returning({ id: locations.id });

  const locationIds = insertedLocations.map(l => l.id);
  console.log(`✅ ${locationIds.length} locations created\n`);
  return locationIds;
}

/**
 * Seed specializations taxonomy
 */
async function seedSpecializations(tenantId: string): Promise<Record<string, string>> {
  console.log('🎯 Seeding specializations...');

  const specializationData = [
    // Behavioral Approaches
    { name: 'ABA (Applied Behavior Analysis)', category: SpecializationCategory.BEHAVIORAL_APPROACH },
    { name: 'CBT (Cognitive Behavioral Therapy)', category: SpecializationCategory.BEHAVIORAL_APPROACH },
    { name: 'DBT (Dialectical Behavior Therapy)', category: SpecializationCategory.BEHAVIORAL_APPROACH },
    { name: 'EMDR (Eye Movement Desensitization)', category: SpecializationCategory.BEHAVIORAL_APPROACH },
    { name: 'Play Therapy', category: SpecializationCategory.BEHAVIORAL_APPROACH },

    // Communication
    { name: 'Non-verbal Communication', category: SpecializationCategory.COMMUNICATION },
    { name: 'AAC (Augmentative Communication)', category: SpecializationCategory.COMMUNICATION },
    { name: 'Sign Language', category: SpecializationCategory.COMMUNICATION },
    { name: 'Speech Integration', category: SpecializationCategory.COMMUNICATION },

    // Population
    { name: 'Autism Spectrum Disorder', category: SpecializationCategory.POPULATION },
    { name: 'ADHD', category: SpecializationCategory.POPULATION },
    { name: 'Anxiety Disorders', category: SpecializationCategory.POPULATION },
    { name: 'Trauma & PTSD', category: SpecializationCategory.POPULATION },
    { name: 'Developmental Delays', category: SpecializationCategory.POPULATION },
    { name: 'Depression', category: SpecializationCategory.POPULATION },
    { name: 'OCD', category: SpecializationCategory.POPULATION },

    // Age Groups
    { name: 'Early Childhood (0-5)', category: SpecializationCategory.AGE_GROUP },
    { name: 'School Age (6-12)', category: SpecializationCategory.AGE_GROUP },
    { name: 'Adolescent (13-17)', category: SpecializationCategory.AGE_GROUP },
    { name: 'Adult (18+)', category: SpecializationCategory.AGE_GROUP },

    // Modality
    { name: 'Individual Therapy', category: SpecializationCategory.MODALITY },
    { name: 'Family Therapy', category: SpecializationCategory.MODALITY },
    { name: 'Group Therapy', category: SpecializationCategory.MODALITY },

    // Cultural
    { name: 'Spanish Language', category: SpecializationCategory.CULTURAL },
    { name: 'Mandarin Language', category: SpecializationCategory.CULTURAL },
    { name: 'Culturally Responsive - Hispanic/Latino', category: SpecializationCategory.CULTURAL },
    { name: 'Culturally Responsive - Asian', category: SpecializationCategory.CULTURAL },
  ];

  const insertedSpecializations = await db
    .insert(specializations)
    .values(
      specializationData.map(s => ({
        ...s,
        tenantId,
        isActive: true,
      })),
    )
    .returning({ id: specializations.id, name: specializations.name });

  // Create lookup map
  const specializationIds: Record<string, string> = {};
  for (const spec of insertedSpecializations) {
    specializationIds[spec.name] = spec.id;
  }

  console.log(`✅ ${insertedSpecializations.length} specializations created\n`);
  return specializationIds;
}

/**
 * Seed users (all roles)
 */
async function seedUsers(
  tenantId: string,
  locationIds: string[],
): Promise<Record<string, string>> {
  console.log('👤 Seeding users...');

  const userData = [
    // Admin
    {
      role: UserRole.ADMIN,
      email: 'admin@brightfutures.test',
      firstName: 'Alexandra',
      lastName: 'Martinez',
      phone: '(617) 555-0101',
      keycloakId: faker.string.uuid(), // Fake for dev
      assignedLocations: [locationIds[0], locationIds[1]],
    },

    // Therapists
    {
      role: UserRole.THERAPIST,
      email: 'dr.sarah.johnson@brightfutures.test',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '(617) 555-0102',
      keycloakId: faker.string.uuid(),
      assignedLocations: [locationIds[0]],
    },
    {
      role: UserRole.THERAPIST,
      email: 'michael.chen@brightfutures.test',
      firstName: 'Michael',
      lastName: 'Chen',
      phone: '(617) 555-0103',
      keycloakId: faker.string.uuid(),
      assignedLocations: [locationIds[0], locationIds[1]],
    },
    {
      role: UserRole.THERAPIST,
      email: 'emma.rodriguez@brightfutures.test',
      firstName: 'Emma',
      lastName: 'Rodriguez',
      phone: '(617) 555-0104',
      keycloakId: faker.string.uuid(),
      assignedLocations: [locationIds[1]],
    },

    // Billing
    {
      role: UserRole.BILLING,
      email: 'lisa.anderson@brightfutures.test',
      firstName: 'Lisa',
      lastName: 'Anderson',
      phone: '(617) 555-0105',
      keycloakId: faker.string.uuid(),
      assignedLocations: [locationIds[0]],
    },

    // Receptionist
    {
      role: UserRole.RECEPTIONIST,
      email: 'james.wilson@brightfutures.test',
      firstName: 'James',
      lastName: 'Wilson',
      phone: '(617) 555-0106',
      keycloakId: faker.string.uuid(),
      assignedLocations: [locationIds[0], locationIds[1]],
    },
  ];

  const insertedUsers = await db
    .insert(users)
    .values(
      userData.map(u => ({
        ...u,
        tenantId,
        isActive: true,
        mfaEnabled: false,
      })),
    )
    .returning({ id: users.id, email: users.email });

  // Create lookup map by email
  const userIds: Record<string, string> = {};
  for (const user of insertedUsers) {
    userIds[user.email] = user.id;
  }

  console.log(`✅ ${insertedUsers.length} users created\n`);
  return userIds;
}

/**
 * Helper to get required user ID
 */
function getRequiredUserId(userIds: Record<string, string>, email: string): string {
  const userId = userIds[email];
  if (!userId) {
    throw new Error(`User ID not found for email: ${email}`);
  }
  return userId;
}

/**
 * Seed therapists
 */
async function seedTherapists(
  tenantId: string,
  userIds: Record<string, string>,
  locationIds: string[],
): Promise<string[]> {
  console.log('👨‍⚕️ Seeding therapists...');

  const therapistData = [
    {
      userId: getRequiredUserId(userIds, 'dr.sarah.johnson@brightfutures.test'),
      primaryLocationId: locationIds[0],
      licenseNumber: 'BCBA-12345',
      licenseState: 'MA',
      licenseExpirationDate: '2026-12-31',
      credentials: 'BCBA, M.Ed',
      bio: 'Board Certified Behavior Analyst specializing in ABA therapy for children with autism. 12 years of experience.',
      maxCaseload: 25,
      currentCaseload: 0,
      isAcceptingNewClients: true,
      languages: ['English', 'Spanish'],
      ageGroupExpertise: [AgeGroup.EARLY_CHILDHOOD, AgeGroup.SCHOOL_AGE],
      communicationExpertise: [CommunicationNeeds.NON_VERBAL, CommunicationNeeds.AAC],
      availability: {
        monday: [{ start: '08:00', end: '16:00' }],
        tuesday: [{ start: '08:00', end: '16:00' }],
        wednesday: [{ start: '08:00', end: '16:00' }],
        thursday: [{ start: '08:00', end: '16:00' }],
        friday: [{ start: '08:00', end: '14:00' }],
      },
    },
    {
      userId: getRequiredUserId(userIds, 'michael.chen@brightfutures.test'),
      primaryLocationId: locationIds[0],
      licenseNumber: 'LMHC-67890',
      licenseState: 'MA',
      licenseExpirationDate: '2027-06-30',
      credentials: 'LMHC, PhD',
      bio: 'Licensed Mental Health Counselor specializing in CBT for anxiety and depression in adolescents and adults.',
      maxCaseload: 30,
      currentCaseload: 0,
      isAcceptingNewClients: true,
      languages: ['English', 'Mandarin'],
      ageGroupExpertise: [AgeGroup.ADOLESCENT, AgeGroup.ADULT],
      communicationExpertise: [CommunicationNeeds.VERBAL],
      availability: {
        monday: [{ start: '09:00', end: '17:00' }],
        tuesday: [{ start: '09:00', end: '17:00' }],
        wednesday: [{ start: '09:00', end: '17:00' }],
        thursday: [{ start: '13:00', end: '20:00' }], // Evening hours
        friday: [{ start: '09:00', end: '15:00' }],
      },
    },
    {
      userId: getRequiredUserId(userIds, 'emma.rodriguez@brightfutures.test'),
      primaryLocationId: locationIds[1],
      licenseNumber: 'LICSW-11223',
      licenseState: 'MA',
      licenseExpirationDate: '2026-03-31',
      credentials: 'LICSW, EMDR Certified',
      bio: 'Clinical Social Worker specializing in trauma therapy using EMDR. Works with children and adults.',
      maxCaseload: 20,
      currentCaseload: 0,
      isAcceptingNewClients: true,
      languages: ['English', 'Spanish'],
      ageGroupExpertise: [AgeGroup.SCHOOL_AGE, AgeGroup.ADOLESCENT, AgeGroup.ADULT],
      communicationExpertise: [CommunicationNeeds.VERBAL],
      availability: {
        monday: [{ start: '10:00', end: '18:00' }],
        tuesday: [{ start: '10:00', end: '18:00' }],
        wednesday: [{ start: '10:00', end: '18:00' }],
        thursday: [{ start: '10:00', end: '18:00' }],
        friday: [{ start: '10:00', end: '16:00' }],
      },
    },
  ];

  const insertedTherapists = await db
    .insert(therapists)
    .values(
      therapistData.map(t => ({
        ...t,
        tenantId,
      })),
    )
    .returning({ id: therapists.id });

  const therapistIds = insertedTherapists.map(t => t.id);
  console.log(`✅ ${therapistIds.length} therapists created\n`);
  return therapistIds;
}

/**
 * Seed therapist specializations
 */
async function seedTherapistSpecializations(
  therapistIds: string[],
  specializationIds: Record<string, string>,
): Promise<void> {
  console.log('🔗 Seeding therapist specializations...');

  const therapistSpecData = [
    // Dr. Sarah Johnson (ABA specialist)
    {
      therapistId: therapistIds[0]!,
      specializationId: specializationIds['ABA (Applied Behavior Analysis)'],
      proficiencyLevel: ProficiencyLevel.EXPERT,
      yearsExperience: 12,
    },
    {
      therapistId: therapistIds[0]!,
      specializationId: specializationIds['Autism Spectrum Disorder'],
      proficiencyLevel: ProficiencyLevel.EXPERT,
      yearsExperience: 12,
    },
    {
      therapistId: therapistIds[0]!,
      specializationId: specializationIds['Early Childhood (0-5)'],
      proficiencyLevel: ProficiencyLevel.EXPERT,
      yearsExperience: 10,
    },
    {
      therapistId: therapistIds[0]!,
      specializationId: specializationIds['Non-verbal Communication'],
      proficiencyLevel: ProficiencyLevel.EXPERT,
      yearsExperience: 8,
    },

    // Michael Chen (CBT specialist)
    {
      therapistId: therapistIds[1]!,
      specializationId: specializationIds['CBT (Cognitive Behavioral Therapy)'],
      proficiencyLevel: ProficiencyLevel.EXPERT,
      yearsExperience: 15,
    },
    {
      therapistId: therapistIds[1]!,
      specializationId: specializationIds['Anxiety Disorders'],
      proficiencyLevel: ProficiencyLevel.EXPERT,
      yearsExperience: 15,
    },
    {
      therapistId: therapistIds[1]!,
      specializationId: specializationIds.Depression,
      proficiencyLevel: ProficiencyLevel.EXPERT,
      yearsExperience: 12,
    },
    {
      therapistId: therapistIds[1]!,
      specializationId: specializationIds['Adolescent (13-17)'],
      proficiencyLevel: ProficiencyLevel.EXPERT,
      yearsExperience: 10,
    },
    {
      therapistId: therapistIds[1]!,
      specializationId: specializationIds.OCD,
      proficiencyLevel: ProficiencyLevel.PROFICIENT,
      yearsExperience: 7,
    },

    // Emma Rodriguez (Trauma/EMDR specialist)
    {
      therapistId: therapistIds[2]!,
      specializationId: specializationIds['EMDR (Eye Movement Desensitization)'],
      proficiencyLevel: ProficiencyLevel.EXPERT,
      yearsExperience: 8,
    },
    {
      therapistId: therapistIds[2]!,
      specializationId: specializationIds['Trauma & PTSD'],
      proficiencyLevel: ProficiencyLevel.EXPERT,
      yearsExperience: 8,
    },
    {
      therapistId: therapistIds[2]!,
      specializationId: specializationIds['Anxiety Disorders'],
      proficiencyLevel: ProficiencyLevel.PROFICIENT,
      yearsExperience: 6,
    },
    {
      therapistId: therapistIds[2]!,
      specializationId: specializationIds['School Age (6-12)'],
      proficiencyLevel: ProficiencyLevel.EXPERT,
      yearsExperience: 7,
    },
    {
      therapistId: therapistIds[2]!,
      specializationId: specializationIds['Family Therapy'],
      proficiencyLevel: ProficiencyLevel.PROFICIENT,
      yearsExperience: 5,
    },
  ];

  // Get tenant ID from first therapist
  const result = await db
    .select({ tenantId: therapists.tenantId })
    .from(therapists)
    .where(sql`${therapists.id} = ${therapistIds[0]!}`)
    .limit(1);

  const firstTherapist = result[0];
  if (!firstTherapist) {
    throw new Error('Failed to get tenant ID from therapist');
  }

  await db.insert(therapistSpecializations).values(
    therapistSpecData.map(ts => ({
      ...ts,
      specializationId: ts.specializationId!,
      tenantId: firstTherapist.tenantId,
    })),
  );

  console.log(`✅ ${therapistSpecData.length} therapist-specialization links created\n`);
}

/**
 * Seed clients with encrypted PHI
 */
async function seedClients(
  tenantId: string,
  locationIds: string[],
  therapistIds: string[],
  encryption: PHIEncryptionService,
): Promise<string[]> {
  console.log('👶 Seeding clients...');

  // Helper to create realistic client data
  const createClient = (
    ageGroup: string,
    status: string,
    assignedTherapistId?: string,
  ) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const dob = ageGroup === AgeGroup.EARLY_CHILDHOOD
      ? faker.date.birthdate({ min: 2020, max: 2024, mode: 'year' })
      : ageGroup === AgeGroup.SCHOOL_AGE
        ? faker.date.birthdate({ min: 2013, max: 2019, mode: 'year' })
        : ageGroup === AgeGroup.ADOLESCENT
          ? faker.date.birthdate({ min: 2008, max: 2012, mode: 'year' })
          : faker.date.birthdate({ min: 1960, max: 2007, mode: 'year' });

    const isMinor = ageGroup !== AgeGroup.ADULT;

    return {
      tenantId,
      primaryLocationId: faker.helpers.arrayElement(locationIds),
      firstName: encryption.encrypt(firstName),
      lastName: encryption.encrypt(lastName),
      dateOfBirth: encryption.encrypt(dob.toISOString().split('T')[0]!),
      email: encryption.encrypt(`${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`),
      phone: encryption.encrypt(faker.phone.number()),
      address: encryption.encrypt(faker.location.streetAddress()),
      ageGroup,
      preferredLanguage: faker.helpers.arrayElement(['English', 'Spanish', 'Mandarin']),
      guardianName: isMinor ? encryption.encrypt(faker.person.fullName()) : null,
      guardianRelationship: isMinor ? 'parent' : null,
      guardianPhone: isMinor ? encryption.encrypt(faker.phone.number()) : null,
      guardianEmail: isMinor
        ? encryption.encrypt(faker.internet.email())
        : null,
      emergencyContactName: encryption.encrypt(faker.person.fullName()),
      emergencyContactPhone: encryption.encrypt(faker.phone.number()),
      emergencyContactRelationship: isMinor ? 'grandparent' : 'spouse',
      insuranceProvider: encryption.encrypt(faker.helpers.arrayElement([
        'Blue Cross Blue Shield',
        'Aetna',
        'UnitedHealthcare',
        'Cigna',
      ])),
      insurancePolicyNumber: encryption.encrypt(faker.string.alphanumeric(10).toUpperCase()),
      insuranceGroupNumber: encryption.encrypt(faker.string.alphanumeric(8).toUpperCase()),
      status,
      intakeDate: status !== ClientStatus.INTAKE
        ? faker.date.past({ years: 1 }).toISOString().split('T')[0]!
        : new Date().toISOString().split('T')[0]!,
      assignedTherapistId: assignedTherapistId || null,
      matchScore: assignedTherapistId ? faker.number.int({ min: 75, max: 98 }) : null,
      matchReasoning: assignedTherapistId
        ? 'Matched based on specialization and availability'
        : null,
    };
  };

  const clientData = [
    // Early childhood clients (ABA)
    createClient(AgeGroup.EARLY_CHILDHOOD, ClientStatus.ACTIVE, therapistIds[0]),
    createClient(AgeGroup.EARLY_CHILDHOOD, ClientStatus.ACTIVE, therapistIds[0]),

    // School age clients
    createClient(AgeGroup.SCHOOL_AGE, ClientStatus.ACTIVE, therapistIds[2]),
    createClient(AgeGroup.SCHOOL_AGE, ClientStatus.ACTIVE, therapistIds[2]),
    createClient(AgeGroup.SCHOOL_AGE, ClientStatus.INTAKE),

    // Adolescent clients
    createClient(AgeGroup.ADOLESCENT, ClientStatus.ACTIVE, therapistIds[1]),
    createClient(AgeGroup.ADOLESCENT, ClientStatus.ACTIVE, therapistIds[1]),

    // Adult client
    createClient(AgeGroup.ADULT, ClientStatus.ACTIVE, therapistIds[1]),
  ];

  const insertedClients = await db
    .insert(clients)
    .values(clientData)
    .returning({ id: clients.id });

  const clientIds = insertedClients.map(c => c.id);
  console.log(`✅ ${clientIds.length} clients created (PHI encrypted)\n`);
  return clientIds;
}

/**
 * Seed client needs
 */
async function seedClientNeeds(
  clientIds: string[],
  specializationIds: Record<string, string>,
  encryption: PHIEncryptionService,
  tenantId: string,
): Promise<void> {
  console.log('📋 Seeding client needs...');

  if (clientIds.length < 8) {
    throw new Error('Expected at least 8 clients to be seeded');
  }

  const needsData = [
    // Client 0 - Early childhood, autism
    {
      clientId: clientIds[0]!,
      primaryConcerns: encryption.encrypt(
        'Delayed speech development, difficulty with social interactions, repetitive behaviors',
      ),
      behavioralCharacteristics: encryption.encrypt(
        'Prefers solitary play, limited eye contact, strong interest in spinning objects',
      ),
      sensoryConsiderations: encryption.encrypt('Sensitive to loud noises, prefers soft textures'),
      communicationNeeds: CommunicationNeeds.NON_VERBAL,
      cooccurringConditions: ['Autism Spectrum Disorder'],
      requiredSpecializations: [
        {
          specializationId: specializationIds['ABA (Applied Behavior Analysis)'],
          specializationName: 'ABA',
          importance: 'critical',
        },
        {
          specializationId: specializationIds['Autism Spectrum Disorder'],
          specializationName: 'Autism Spectrum Disorder',
          importance: 'critical',
        },
        {
          specializationId: specializationIds['Non-verbal Communication'],
          specializationName: 'Non-verbal Communication',
          importance: 'preferred',
        },
      ],
      preferredTherapyModality: 'individual',
      schedulePreferences: {
        preferredDays: ['Monday', 'Wednesday', 'Friday'],
        preferredTimes: ['morning'],
      },
      urgencyLevel: UrgencyLevel.HIGH,
    },

    // Client 1 - Early childhood, developmental delays
    {
      clientId: clientIds[1]!,
      primaryConcerns: encryption.encrypt(
        'Developmental delays in multiple areas, difficulty following instructions',
      ),
      behavioralCharacteristics: encryption.encrypt('Short attention span, difficulty with transitions'),
      sensoryConsiderations: encryption.encrypt('Seeks sensory input through movement'),
      communicationNeeds: CommunicationNeeds.AAC,
      cooccurringConditions: ['Developmental Delays'],
      requiredSpecializations: [
        {
          specializationId: specializationIds['ABA (Applied Behavior Analysis)'],
          specializationName: 'ABA',
          importance: 'critical',
        },
        {
          specializationId: specializationIds['AAC (Augmentative Communication)'],
          specializationName: 'AAC',
          importance: 'preferred',
        },
      ],
      preferredTherapyModality: 'individual',
      schedulePreferences: {
        preferredDays: ['Tuesday', 'Thursday'],
        preferredTimes: ['morning'],
      },
      urgencyLevel: UrgencyLevel.STANDARD,
    },

    // Client 2 - School age, trauma
    {
      clientId: clientIds[2]!,
      primaryConcerns: encryption.encrypt('History of trauma, anxiety, nightmares, avoidance behaviors'),
      behavioralCharacteristics: encryption.encrypt('Hypervigilant, difficulty trusting adults'),
      sensoryConsiderations: encryption.encrypt('None noted'),
      communicationNeeds: CommunicationNeeds.VERBAL,
      cooccurringConditions: ['Trauma & PTSD', 'Anxiety Disorders'],
      requiredSpecializations: [
        {
          specializationId: specializationIds['Trauma & PTSD'],
          specializationName: 'Trauma & PTSD',
          importance: 'critical',
        },
        {
          specializationId: specializationIds['EMDR (Eye Movement Desensitization)'],
          specializationName: 'EMDR',
          importance: 'preferred',
        },
      ],
      preferredTherapyModality: 'individual',
      schedulePreferences: {
        preferredDays: ['Monday', 'Wednesday'],
        preferredTimes: ['afternoon'],
      },
      urgencyLevel: UrgencyLevel.URGENT,
    },

    // Client 3 - School age, anxiety
    {
      clientId: clientIds[3]!,
      primaryConcerns: encryption.encrypt('School refusal, separation anxiety, social anxiety'),
      behavioralCharacteristics: encryption.encrypt('Worries excessively, physical complaints'),
      sensoryConsiderations: encryption.encrypt('None noted'),
      communicationNeeds: CommunicationNeeds.VERBAL,
      cooccurringConditions: ['Anxiety Disorders'],
      requiredSpecializations: [
        {
          specializationId: specializationIds['Anxiety Disorders'],
          specializationName: 'Anxiety Disorders',
          importance: 'critical',
        },
        {
          specializationId: specializationIds['EMDR (Eye Movement Desensitization)'],
          specializationName: 'EMDR',
          importance: 'nice_to_have',
        },
      ],
      preferredTherapyModality: 'individual',
      schedulePreferences: {
        preferredDays: ['Tuesday', 'Thursday'],
        preferredTimes: ['afternoon'],
      },
      urgencyLevel: UrgencyLevel.STANDARD,
    },

    // Client 4 - School age, intake (not yet assessed)
    {
      clientId: clientIds[4]!,
      primaryConcerns: encryption.encrypt('Parent concerns about behavior at school'),
      behavioralCharacteristics: encryption.encrypt('To be assessed during intake'),
      sensoryConsiderations: encryption.encrypt('To be assessed'),
      communicationNeeds: CommunicationNeeds.VERBAL,
      cooccurringConditions: [],
      requiredSpecializations: [],
      preferredTherapyModality: 'individual',
      schedulePreferences: {
        preferredDays: ['flexible'],
        preferredTimes: ['afternoon'],
      },
      urgencyLevel: UrgencyLevel.STANDARD,
    },

    // Client 5 - Adolescent, anxiety
    {
      clientId: clientIds[5]!,
      primaryConcerns: encryption.encrypt('Generalized anxiety, panic attacks, social anxiety'),
      behavioralCharacteristics: encryption.encrypt('Avoidance of social situations, perfectionism'),
      sensoryConsiderations: encryption.encrypt('None noted'),
      communicationNeeds: CommunicationNeeds.VERBAL,
      cooccurringConditions: ['Anxiety Disorders'],
      requiredSpecializations: [
        {
          specializationId: specializationIds['CBT (Cognitive Behavioral Therapy)'],
          specializationName: 'CBT',
          importance: 'critical',
        },
        {
          specializationId: specializationIds['Anxiety Disorders'],
          specializationName: 'Anxiety Disorders',
          importance: 'critical',
        },
      ],
      preferredTherapyModality: 'individual',
      schedulePreferences: {
        preferredDays: ['Thursday'],
        preferredTimes: ['evening'], // After school
      },
      urgencyLevel: UrgencyLevel.HIGH,
    },

    // Client 6 - Adolescent, depression
    {
      clientId: clientIds[6]!,
      primaryConcerns: encryption.encrypt('Low mood, loss of interest, sleep disturbance'),
      behavioralCharacteristics: encryption.encrypt('Withdrawn, irritable, declining grades'),
      sensoryConsiderations: encryption.encrypt('None noted'),
      communicationNeeds: CommunicationNeeds.VERBAL,
      cooccurringConditions: ['Depression'],
      requiredSpecializations: [
        {
          specializationId: specializationIds['CBT (Cognitive Behavioral Therapy)'],
          specializationName: 'CBT',
          importance: 'critical',
        },
        {
          specializationId: specializationIds.Depression,
          specializationName: 'Depression',
          importance: 'critical',
        },
      ],
      preferredTherapyModality: 'individual',
      schedulePreferences: {
        preferredDays: ['Monday', 'Wednesday'],
        preferredTimes: ['afternoon'],
      },
      urgencyLevel: UrgencyLevel.STANDARD,
    },

    // Client 7 - Adult, anxiety
    {
      clientId: clientIds[7]!,
      primaryConcerns: encryption.encrypt('Work-related stress, anxiety, difficulty sleeping'),
      behavioralCharacteristics: encryption.encrypt('High achiever, difficulty relaxing'),
      sensoryConsiderations: encryption.encrypt('None noted'),
      communicationNeeds: CommunicationNeeds.VERBAL,
      cooccurringConditions: ['Anxiety Disorders'],
      requiredSpecializations: [
        {
          specializationId: specializationIds['CBT (Cognitive Behavioral Therapy)'],
          specializationName: 'CBT',
          importance: 'critical',
        },
        {
          specializationId: specializationIds['Anxiety Disorders'],
          specializationName: 'Anxiety Disorders',
          importance: 'critical',
        },
      ],
      preferredTherapyModality: 'individual',
      schedulePreferences: {
        preferredDays: ['Thursday'],
        preferredTimes: ['evening'],
      },
      urgencyLevel: UrgencyLevel.STANDARD,
    },
  ];

  await db.insert(clientNeeds).values(
    needsData.map(n => ({
      ...n,
      tenantId,
      assessmentDate: new Date(),
      nextReassessment: faker.date.future({ years: 0.5 }).toISOString().split('T')[0]!,
    })),
  );

  console.log(`✅ ${needsData.length} client needs created\n`);
}

/**
 * Seed appointments
 */
async function seedAppointments(
  tenantId: string,
  locationIds: string[],
  clientIds: string[],
  therapistIds: string[],
  userIds: Record<string, string>,
): Promise<void> {
  console.log('📅 Seeding appointments...');

  const now = new Date();
  const appointmentData = [];

  // Helper to create appointments
  const createAppointment = (
    clientIndex: number,
    therapistIndex: number,
    daysOffset: number,
    status: string,
    type: string,
  ) => {
    const appointmentDate = new Date(now);
    appointmentDate.setDate(appointmentDate.getDate() + daysOffset);

    const startTime = '10:00:00';
    const endTime = '11:00:00';

    return {
      tenantId,
      locationId: faker.helpers.arrayElement(locationIds),
      clientId: clientIds[clientIndex]!,
      therapistId: therapistIds[therapistIndex]!,
      appointmentDate: appointmentDate.toISOString().split('T')[0]!,
      startTime,
      endTime,
      duration: 60,
      appointmentType: type,
      status,
      isRecurring: false,
      createdBy: Object.values(userIds)[0]!, // Admin
    };
  };

  // Past completed appointments
  appointmentData.push(
    createAppointment(0, 0, -30, AppointmentStatus.COMPLETED, AppointmentType.INITIAL_ASSESSMENT),
    createAppointment(0, 0, -23, AppointmentStatus.COMPLETED, AppointmentType.REGULAR_SESSION),
    createAppointment(0, 0, -16, AppointmentStatus.COMPLETED, AppointmentType.REGULAR_SESSION),
    createAppointment(1, 0, -25, AppointmentStatus.COMPLETED, AppointmentType.INITIAL_ASSESSMENT),
    createAppointment(1, 0, -18, AppointmentStatus.COMPLETED, AppointmentType.REGULAR_SESSION),
  );

  // Upcoming scheduled appointments
  appointmentData.push(
    createAppointment(0, 0, 2, AppointmentStatus.CONFIRMED, AppointmentType.REGULAR_SESSION),
    createAppointment(0, 0, 9, AppointmentStatus.SCHEDULED, AppointmentType.REGULAR_SESSION),
    createAppointment(1, 0, 3, AppointmentStatus.CONFIRMED, AppointmentType.REGULAR_SESSION),
    createAppointment(2, 2, 4, AppointmentStatus.SCHEDULED, AppointmentType.INITIAL_ASSESSMENT),
    createAppointment(3, 2, 5, AppointmentStatus.SCHEDULED, AppointmentType.INITIAL_ASSESSMENT),
    createAppointment(5, 1, 1, AppointmentStatus.CONFIRMED, AppointmentType.REGULAR_SESSION),
    createAppointment(6, 1, 6, AppointmentStatus.SCHEDULED, AppointmentType.REGULAR_SESSION),
  );

  // Cancelled appointments
  appointmentData.push(
    createAppointment(0, 0, -9, AppointmentStatus.CANCELLED, AppointmentType.REGULAR_SESSION),
    createAppointment(5, 1, -5, AppointmentStatus.CANCELLED, AppointmentType.REGULAR_SESSION),
    createAppointment(7, 1, -2, AppointmentStatus.NO_SHOW, AppointmentType.REGULAR_SESSION),
  );

  await db.insert(appointments).values(appointmentData);

  console.log(`✅ ${appointmentData.length} appointments created\n`);
}

/**
 * Helper to prompt for confirmation
 */
async function confirm(prompt: string): Promise<boolean> {
  process.stdout.write(prompt);

  return new Promise((resolve) => {
    process.stdin.once('data', (data) => {
      const answer = data.toString().trim().toLowerCase();
      resolve(answer === 'y' || answer === 'yes');
    });
  });
}

// Run seed
seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
