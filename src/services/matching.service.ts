import type { InferSelectModel } from 'drizzle-orm';
import { and, eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { clientNeeds } from '@/models/client.schema';
import { specializations } from '@/models/specialization.schema';
import { therapists, therapistSpecializations } from '@/models/therapist.schema';

// Types for matching
export type RequiredSpecialization = {
  specializationId: string;
  specializationName?: string;
  importance: 'critical' | 'preferred' | 'nice_to_have';
};

export type SchedulePreferences = {
  preferredTimes?: string[];
  preferredDays?: string[];
};

export type UrgencyLevel = 'urgent' | 'high' | 'standard' | 'low';

export type MatchCriteria = {
  requiredSpecializations: RequiredSpecialization[];
  communicationNeeds?: string;
  ageGroup?: string;
  preferredTimes?: string[];
  urgency?: UrgencyLevel;
};

export type TherapistMatch = {
  therapistId: string;
  matchScore: number;
  matchReasoning: string;
  details: {
    specializationScore: number;
    communicationScore: number;
    availabilityScore: number;
    ageMatchScore: number;
    caseloadScore: number;
  };
};

type TherapistWithSpecializations = InferSelectModel<typeof therapists> & {
  specializations: Array<{
    specializationId: string;
    specializationName: string;
    proficiencyLevel: string;
    yearsExperience: number | null;
  }>;
};

/**
 * Type guards for validating jsonb data from database
 */
function isRequiredSpecialization(obj: unknown): obj is RequiredSpecialization {
  return (
    typeof obj === 'object'
    && obj !== null
    && typeof (obj as Record<string, unknown>).specializationId === 'string'
    && ['critical', 'preferred', 'nice_to_have'].includes(
      (obj as Record<string, unknown>).importance as string,
    )
  );
}

function isRequiredSpecializationArray(
  value: unknown,
): value is RequiredSpecialization[] {
  return Array.isArray(value) && value.every(isRequiredSpecialization);
}

function isSchedulePreferences(value: unknown): value is SchedulePreferences {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    obj.preferredTimes === undefined
    || (Array.isArray(obj.preferredTimes)
      && obj.preferredTimes.every(t => typeof t === 'string'))
  );
}

function isUrgencyLevel(value: unknown): value is UrgencyLevel {
  return (
    typeof value === 'string'
    && ['urgent', 'high', 'standard', 'low'].includes(value)
  );
}

/**
 * Matching Service - Calculate therapist-client matches
 *
 * Uses weighted multi-factor scoring algorithm to rank therapist-client compatibility.
 * All scoring weights and thresholds are defined as constants for maintainability.
 */
export class MatchingService {
  /**
   * Main scoring algorithm weights (must sum to 1.0)
   * These determine the relative importance of each matching factor
   */
  private readonly SCORING_WEIGHTS = {
    specialization: 0.4, // 40% - Most important: clinical expertise match
    communication: 0.25, // 25% - Critical for client needs (e.g., non-verbal)
    availability: 0.15, // 15% - Schedule flexibility
    ageMatch: 0.1, // 10% - Age group expertise
    caseload: 0.1, // 10% - Current capacity
  } as const;

  /**
   * Specialization importance multipliers
   * Higher weights for critical specializations vs nice-to-have
   */
  private readonly IMPORTANCE_WEIGHTS = {
    critical: 3, // Must-have specialization (e.g., ABA for autism)
    preferred: 2, // Strongly desired but not required
    nice_to_have: 1, // Beneficial but optional
  } as const;

  /**
   * Proficiency level scoring
   * Based on therapist's expertise level in a specialization
   */
  private readonly PROFICIENCY_SCORES = {
    expert: 100, // 5+ years or certified specialist
    proficient: 80, // Regular practice, good competency
    familiar: 60, // Some experience, can handle cases
  } as const;

  /**
   * Availability scoring thresholds
   * Based on number of available time slots per week
   */
  private readonly AVAILABILITY_THRESHOLDS = {
    excellent: { minSlots: 20, score: 100 }, // Very flexible schedule
    good: { minSlots: 15, score: 90 }, // Good availability
    adequate: { minSlots: 10, score: 80 }, // Moderate availability
    limited: { minSlots: 5, score: 70 }, // Limited slots
    minimal: { minSlots: 0, score: 50 }, // Very few slots
  } as const;

  /**
   * Caseload utilization thresholds
   * Lower utilization = more capacity for new clients
   */
  private readonly CASELOAD_THRESHOLDS = {
    low: 0.5, // <50% utilized - plenty of capacity
    moderate: 0.75, // 50-75% utilized - good capacity
    high: 0.9, // 75-90% utilized - limited capacity
    // >90% = approaching full capacity
  } as const;

  /**
   * Calculate matches for a client based on their needs
   */
  async calculateMatches(
    tenantId: string,
    criteria: MatchCriteria,
    maxResults = 5,
  ): Promise<TherapistMatch[]> {
    // Get available therapists for this tenant
    const availableTherapists = await this.getAvailableTherapists(tenantId);

    if (availableTherapists.length === 0) {
      return [];
    }

    // Calculate scores for each therapist
    const matches = availableTherapists.map((therapist) => {
      return this.calculateTherapistScore(therapist, criteria);
    });

    // Sort by score (descending) and return top results
    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, maxResults);
  }

  /**
   * Get available therapists with their specializations
   * Uses single JOIN query to avoid N+1 performance issues
   */
  private async getAvailableTherapists(
    tenantId: string,
  ): Promise<TherapistWithSpecializations[]> {
    // Single query with LEFT JOIN to get therapists and their specializations
    const results = await db
      .select({
        therapist: therapists,
        specialization: {
          specializationId: therapistSpecializations.specializationId,
          specializationName: specializations.name,
          proficiencyLevel: therapistSpecializations.proficiencyLevel,
          yearsExperience: therapistSpecializations.yearsExperience,
        },
      })
      .from(therapists)
      .leftJoin(
        therapistSpecializations,
        and(
          eq(therapistSpecializations.therapistId, therapists.id),
          eq(therapistSpecializations.tenantId, tenantId),
        ),
      )
      .leftJoin(
        specializations,
        eq(specializations.id, therapistSpecializations.specializationId),
      )
      .where(
        and(
          eq(therapists.tenantId, tenantId),
          eq(therapists.isAcceptingNewClients, true),
        ),
      );

    // Group results by therapist ID
    const therapistMap = new Map<string, TherapistWithSpecializations>();

    for (const row of results) {
      const therapistId = row.therapist.id;

      if (!therapistMap.has(therapistId)) {
        therapistMap.set(therapistId, {
          ...row.therapist,
          specializations: [],
        });
      }

      // Add specialization if it exists (LEFT JOIN may return null)
      if (
        row.specialization.specializationId
        && row.specialization.specializationName
        && row.specialization.proficiencyLevel
      ) {
        therapistMap.get(therapistId)!.specializations.push({
          specializationId: row.specialization.specializationId,
          specializationName: row.specialization.specializationName,
          proficiencyLevel: row.specialization.proficiencyLevel,
          yearsExperience: row.specialization.yearsExperience,
        });
      }
    }

    return Array.from(therapistMap.values());
  }

  /**
   * Calculate match score for a therapist
   */
  private calculateTherapistScore(
    therapist: TherapistWithSpecializations,
    criteria: MatchCriteria,
  ): TherapistMatch {
    const specializationScore = this.calculateSpecializationScore(
      therapist,
      criteria.requiredSpecializations,
    );
    const communicationScore = this.calculateCommunicationScore(
      therapist,
      criteria.communicationNeeds,
    );
    const availabilityScore = this.calculateAvailabilityScore(therapist);
    const ageMatchScore = this.calculateAgeMatchScore(
      therapist,
      criteria.ageGroup,
    );
    const caseloadScore = this.calculateCaseloadScore(therapist);

    // Weighted total score (0-100)
    const matchScore
      = specializationScore * this.SCORING_WEIGHTS.specialization
        + communicationScore * this.SCORING_WEIGHTS.communication
        + availabilityScore * this.SCORING_WEIGHTS.availability
        + ageMatchScore * this.SCORING_WEIGHTS.ageMatch
        + caseloadScore * this.SCORING_WEIGHTS.caseload;

    const reasoning = this.generateMatchReasoning(
      therapist,
      criteria,
      {
        specializationScore,
        communicationScore,
        availabilityScore,
        ageMatchScore,
        caseloadScore,
      },
    );

    return {
      therapistId: therapist.id,
      matchScore: Math.round(matchScore),
      matchReasoning: reasoning,
      details: {
        specializationScore,
        communicationScore,
        availabilityScore,
        ageMatchScore,
        caseloadScore,
      },
    };
  }

  /**
   * Calculate specialization match score (0-100)
   */
  private calculateSpecializationScore(
    therapist: TherapistWithSpecializations,
    requiredSpecializations: MatchCriteria['requiredSpecializations'],
  ): number {
    if (!requiredSpecializations || requiredSpecializations.length === 0) {
      return 100; // No specific requirements
    }

    let totalScore = 0;
    let totalWeight = 0;

    for (const required of requiredSpecializations) {
      const weight
        = required.importance === 'critical'
          ? this.IMPORTANCE_WEIGHTS.critical
          : required.importance === 'preferred'
            ? this.IMPORTANCE_WEIGHTS.preferred
            : this.IMPORTANCE_WEIGHTS.nice_to_have;
      totalWeight += weight;

      // Check if therapist has this specialization
      const match = therapist.specializations.find(
        spec => spec.specializationId === required.specializationId,
      );

      if (match) {
        // Score based on proficiency level
        let proficiencyScore = 0;
        if (match.proficiencyLevel === 'expert') {
          proficiencyScore = this.PROFICIENCY_SCORES.expert;
        } else if (match.proficiencyLevel === 'proficient') {
          proficiencyScore = this.PROFICIENCY_SCORES.proficient;
        } else if (match.proficiencyLevel === 'familiar') {
          proficiencyScore = this.PROFICIENCY_SCORES.familiar;
        }

        totalScore += proficiencyScore * weight;
      } else if (required.importance === 'critical') {
        // Critical specialization missing - no points awarded (significant penalty)
      }
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Calculate communication needs match score (0-100)
   */
  private calculateCommunicationScore(
    therapist: TherapistWithSpecializations,
    communicationNeeds?: string,
  ): number {
    if (!communicationNeeds) {
      return 100; // No specific communication needs
    }

    const expertise = therapist.communicationExpertise as string[] | null;
    if (!expertise || expertise.length === 0) {
      return 50; // No expertise listed - neutral score
    }

    // Check if therapist has expertise in required communication type
    if (expertise.includes(communicationNeeds)) {
      return 100;
    }

    return 30; // Has some communication expertise, but not a match
  }

  /**
   * Calculate availability score (0-100)
   */
  private calculateAvailabilityScore(
    therapist: TherapistWithSpecializations,
  ): number {
    const availability = therapist.availability as Record<
      string,
      Array<{ start: string; end: string }>
    > | null;

    if (!availability) {
      return 50; // No availability data - neutral score
    }

    // Count available time slots
    let totalSlots = 0;
    for (const day of Object.keys(availability)) {
      const slots = availability[day];
      if (slots && Array.isArray(slots)) {
        totalSlots += slots.length;
      }
    }

    // More availability = higher score
    if (totalSlots >= this.AVAILABILITY_THRESHOLDS.excellent.minSlots) {
      return this.AVAILABILITY_THRESHOLDS.excellent.score;
    }
    if (totalSlots >= this.AVAILABILITY_THRESHOLDS.good.minSlots) {
      return this.AVAILABILITY_THRESHOLDS.good.score;
    }
    if (totalSlots >= this.AVAILABILITY_THRESHOLDS.adequate.minSlots) {
      return this.AVAILABILITY_THRESHOLDS.adequate.score;
    }
    if (totalSlots >= this.AVAILABILITY_THRESHOLDS.limited.minSlots) {
      return this.AVAILABILITY_THRESHOLDS.limited.score;
    }
    return this.AVAILABILITY_THRESHOLDS.minimal.score;
  }

  /**
   * Calculate age group match score (0-100)
   */
  private calculateAgeMatchScore(
    therapist: TherapistWithSpecializations,
    ageGroup?: string,
  ): number {
    if (!ageGroup) {
      return 100; // No specific age requirement
    }

    const expertise = therapist.ageGroupExpertise as string[] | null;
    if (!expertise || expertise.length === 0) {
      return 50; // No expertise listed - neutral score
    }

    // Check if therapist has expertise in this age group
    if (expertise.includes(ageGroup)) {
      return 100;
    }

    return 40; // Has some age group expertise, but not a match
  }

  /**
   * Calculate caseload capacity score (0-100)
   */
  private calculateCaseloadScore(
    therapist: TherapistWithSpecializations,
  ): number {
    const maxCaseload = therapist.maxCaseload ?? 25;
    const currentCaseload = therapist.currentCaseload ?? 0;

    if (currentCaseload >= maxCaseload) {
      return 0; // At capacity
    }

    const utilizationRate = currentCaseload / maxCaseload;

    // Prefer therapists with some availability but not completely empty
    if (utilizationRate < this.CASELOAD_THRESHOLDS.low) {
      return 100; // Less than 50% utilized - plenty of capacity
    }
    if (utilizationRate < this.CASELOAD_THRESHOLDS.moderate) {
      return 80; // 50-75% utilized - good capacity
    }
    if (utilizationRate < this.CASELOAD_THRESHOLDS.high) {
      return 60; // 75-90% utilized - limited capacity
    }
    return 40; // 90%+ utilized - very limited capacity
  }

  /**
   * Generate human-readable match reasoning
   */
  private generateMatchReasoning(
    therapist: TherapistWithSpecializations,
    criteria: MatchCriteria,
    scores: {
      specializationScore: number;
      communicationScore: number;
      availabilityScore: number;
      ageMatchScore: number;
      caseloadScore: number;
    },
  ): string {
    const reasons: string[] = [];

    // Specializations
    if (scores.specializationScore >= 80) {
      const matchedSpecs = criteria.requiredSpecializations
        .filter(req =>
          therapist.specializations.some(
            spec => spec.specializationId === req.specializationId,
          ),
        )
        .map(req => req.specializationName || req.specializationId)
        .join(', ');
      reasons.push(`Strong match in required specializations: ${matchedSpecs}`);
    } else if (scores.specializationScore >= 60) {
      reasons.push('Partial match in required specializations');
    } else if (scores.specializationScore < 40) {
      reasons.push('Limited match in required specializations');
    }

    // Communication
    if (criteria.communicationNeeds && scores.communicationScore >= 80) {
      reasons.push(
        `Has expertise in ${criteria.communicationNeeds} communication`,
      );
    }

    // Age group
    if (criteria.ageGroup && scores.ageMatchScore >= 80) {
      reasons.push(`Specializes in ${criteria.ageGroup} age group`);
    }

    // Availability
    if (scores.availabilityScore >= 80) {
      reasons.push('High availability');
    } else if (scores.availabilityScore < 60) {
      reasons.push('Limited availability');
    }

    // Caseload
    if (scores.caseloadScore >= 80) {
      reasons.push('Good capacity for new clients');
    } else if (scores.caseloadScore < 50) {
      reasons.push('Approaching caseload capacity');
    }

    return `${reasons.join('. ')}.`;
  }

  /**
   * Get client needs by client ID (helper method)
   */
  async getClientNeeds(
    tenantId: string,
    clientId: string,
  ): Promise<MatchCriteria | null> {
    const needs = await db
      .select()
      .from(clientNeeds)
      .where(
        and(eq(clientNeeds.tenantId, tenantId), eq(clientNeeds.clientId, clientId)),
      )
      .limit(1);

    const need = needs[0];
    if (!need) {
      return null;
    }

    // Validate and parse jsonb fields with type guards
    const requiredSpecializations = isRequiredSpecializationArray(
      need.requiredSpecializations,
    )
      ? need.requiredSpecializations
      : [];

    const schedulePrefs = isSchedulePreferences(need.schedulePreferences)
      ? need.schedulePreferences
      : null;

    const urgency = isUrgencyLevel(need.urgencyLevel)
      ? need.urgencyLevel
      : 'standard';

    return {
      requiredSpecializations,
      communicationNeeds: need.communicationNeeds || undefined,
      ageGroup: undefined, // Will come from client record
      preferredTimes: schedulePrefs?.preferredTimes || undefined,
      urgency,
    };
  }
}

// Export singleton instance
export const matchingService = new MatchingService();
