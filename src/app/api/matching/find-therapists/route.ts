import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helpers';
import { matchingService } from '@/services/matching.service';
import { matchCriteriaSchema } from '@/validations/matching.validation';

/**
 * POST /api/matching/find-therapists
 * Find and rank therapists based on client needs
 *
 * Request body:
 * {
 *   requiredSpecializations: [
 *     { specializationId, specializationName?, importance: 'critical' | 'preferred' | 'nice_to_have' }
 *   ],
 *   communicationNeeds?: string,
 *   ageGroup?: string,
 *   preferredTimes?: string[],
 *   urgency?: 'urgent' | 'high' | 'standard' | 'low',
 *   maxResults?: number (default: 5, max: 20)
 * }
 *
 * Response:
 * {
 *   matches: [
 *     {
 *       therapistId: string,
 *       matchScore: number,
 *       matchReasoning: string,
 *       details: {
 *         specializationScore: number,
 *         communicationScore: number,
 *         availabilityScore: number,
 *         ageMatchScore: number,
 *         caseloadScore: number
 *       }
 *     }
 *   ],
 *   totalMatches: number
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission - therapists can match for their own clients, admins for all
    if (!hasPermission('matching', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = matchCriteriaSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validatedData.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      requiredSpecializations,
      communicationNeeds,
      ageGroup,
      preferredTimes,
      urgency,
      maxResults,
    } = validatedData.data;

    // Calculate matches
    const matches = await matchingService.calculateMatches(
      tenantId,
      {
        requiredSpecializations,
        communicationNeeds,
        ageGroup,
        preferredTimes,
        urgency,
      },
      maxResults,
    );

    return NextResponse.json({
      matches,
      totalMatches: matches.length,
    });
  } catch (error) {
    console.error('Error finding therapist matches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
