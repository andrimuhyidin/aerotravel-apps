/**
 * Guide Assignment Algorithm
 * Auto-assign trip to best matching guide based on preferences, rating, and workload
 */

import { logger } from '@/lib/utils/logger';
import { sendTextMessage } from './whatsapp';

type GuideCandidate = {
  guide_id: string;
  guide_name: string;
  guide_phone: string | null;
  current_status: 'standby' | 'on_trip' | 'not_available' | null;
  rating: number | null;
  workload_count: number; // Number of trips assigned in the period
  preference_score: number; // 0-100 match score
  total_score: number; // Combined score for ranking
};

type TripInfo = {
  trip_id: string;
  trip_code: string;
  trip_date: string;
  package_id: string;
  package_destination: string | null;
  package_type: 'open_trip' | 'private_trip' | 'corporate' | 'kol_trip' | null;
  duration_days: number | null;
};

type AssignmentResult = {
  guide_id: string;
  guide_name: string;
  score: number;
  reason: string;
};

/**
 * Calculate preference match score (0-100)
 */
function calculatePreferenceScore(
  guidePrefs: {
    favorite_destinations: string[] | null;
    preferred_trip_types: string[] | null;
    preferred_durations: string[] | null;
  } | null,
  tripInfo: TripInfo
): number {
  if (!guidePrefs) return 50; // Neutral score if no preferences

  let score = 0;
  let factors = 0;

  // Destination match (40 points)
  if (guidePrefs.favorite_destinations && guidePrefs.favorite_destinations.length > 0) {
    factors++;
    const destMatch = guidePrefs.favorite_destinations.some((dest) =>
      tripInfo.package_destination?.toLowerCase().includes(dest.toLowerCase()) ||
      dest.toLowerCase().includes(tripInfo.package_destination?.toLowerCase() ?? '')
    );
    score += destMatch ? 40 : 0;
  }

  // Trip type match (30 points)
  if (guidePrefs.preferred_trip_types && guidePrefs.preferred_trip_types.length > 0 && tripInfo.package_type) {
    factors++;
    const typeMatch = guidePrefs.preferred_trip_types.includes(tripInfo.package_type);
    score += typeMatch ? 30 : 0;
  }

  // Duration match (30 points)
  if (guidePrefs.preferred_durations && guidePrefs.preferred_durations.length > 0 && tripInfo.duration_days) {
    factors++;
    let durationLabel = '4D+';
    if (tripInfo.duration_days === 1) durationLabel = '1D';
    else if (tripInfo.duration_days === 2) durationLabel = '2D';
    else if (tripInfo.duration_days === 3) durationLabel = '3D';

    const durationMatch = guidePrefs.preferred_durations.includes(durationLabel as '1D' | '2D' | '3D' | '4D+');
    score += durationMatch ? 30 : 0;
  }

  // If no preferences set, return neutral score
  if (factors === 0) return 50;

  return score;
}

/**
 * Calculate workload penalty (higher workload = lower score)
 */
function calculateWorkloadPenalty(workloadCount: number): number {
  if (workloadCount === 0) return 0;
  if (workloadCount <= 2) return 5;
  if (workloadCount <= 5) return 15;
  return 30; // Heavy penalty for overloaded guides
}

/**
 * Calculate rating bonus (higher rating = higher score)
 */
function calculateRatingBonus(rating: number | null): number {
  if (!rating) return 0;
  if (rating >= 4.5) return 20;
  if (rating >= 4.0) return 15;
  if (rating >= 3.5) return 10;
  return 5;
}

/**
 * Auto-assign trip to best matching guide
 * Returns assignment result with reasoning
 */
export async function autoAssignTrip(
  tripInfo: TripInfo,
  candidates: GuideCandidate[]
): Promise<AssignmentResult | null> {
  if (candidates.length === 0) {
    logger.warn('No guide candidates available for auto-assignment', { tripCode: tripInfo.trip_code });
    return null;
  }

  // Filter only available guides (standby status)
  const availableCandidates = candidates.filter(
    (c) => c.current_status === 'standby' || c.current_status === null
  );

  if (availableCandidates.length === 0) {
    logger.warn('No available guides for auto-assignment', { tripCode: tripInfo.trip_code });
    return null;
  }

  // Calculate total scores
  const scoredCandidates = availableCandidates.map((candidate) => {
    const preferenceScore = candidate.preference_score; // Already calculated
    const workloadPenalty = calculateWorkloadPenalty(candidate.workload_count);
    const ratingBonus = calculateRatingBonus(candidate.rating);

    const totalScore = preferenceScore - workloadPenalty + ratingBonus;

    return {
      ...candidate,
      total_score: totalScore,
    };
  });

  // Sort by total score (descending) and workload (ascending) as tiebreaker
  scoredCandidates.sort((a, b) => {
    if (b.total_score !== a.total_score) {
      return b.total_score - a.total_score;
    }
    return a.workload_count - b.workload_count;
  });

  const bestMatch = scoredCandidates[0];

  if (!bestMatch) {
    return null;
  }

  // Build reason string
  const reasons: string[] = [];
  if (bestMatch.preference_score >= 70) reasons.push('Preferensi sangat cocok');
  else if (bestMatch.preference_score >= 50) reasons.push('Preferensi cocok');
  if (bestMatch.rating && bestMatch.rating >= 4.0) reasons.push(`Rating tinggi (${bestMatch.rating.toFixed(1)})`);
  if (bestMatch.workload_count <= 2) reasons.push('Beban kerja seimbang');

  return {
    guide_id: bestMatch.guide_id,
    guide_name: bestMatch.guide_name,
    score: bestMatch.total_score,
    reason: reasons.join(', ') || 'Guide tersedia',
  };
}

/**
 * Send assignment notification to guide via WhatsApp
 */
export async function notifyGuideAssignment(
  guidePhone: string,
  tripCode: string,
  tripDate: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const dateStr = new Date(tripDate).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const text = `📋 *Penugasan Trip Baru*

Anda ditugaskan ke trip:
*${tripCode}*
📅 Tanggal: ${dateStr}

Silakan buka aplikasi Guide untuk melihat detail trip dan mulai persiapan.

Selamat bekerja! 🎉`;

    const result = await sendTextMessage(guidePhone, text);
    logger.info('Assignment notification sent', {
      guidePhone,
      tripCode,
      messageId: result.messages[0]?.id,
    });
    return { success: true, messageId: result.messages[0]?.id };
  } catch (error) {
    logger.error('Failed to send assignment notification', error, {
      guidePhone,
      tripCode,
    });
    return { success: false };
  }
}

// Export helper for use in API routes
export { calculatePreferenceScore };
