/**
 * API: Guest Engagement Quiz
 * GET /api/guide/trips/[id]/engagement/quiz - Get quiz questions
 * POST /api/guide/trips/[id]/engagement/quiz - Submit quiz answer
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { generateQuizQuestions } from '@/lib/ai/quiz-generator';
import type { TripContext } from '@/lib/ai/trip-assistant';
import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const submitAnswerSchema = z.object({
  question_id: z.string().uuid(),
  passenger_id: z.string().uuid(),
  answer: z.string(),
});

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

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  // Get quiz questions
  let query = client
    .from('quiz_questions')
    .select('*')
    .eq('is_active', true)
    .limit(limit);

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    query = query.or(`branch_id.eq.${branchContext.branchId},branch_id.is.null`);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data: questions, error } = await query;

  if (error) {
    logger.error('Failed to fetch quiz questions', error, { tripId });
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }

  return NextResponse.json({
    questions: questions || [],
  });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;
  const payload = submitAnswerSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  // Get question
  const { data: question } = await client
    .from('quiz_questions')
    .select('*')
    .eq('id', payload.question_id)
    .single();

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  // Check answer
  let isCorrect = false;
  let pointsEarned = 0;

  if (question.question_type === 'multiple_choice') {
    const options = question.options as Array<{ text: string; is_correct: boolean }> | null;
    const selectedOption = options?.find((opt) => opt.text === payload.answer);
    isCorrect = selectedOption?.is_correct || false;
  } else if (question.question_type === 'true_false') {
    isCorrect = payload.answer.toLowerCase() === question.correct_answer?.toLowerCase();
  } else {
    // Open-ended: manual check (for now, mark as correct if answered)
    isCorrect = payload.answer.trim().length > 0;
  }

  // Calculate points (easy: 10, medium: 20, hard: 30)
  if (isCorrect) {
    const difficultyPoints = {
      easy: 10,
      medium: 20,
      hard: 30,
    };
    pointsEarned = difficultyPoints[question.difficulty as keyof typeof difficultyPoints] || 20;
  }

  // Save score
  const { data: score, error } = await client
    .from('guest_engagement_scores')
    .insert({
      trip_id: tripId,
      passenger_id: payload.passenger_id,
      branch_id: branchContext.branchId,
      activity_type: 'quiz',
      question_id: payload.question_id,
      answer: payload.answer,
      is_correct: isCorrect,
      points_earned: pointsEarned,
      total_points: pointsEarned,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to save quiz answer', error, { tripId, questionId: payload.question_id });
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
  }

  logger.info('Quiz answer submitted', {
    scoreId: score.id,
    tripId,
    questionId: payload.question_id,
    isCorrect,
    pointsEarned,
  });

  return NextResponse.json({
    success: true,
    is_correct: isCorrect,
    points_earned: pointsEarned,
    score,
  });
});

// PUT - Generate quiz questions with AI and save to database
export const PUT = withErrorHandler(async (
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

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  const client = supabase as unknown as any;
  const body = await request.json().catch(() => ({}));
  const count = body.count || 5;

  // Verify guide assignment
  const { data: assignment } = await client
    .from('trip_crews')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!assignment) {
    // Check legacy trip_guides
    const { data: legacyAssignment } = await client
      .from('trip_guides')
      .select('id')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (!legacyAssignment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    // Fetch trip data for context
    const { data: trip } = await client
      .from('trips')
      .select(`
        id,
        trip_code,
        trip_date,
        total_pax,
        package:packages(id, name, destination)
      `)
      .eq('id', tripId)
      .single();

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Fetch itinerary
    const { data: itineraryData } = await client
      .from('trip_itinerary')
      .select('time, activity, location')
      .eq('trip_id', tripId)
      .order('time', { ascending: true });

    const itinerary = (itineraryData || []).map((i: any) => ({
      time: i.time,
      activity: i.activity,
      location: i.location,
    }));

    // Build trip context
    const tripContext: TripContext = {
      tripId,
      tripCode: trip.trip_code || '',
      tripDate: trip.trip_date || '',
      status: 'on_trip',
      totalPax: trip.total_pax || 0,
      packageName: (trip.package as { name: string } | null)?.name,
      itinerary,
    };

    // Generate quiz questions with AI
    const generatedQuestions = await generateQuizQuestions(tripContext, count);

    // Save generated questions to database
    const questionsToInsert = generatedQuestions.map((q) => ({
      branch_id: branchContext.branchId,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options || null,
      correct_answer: q.correct_answer || null,
      category: q.category,
      difficulty: q.difficulty,
      is_active: true,
      created_by: user.id,
    }));

    const { data: savedQuestions, error: insertError } = await client
      .from('quiz_questions')
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      logger.error('Failed to save generated quiz questions', insertError, { tripId });
      return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
    }

    logger.info('Quiz questions generated and saved', {
      tripId,
      count: savedQuestions?.length || 0,
      generatedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      questions: savedQuestions || [],
      message: `Berhasil generate ${savedQuestions?.length || 0} pertanyaan quiz`,
    });
  } catch (error) {
    logger.error('Failed to generate quiz questions', error, { tripId });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quiz questions' },
      { status: 500 }
    );
  }
});
