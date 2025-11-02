import type {
  CreateTherapistInput,
  TherapistQueryParams,
  UpdateTherapistInput,
} from '@/validations/therapist.validation';
import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { withTenantContext } from '@/lib/tenant-db';
import { db } from '@/libs/DB';
import { specializations } from '@/models/specialization.schema';
import { therapists, therapistSpecializations } from '@/models/therapist.schema';
import { users } from '@/models/user.schema';

/**
 * Therapist Service
 * Handles business logic for therapist profile management
 */

type TherapistWithDetails = {
  id: string;
  tenantId: string;
  userId: string;
  primaryLocationId: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  licenseExpirationDate: string | null;
  credentials: string | null;
  bio: string | null;
  photoUrl: string | null;
  maxCaseload: number | null;
  currentCaseload: number | null;
  isAcceptingNewClients: boolean | null;
  languages: unknown;
  ageGroupExpertise: unknown;
  communicationExpertise: unknown;
  availability: unknown;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  specializations?: Array<{
    id: string;
    specializationId: string;
    proficiencyLevel: string;
    yearsExperience: number | null;
    specialization: {
      id: string;
      name: string;
      category: string;
      description: string | null;
    };
  }>;
};

/**
 * Create a new therapist profile
 */
export async function createTherapist(
  tenantId: string,
  data: CreateTherapistInput,
): Promise<TherapistWithDetails> {
  return await withTenantContext(tenantId, async () => {
    // Verify user exists
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, data.userId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    // Check if therapist profile already exists for this user
    const [existing] = await db
      .select()
      .from(therapists)
      .where(and(eq(therapists.userId, data.userId), eq(therapists.tenantId, tenantId)))
      .limit(1);

    if (existing) {
      throw new Error('Therapist profile already exists for this user');
    }

    // Extract specializations from input
    const { specializations: specializationsData } = data;

    // Create therapist profile
    const [newTherapist] = await db
      .insert(therapists)
      .values({
        tenantId,
        userId: data.userId,
        primaryLocationId: data.primaryLocationId || null,
        licenseNumber: data.licenseNumber || null,
        licenseState: data.licenseState || null,
        licenseExpirationDate: data.licenseExpirationDate || null,
        credentials: data.credentials || null,
        bio: data.bio || null,
        photoUrl: data.photoUrl || null,
        maxCaseload: data.maxCaseload || 25,
        currentCaseload: 0,
        isAcceptingNewClients: data.isAcceptingNewClients ?? true,
        languages: data.languages || ['English'],
        ageGroupExpertise: data.ageGroupExpertise,
        communicationExpertise: data.communicationExpertise || [],
        availability: data.availability || null,
      })
      .returning();

    if (!newTherapist) {
      throw new Error('Failed to create therapist profile');
    }

    // Insert specializations
    if (specializationsData && specializationsData.length > 0) {
      await db.insert(therapistSpecializations).values(
        specializationsData.map(spec => ({
          tenantId,
          therapistId: newTherapist.id,
          specializationId: spec.specializationId,
          proficiencyLevel: spec.proficiencyLevel,
          yearsExperience: spec.yearsExperience || null,
        })),
      );
    }

    // Fetch the complete therapist profile with relations
    return await getTherapistById(tenantId, newTherapist.id);
  });
}

/**
 * Get therapist by ID with user and specializations
 */
export async function getTherapistById(
  tenantId: string,
  therapistId: string,
): Promise<TherapistWithDetails> {
  return await withTenantContext(tenantId, async () => {
    const [therapist] = await db
      .select()
      .from(therapists)
      .where(and(eq(therapists.id, therapistId), eq(therapists.tenantId, tenantId)))
      .limit(1);

    if (!therapist) {
      throw new Error('Therapist not found');
    }

    // Fetch user details
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, therapist.userId))
      .limit(1);

    // Fetch specializations with details
    const therapistSpecs = await db
      .select({
        id: therapistSpecializations.id,
        specializationId: therapistSpecializations.specializationId,
        proficiencyLevel: therapistSpecializations.proficiencyLevel,
        yearsExperience: therapistSpecializations.yearsExperience,
        specialization: {
          id: specializations.id,
          name: specializations.name,
          category: specializations.category,
          description: specializations.description,
        },
      })
      .from(therapistSpecializations)
      .innerJoin(specializations, eq(therapistSpecializations.specializationId, specializations.id))
      .where(
        and(
          eq(therapistSpecializations.therapistId, therapistId),
          eq(therapistSpecializations.tenantId, tenantId),
        ),
      );

    return {
      ...therapist,
      user,
      specializations: therapistSpecs,
    };
  });
}

/**
 * Get therapist by user ID
 */
export async function getTherapistByUserId(
  tenantId: string,
  userId: string,
): Promise<TherapistWithDetails | null> {
  return await withTenantContext(tenantId, async () => {
    const [therapist] = await db
      .select()
      .from(therapists)
      .where(and(eq(therapists.userId, userId), eq(therapists.tenantId, tenantId)))
      .limit(1);

    if (!therapist) {
      return null;
    }

    return await getTherapistById(tenantId, therapist.id);
  });
}

/**
 * List therapists with optional filtering
 */
export async function listTherapists(
  tenantId: string,
  params: TherapistQueryParams = {},
): Promise<TherapistWithDetails[]> {
  return await withTenantContext(tenantId, async () => {
    const conditions = [eq(therapists.tenantId, tenantId)];

    if (params.isAcceptingNewClients !== undefined) {
      conditions.push(eq(therapists.isAcceptingNewClients, params.isAcceptingNewClients === 'true'));
    }

    if (params.locationId) {
      conditions.push(eq(therapists.primaryLocationId, params.locationId));
    }

    // Base query
    let therapistList = await db
      .select()
      .from(therapists)
      .where(and(...conditions))
      .orderBy(therapists.createdAt);

    // Filter by specialization if provided
    if (params.specializationId) {
      const therapistIds = await db
        .select({ therapistId: therapistSpecializations.therapistId })
        .from(therapistSpecializations)
        .where(
          and(
            eq(therapistSpecializations.tenantId, tenantId),
            eq(therapistSpecializations.specializationId, params.specializationId),
          ),
        );

      const ids = therapistIds.map(t => t.therapistId);
      if (ids.length === 0) {
        return [];
      }

      therapistList = therapistList.filter(t => ids.includes(t.id));
    }

    // Search by user name if provided
    if (params.search) {
      const searchPattern = `%${params.search}%`;
      const userIds = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            or(
              ilike(users.firstName, searchPattern),
              ilike(users.lastName, searchPattern),
              ilike(users.email, searchPattern),
            ),
          ),
        );

      const ids = userIds.map(u => u.id);
      if (ids.length === 0) {
        return [];
      }

      therapistList = therapistList.filter(t => ids.includes(t.userId));
    }

    // Fetch complete details for each therapist
    const therapistsWithDetails = await Promise.all(
      therapistList.map(t => getTherapistById(tenantId, t.id)),
    );

    return therapistsWithDetails;
  });
}

/**
 * Update therapist profile
 */
export async function updateTherapist(
  tenantId: string,
  therapistId: string,
  data: UpdateTherapistInput,
): Promise<TherapistWithDetails> {
  return await withTenantContext(tenantId, async () => {
    // Verify therapist exists
    const [existing] = await db
      .select()
      .from(therapists)
      .where(and(eq(therapists.id, therapistId), eq(therapists.tenantId, tenantId)))
      .limit(1);

    if (!existing) {
      throw new Error('Therapist not found');
    }

    // Extract specializations from input
    const { specializations: specializationsData, ...therapistData } = data;

    // Update therapist profile
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (therapistData.primaryLocationId !== undefined) {
      updateData.primaryLocationId = therapistData.primaryLocationId;
    }
    if (therapistData.licenseNumber !== undefined) {
      updateData.licenseNumber = therapistData.licenseNumber;
    }
    if (therapistData.licenseState !== undefined) {
      updateData.licenseState = therapistData.licenseState;
    }
    if (therapistData.licenseExpirationDate !== undefined) {
      updateData.licenseExpirationDate = therapistData.licenseExpirationDate;
    }
    if (therapistData.credentials !== undefined) {
      updateData.credentials = therapistData.credentials;
    }
    if (therapistData.bio !== undefined) {
      updateData.bio = therapistData.bio;
    }
    if (therapistData.photoUrl !== undefined) {
      updateData.photoUrl = therapistData.photoUrl;
    }
    if (therapistData.maxCaseload !== undefined) {
      updateData.maxCaseload = therapistData.maxCaseload;
    }
    if (therapistData.isAcceptingNewClients !== undefined) {
      updateData.isAcceptingNewClients = therapistData.isAcceptingNewClients;
    }
    if (therapistData.languages !== undefined) {
      updateData.languages = therapistData.languages;
    }
    if (therapistData.ageGroupExpertise !== undefined) {
      updateData.ageGroupExpertise = therapistData.ageGroupExpertise;
    }
    if (therapistData.communicationExpertise !== undefined) {
      updateData.communicationExpertise = therapistData.communicationExpertise;
    }
    if (therapistData.availability !== undefined) {
      updateData.availability = therapistData.availability;
    }

    await db
      .update(therapists)
      .set(updateData)
      .where(and(eq(therapists.id, therapistId), eq(therapists.tenantId, tenantId)));

    // Update specializations if provided
    if (specializationsData) {
      // Delete existing specializations
      await db
        .delete(therapistSpecializations)
        .where(
          and(
            eq(therapistSpecializations.therapistId, therapistId),
            eq(therapistSpecializations.tenantId, tenantId),
          ),
        );

      // Insert new specializations
      if (specializationsData.length > 0) {
        await db.insert(therapistSpecializations).values(
          specializationsData.map(spec => ({
            tenantId,
            therapistId,
            specializationId: spec.specializationId,
            proficiencyLevel: spec.proficiencyLevel,
            yearsExperience: spec.yearsExperience || null,
          })),
        );
      }
    }

    // Fetch the updated therapist profile with relations
    return await getTherapistById(tenantId, therapistId);
  });
}

/**
 * Delete therapist profile
 */
export async function deleteTherapist(tenantId: string, therapistId: string): Promise<void> {
  return await withTenantContext(tenantId, async () => {
    // Verify therapist exists
    const [existing] = await db
      .select()
      .from(therapists)
      .where(and(eq(therapists.id, therapistId), eq(therapists.tenantId, tenantId)))
      .limit(1);

    if (!existing) {
      throw new Error('Therapist not found');
    }

    // Delete specializations first (foreign key constraint)
    await db
      .delete(therapistSpecializations)
      .where(
        and(
          eq(therapistSpecializations.therapistId, therapistId),
          eq(therapistSpecializations.tenantId, tenantId),
        ),
      );

    // Delete therapist profile
    await db
      .delete(therapists)
      .where(and(eq(therapists.id, therapistId), eq(therapists.tenantId, tenantId)));
  });
}

/**
 * Update therapist caseload count
 */
export async function updateTherapistCaseload(
  tenantId: string,
  therapistId: string,
  delta: number,
): Promise<void> {
  return await withTenantContext(tenantId, async () => {
    await db
      .update(therapists)
      .set({
        currentCaseload: sql`${therapists.currentCaseload} + ${delta}`,
        updatedAt: new Date(),
      })
      .where(and(eq(therapists.id, therapistId), eq(therapists.tenantId, tenantId)));
  });
}
