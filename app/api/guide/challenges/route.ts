/**
 * API: Guide Challenges & Targets
 * GET  /api/guide/challenges - Get active challenges (integrated with database)
 * POST /api/guide/challenges - Create challenge
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createChallengeSchema = z.object({
  challenge_type: z.enum(['trip_count', 'rating', 'earnings', 'perfect_month', 'custom']),
  target_value: z.number().positive(),
  target_date: z.string().optional(), // ISO date
  description: z.string().optional(),
  title: z.string().optional(),
  reward_description: z.string().optional(),
});

/**
 * Get current guide stats for challenge progress calculation
 */
async function getGuideStats(client: any, guideId: string) {
  // Get completed trips count
  const { count: completedTrips } = await client
    .from('trip_guides')
    .select('*', { count: 'exact', head: true })
    .eq('guide_id', guideId)
    .not('check_in_at', 'is', null)
    .not('check_out_at', 'is', null);

  // Get average rating
  let avgRating = 0;
  let totalRatings = 0;
  try {
    const { data: guideTrips } = await client
      .from('trip_guides')
      .select('trip_id')
      .eq('guide_id', guideId);

    if (guideTrips && guideTrips.length > 0) {
      const tripIds = guideTrips.map((gt: { trip_id: string }) => gt.trip_id);
      const { data: tripBookings } = await client
        .from('trip_bookings')
        .select('booking_id')
        .in('trip_id', tripIds);

      if (tripBookings && tripBookings.length > 0) {
        const bookingIds = tripBookings.map((tb: { booking_id: string }) => tb.booking_id);
        const { data: reviews } = await client
          .from('reviews')
          .select('guide_rating')
          .in('booking_id', bookingIds)
          .not('guide_rating', 'is', null);

        if (reviews && reviews.length > 0) {
          const ratings = reviews
            .map((r: { guide_rating: number | null }) => r.guide_rating)
            .filter((r: number | null): r is number => r !== null && r > 0);
          totalRatings = ratings.length;
          if (ratings.length > 0) {
            avgRating = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;
          }
        }
      }
    }
  } catch (error) {
    logger.warn('Failed to fetch ratings for challenges', { error, guideId });
  }

  // Get wallet balance
  const { data: wallet } = await client
    .from('guide_wallets')
    .select('balance')
    .eq('guide_id', guideId)
    .maybeSingle();

  const currentBalance = Number(wallet?.balance || 0);

  return {
    completedTrips: completedTrips || 0,
    averageRating: Math.round(avgRating * 10) / 10,
    totalRatings,
    totalEarnings: currentBalance,
  };
}

/**
 * Auto-create default challenges if they don't exist
 */
async function ensureDefaultChallenges(
  client: any,
  guideId: string,
  stats: { completedTrips: number; averageRating: number; totalEarnings: number }
) {
  // Check if guide already has challenges
  const { data: existingChallenges } = await client
    .from('guide_challenges')
    .select('id, challenge_type')
    .eq('guide_id', guideId)
    .in('status', ['active', 'completed']);

  const existingTypes = new Set(
    (existingChallenges || []).map((c: { challenge_type: string }) => c.challenge_type)
  );

  const defaultChallenges = [
    {
      challenge_type: 'trip_count',
      title: 'Selesaikan 10 Trip',
      description: 'Selesaikan 10 trip untuk mendapatkan badge',
      target_value: 10,
      target_date: null,
      reward_description: 'Badge "10 Trips"',
    },
    {
      challenge_type: 'rating',
      title: 'Pertahankan Rating 5.0',
      description: 'Pertahankan rating 5.0 selama 1 bulan',
      target_value: 5.0,
      target_date: null,
      reward_description: 'Perfect Rating Badge',
    },
    {
      challenge_type: 'earnings',
      title: 'Raih Rp 5 Juta',
      description: 'Kumpulkan total pendapatan Rp 5.000.000',
      target_value: 5000000,
      target_date: null,
      reward_description: 'High Earner Badge',
    },
  ];

  const toCreate = defaultChallenges.filter((c) => !existingTypes.has(c.challenge_type));

  if (toCreate.length > 0) {
    const inserts = toCreate.map((challenge) => ({
      guide_id: guideId,
      ...challenge,
      current_value: 0,
      status: 'active',
    }));

    const { error: insertError } = await client.from('guide_challenges').insert(inserts);

    if (insertError) {
      logger.error('Failed to create default challenges', insertError, { guideId });
    } else {
      logger.info('Created default challenges', { guideId, count: toCreate.length });
    }
  }
}

/**
 * Update challenge progress and status based on current stats
 */
async function updateChallengeProgress(
  client: any,
  guideId: string,
  stats: { completedTrips: number; averageRating: number; totalEarnings: number }
) {
  const { data: activeChallenges } = await client
    .from('guide_challenges')
    .select('*')
    .eq('guide_id', guideId)
    .in('status', ['active', 'paused']);

  if (!activeChallenges || activeChallenges.length === 0) {
    return;
  }

  const now = new Date();
  const updates: Array<{
    id: string;
    current_value: number;
    status: string;
    completed_at?: string;
  }> = [];

  for (const challenge of activeChallenges) {
    let currentValue = 0;
    let isCompleted = false;

    switch (challenge.challenge_type) {
      case 'trip_count':
        currentValue = stats.completedTrips;
        isCompleted = currentValue >= Number(challenge.target_value);
        break;
      case 'rating':
        currentValue = stats.averageRating;
        isCompleted = currentValue >= Number(challenge.target_value);
        break;
      case 'earnings':
        currentValue = stats.totalEarnings;
        isCompleted = currentValue >= Number(challenge.target_value);
        break;
      default:
        continue;
    }

    // Check if deadline passed
    const targetDate = challenge.target_date ? new Date(challenge.target_date) : null;
    const isExpired = targetDate && targetDate < now && !isCompleted;

    const newStatus = isCompleted
      ? 'completed'
      : isExpired
        ? 'failed'
        : challenge.status;

    if (
      Number(challenge.current_value) !== currentValue ||
      challenge.status !== newStatus
    ) {
      updates.push({
        id: challenge.id,
        current_value: currentValue,
        status: newStatus,
        completed_at: isCompleted ? now.toISOString() : undefined,
      });
    }
  }

  // Batch update
  for (const update of updates) {
    const { completed_at, ...updateData } = update;
    const updatePayload: any = {
      current_value: update.current_value,
      status: update.status,
      updated_at: now.toISOString(),
    };

    if (completed_at) {
      updatePayload.completed_at = completed_at;
    }

    const { error } = await client
      .from('guide_challenges')
      .update(updatePayload)
      .eq('id', update.id);

    if (error) {
      logger.error('Failed to update challenge progress', error, {
        challengeId: update.id,
        guideId,
      });
    }
  }

  if (updates.length > 0) {
    logger.info('Updated challenge progress', { guideId, count: updates.length });
  }
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Get current stats
    const stats = await getGuideStats(client, user.id);

    // Ensure default challenges exist
    await ensureDefaultChallenges(client, user.id, stats);

    // Update progress for existing challenges
    await updateChallengeProgress(client, user.id, stats);

    // Fetch all challenges for this guide
    let challengesQuery = client
      .from('guide_challenges')
      .select('*')
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false });

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      // Note: guide_challenges doesn't have branch_id, but we filter by guide_id which is already scoped
      // This is fine for now
    }

    const { data: challenges, error: challengesError } = await challengesQuery;

    if (challengesError) {
      logger.error('Failed to fetch challenges', challengesError, { guideId: user.id });
      throw new Error('Failed to fetch challenges');
    }

    // Transform to match expected format
    const formattedChallenges = (challenges || []).map((c: any) => ({
      id: c.id,
      challenge_type: c.challenge_type,
      target_value: Number(c.target_value),
      current_value: Number(c.current_value),
      start_date: c.start_date,
      end_date: c.target_date,
      status: c.status as 'active' | 'completed' | 'failed',
      reward_amount: null, // Can be parsed from reward_description if needed
      reward_description: c.reward_description,
      title: c.title,
      description: c.description,
    }));

    return NextResponse.json({ challenges: formattedChallenges });
  } catch (error) {
    logger.error('Failed to get challenges', error, { guideId: user.id });
    throw error;
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = createChallengeSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get current stats to set initial current_value
  const stats = await getGuideStats(client, user.id);

  let initialValue = 0;
  switch (payload.challenge_type) {
    case 'trip_count':
      initialValue = stats.completedTrips;
      break;
    case 'rating':
      initialValue = stats.averageRating;
      break;
    case 'earnings':
      initialValue = stats.totalEarnings;
      break;
    default:
      initialValue = 0;
  }

  const challengeData = {
    guide_id: user.id,
    challenge_type: payload.challenge_type,
    title: payload.title || `Challenge ${payload.challenge_type}`,
    description: payload.description || null,
    target_value: payload.target_value,
    current_value: initialValue,
    target_date: payload.target_date ? new Date(payload.target_date).toISOString().split('T')[0] : null,
    reward_description: null,
    status: 'active',
  };

  const { data: newChallenge, error: insertError } = await client
    .from('guide_challenges')
    .insert(challengeData)
    .select()
    .single();

  if (insertError) {
    logger.error('Failed to create challenge', insertError, { guideId: user.id, payload });
    return NextResponse.json(
      { error: 'Gagal membuat challenge' },
      { status: 500 }
    );
  }

  logger.info('Challenge created', { challengeId: newChallenge.id, guideId: user.id });

  return NextResponse.json({
    success: true,
    challenge: {
      id: newChallenge.id,
      challenge_type: newChallenge.challenge_type,
      target_value: Number(newChallenge.target_value),
      current_value: Number(newChallenge.current_value),
      start_date: newChallenge.start_date,
      end_date: newChallenge.target_date,
      status: newChallenge.status,
      reward_description: newChallenge.reward_description,
      title: newChallenge.title,
      description: newChallenge.description,
    },
  });
});

