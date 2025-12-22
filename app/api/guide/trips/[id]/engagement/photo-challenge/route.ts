/**
 * API: Photo Challenge
 * GET /api/guide/trips/[id]/engagement/photo-challenge - Get photo challenges
 * POST /api/guide/trips/[id]/engagement/photo-challenge - Submit photo challenge
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const submitPhotoSchema = z.object({
  passengerId: z.string().uuid(),
  photoUrl: z.string().url(),
  challengeType: z.enum(['sunset', 'marine_life', 'best_selfie', 'landscape', 'group_photo', 'action_shot']),
  points: z.number().min(0).default(10),
});

const PHOTO_CHALLENGES = [
  {
    type: 'sunset',
    title: 'Sunset Photo',
    description: 'Ambil foto sunset terbaik',
    points: 20,
  },
  {
    type: 'marine_life',
    title: 'Marine Life',
    description: 'Foto hewan laut yang menarik',
    points: 25,
  },
  {
    type: 'best_selfie',
    title: 'Best Selfie',
    description: 'Selfie terbaik dengan pemandangan',
    points: 15,
  },
  {
    type: 'landscape',
    title: 'Landscape',
    description: 'Foto pemandangan alam yang menakjubkan',
    points: 20,
  },
  {
    type: 'group_photo',
    title: 'Group Photo',
    description: 'Foto grup dengan semua peserta',
    points: 15,
  },
  {
    type: 'action_shot',
    title: 'Action Shot',
    description: 'Foto aksi saat aktivitas',
    points: 20,
  },
];

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify guide assignment
  const client = supabase as unknown as any;
  const { data: assignment } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!assignment && !crewAssignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get submitted photos for this trip
  const { data: submissions, error } = await client
    .from('guest_engagement_scores')
    .select(`
      id,
      passenger_id,
      photo_url,
      photo_challenge_type,
      points_earned,
      created_at,
      passenger:booking_passengers(id, name)
    `)
    .eq('trip_id', tripId)
    .eq('activity_type', 'photo_challenge')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch photo challenges', error, { tripId });
    return NextResponse.json({ error: 'Failed to fetch photo challenges' }, { status: 500 });
  }

  return NextResponse.json({
    challenges: PHOTO_CHALLENGES,
    submissions: (submissions || []).map((s: any) => ({
      id: s.id,
      passengerId: s.passenger_id,
      passengerName: s.passenger?.name || 'Unknown',
      photoUrl: s.photo_url,
      challengeType: s.photo_challenge_type,
      points: s.points_earned,
      submittedAt: s.created_at,
    })),
  });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;
  const payload = submitPhotoSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify guide assignment
  const client = supabase as unknown as any;
  const { data: assignment } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!assignment && !crewAssignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);

  // Get challenge points
  const challenge = PHOTO_CHALLENGES.find((c) => c.type === payload.challengeType);
  const points = challenge?.points || payload.points;

  // Create submission
  const { data: submission, error: submissionError } = await withBranchFilter(
    client.from('guest_engagement_scores'),
    branchContext,
  )
    .insert({
      trip_id: tripId,
      passenger_id: payload.passengerId,
      branch_id: branchContext.branchId,
      activity_type: 'photo_challenge',
      photo_url: payload.photoUrl,
      photo_challenge_type: payload.challengeType,
      points_earned: points,
      total_points: points,
    } as never)
    .select()
    .single();

  if (submissionError) {
    logger.error('Failed to submit photo challenge', submissionError, {
      tripId,
      passengerId: payload.passengerId,
    });
    return NextResponse.json({ error: 'Failed to submit photo' }, { status: 500 });
  }

  logger.info('Photo challenge submitted', {
    submissionId: submission.id,
    tripId,
    passengerId: payload.passengerId,
    challengeType: payload.challengeType,
    points,
  });

  return NextResponse.json({
    success: true,
    submission: {
      id: submission.id,
      points,
    },
  });
});

