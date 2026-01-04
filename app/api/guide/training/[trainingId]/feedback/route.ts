/**
 * API: Trainer Feedback
 * GET /api/guide/training/[trainingId]/feedback - Get feedback for training
 * POST /api/guide/training/[trainingId]/feedback - Submit feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const feedbackSchema = z.object({
  trainerId: z.string().uuid().optional(),
  overallRating: z.number().min(1).max(5),
  contentQuality: z.number().min(1).max(5).optional(),
  trainerEffectiveness: z.number().min(1).max(5).optional(),
  materialClarity: z.number().min(1).max(5).optional(),
  practicalApplicability: z.number().min(1).max(5).optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  suggestions: z.string().optional(),
  additionalComments: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ trainingId: string }> }
) => {
  const supabase = await createClient();
  const { trainingId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get feedback for this training
  const { data: feedback, error } = await withBranchFilter(
    client.from('trainer_feedback'),
    branchContext,
  )
    .select(`
      id,
      overall_rating,
      content_quality,
      trainer_effectiveness,
      material_clarity,
      practical_applicability,
      strengths,
      improvements,
      suggestions,
      additional_comments,
      feedback_date,
      is_anonymous,
      guide:users!trainer_feedback_guide_id_fkey(
        id,
        full_name
      )
    `)
    .eq('training_id', trainingId)
    .order('feedback_date', { ascending: false });

  if (error) {
    logger.error('Failed to fetch feedback', error, { trainingId });
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }

  // Check if user has already submitted feedback
  const { data: userFeedback } = await client
    .from('trainer_feedback')
    .select('id')
    .eq('training_id', trainingId)
    .eq('guide_id', user.id)
    .maybeSingle();

  return NextResponse.json({
    feedback: (feedback || []).map((f: any) => ({
      id: f.id,
      overallRating: f.overall_rating,
      contentQuality: f.content_quality,
      trainerEffectiveness: f.trainer_effectiveness,
      materialClarity: f.material_clarity,
      practicalApplicability: f.practical_applicability,
      strengths: f.strengths,
      improvements: f.improvements,
      suggestions: f.suggestions,
      additionalComments: f.additional_comments,
      feedbackDate: f.feedback_date,
      isAnonymous: f.is_anonymous,
      guideName: f.is_anonymous ? 'Anonymous' : f.guide?.full_name || 'Unknown',
    })),
    hasSubmitted: !!userFeedback,
    userFeedbackId: userFeedback?.id || null,
  });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ trainingId: string }> }
) => {
  const supabase = await createClient();
  const { trainingId } = await params;
  const payload = feedbackSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify training belongs to this guide
  const { data: training, error: trainingError } = await client
    .from('guide_training_records')
    .select('id, guide_id, trainer_id')
    .eq('id', trainingId)
    .eq('guide_id', user.id)
    .single();

  if (trainingError || !training) {
    return NextResponse.json({ error: 'Training not found' }, { status: 404 });
  }

  // Check if feedback already exists
  const { data: existingFeedback } = await client
    .from('trainer_feedback')
    .select('id')
    .eq('training_id', trainingId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (existingFeedback) {
    return NextResponse.json(
      { error: 'Feedback already submitted' },
      { status: 400 }
    );
  }

  // Create feedback
  const { data: feedback, error: feedbackError } = await withBranchFilter(
    client.from('trainer_feedback'),
    branchContext,
  )
    .insert({
      training_id: trainingId,
      guide_id: user.id,
      trainer_id: payload.trainerId || training.trainer_id || null,
      branch_id: branchContext.branchId,
      overall_rating: payload.overallRating,
      content_quality: payload.contentQuality || null,
      trainer_effectiveness: payload.trainerEffectiveness || null,
      material_clarity: payload.materialClarity || null,
      practical_applicability: payload.practicalApplicability || null,
      strengths: payload.strengths || null,
      improvements: payload.improvements || null,
      suggestions: payload.suggestions || null,
      additional_comments: payload.additionalComments || null,
      is_anonymous: payload.isAnonymous,
    } as never)
    .select()
    .single();

  if (feedbackError) {
    logger.error('Failed to create feedback', feedbackError, { trainingId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }

  logger.info('Feedback submitted', {
    feedbackId: feedback.id,
    trainingId,
    guideId: user.id,
    rating: payload.overallRating,
  });

  return NextResponse.json({
    success: true,
    feedback: {
      id: feedback.id,
    },
  });
});

