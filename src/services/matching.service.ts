import type { InferSelectModel } from 'drizzle-orm';
import { and, eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { clientNeeds } from '@/models/client.schema';
import { specializations } from '@/models/specialization.schema';
import { therapists, therapistSpecializations } from '@/models/therapist.schema';

// Types for matching
export type MatchCriteria = {
  requiredSpecializations: Array<{
    specializationId: string;
    specializationName?: string;
    importance: 'critical' | 'preferred' | 'nice_to_have';
  }>;
  communicationNeeds?: string;
  ageGroup?: string;
  preferredTimes?: string[];
  urgency?: 'urgent' | 'high' | 'standard' | 'low';
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
 * Matching Service - Calculate therapist-client matches
 *
 * Scoring weights:
 * - Specializations: 40%
 * - Communication: 25%
 * - Availability: 15%
 * - Age Match: 10%
 * - Caseload: 10%
 */
export class MatchingService {
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
   */
  private async getAvailableTherapists(
    tenantId: string,
  ): Promise<TherapistWithSpecializations[]> {
    // Get therapists who are accepting new clients
    const availableTherapists = await db
      .select()
      .from(therapists)
      .where(
        and(
          eq(therapists.tenantId, tenantId),
          eq(therapists.isAcceptingNewClients, true),
        ),
      );

    // Get specializations for each therapist
    const therapistsWithSpecs = await Promise.all(
      availableTherapists.map(async (therapist: InferSelectModel<typeof therapists>) => {
        const specs = await db
          .select({
            specializationId: therapistSpecializations.specializationId,
            specializationName: specializations.name,
            proficiencyLevel: therapistSpecializations.proficiencyLevel,
            yearsExperience: therapistSpecializations.yearsExperience,
          })
          .from(therapistSpecializations)
          .innerJoin(
            specializations,
            eq(specializations.id, therapistSpecializations.specializationId),
          )
          .where(
            and(
              eq(therapistSpecializations.tenantId, tenantId),
              eq(therapistSpecializations.therapistId, therapist.id),
            ),
          );

        return {
          ...therapist,
          specializations: specs,
        };
      }),
    );

    return therapistsWithSpecs;
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
      = specializationScore * 0.4
        + communicationScore * 0.25
        + availabilityScore * 0.15
        + ageMatchScore * 0.1
        + caseloadScore * 0.1;

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
          ? 3
          : required.importance === 'preferred'
            ? 2
            : 1;
      totalWeight += weight;

      // Check if therapist has this specialization
      const match = therapist.specializations.find(
        spec => spec.specializationId === required.specializationId,
      );

      if (match) {
        // Score based on proficiency level
        let proficiencyScore = 0;
        if (match.proficiencyLevel === 'expert') {
          proficiencyScore = 100;
        } else if (match.proficiencyLevel === 'proficient') {
          proficiencyScore = 80;
        } else if (match.proficiencyLevel === 'familiar') {
          proficiencyScore = 60;
        }

        totalScore += proficiencyScore * weight;
      } else if (required.importance === 'critical') {
        // If critical specialization is missing, it's a significant penalty
        totalScore += 0; // No points for missing critical spec
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
    if (totalSlots >= 20) {
      return 100;
    }
    if (totalSlots >= 15) {
      return 90;
    }
    if (totalSlots >= 10) {
      return 80;
    }
    if (totalSlots >= 5) {
      return 70;
    }
    return 50;
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
    if (utilizationRate < 0.5) {
      return 100; // Less than 50% utilized - plenty of capacity
    }
    if (utilizationRate < 0.75) {
      return 80; // 50-75% utilized - good capacity
    }
    if (utilizationRate < 0.9) {
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

    return {
      requiredSpecializations: (need.requiredSpecializations as any[]) || [],
      communicationNeeds: need.communicationNeeds || undefined,
      ageGroup: undefined, // Will come from client record
      preferredTimes:
        (need.schedulePreferences as any)?.preferredTimes || undefined,
      urgency: (need.urgencyLevel as any) || 'standard',
    };
  }
}

// Export singleton instance
export const matchingService = new MatchingService();
