/**
 * API: Training Quiz
 * GET /api/guide/training/quiz/[quizId] - Get quiz details
 * POST /api/guide/training/quiz/[quizId]/attempt - Submit quiz attempt
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const attemptSchema = z.object({
  answers: z.record(z.string(), z.union([
    z.string(), // For short answer or true/false
    z.array(z.string()), // For multiple choice (can select multiple)
  ])),
  timeTakenSeconds: z.number().optional(),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) => {
  const supabase = await createClient();
  const { quizId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get quiz details
  const { data: quiz, error: quizError } = await withBranchFilter(
    client.from('training_quizzes'),
    branchContext,
  )
    .select(`
      id,
      quiz_title,
      quiz_description,
      passing_score,
      time_limit_minutes,
      max_attempts,
      training_id,
      created_at
    `)
    .eq('id', quizId)
    .eq('is_active', true)
    .single();

  if (quizError || !quiz) {
    logger.error('Quiz not found', quizError, { quizId, guideId: user.id });
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  // Get questions (without correct answers for security)
  const { data: questions, error: questionsError } = await client
    .from('quiz_questions')
    .select('id, question_text, question_type, options, points, order_index')
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true });

  if (questionsError) {
    logger.error('Failed to fetch questions', questionsError, { quizId });
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }

  // Get user's previous attempts
  const { data: attempts, error: attemptsError } = await client
    .from('quiz_attempts')
    .select('id, score, passed, completed_at, started_at')
    .eq('quiz_id', quizId)
    .eq('guide_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(10);

  if (attemptsError) {
    logger.warn('Failed to fetch attempts', { 
      error: attemptsError instanceof Error ? attemptsError.message : String(attemptsError),
      quizId 
    });
  }

  // Check if user has reached max attempts
  const attemptCount = attempts?.length || 0;
  const canAttempt = attemptCount < (quiz.max_attempts || 3);
  const bestScore = attempts && attempts.length > 0
    ? Math.max(...attempts.map((a: any) => a.score || 0))
    : 0;

  return NextResponse.json({
    quiz: {
      ...quiz,
      canAttempt,
      attemptCount,
      bestScore,
      remainingAttempts: Math.max(0, (quiz.max_attempts || 3) - attemptCount),
    },
    questions: (questions || []).map((q: any) => ({
      id: q.id,
      questionText: q.question_text,
      questionType: q.question_type,
      options: q.options, // For multiple choice
      points: q.points,
      orderIndex: q.order_index,
    })),
    previousAttempts: (attempts || []).map((a: any) => ({
      id: a.id,
      score: a.score,
      passed: a.passed,
      completedAt: a.completed_at,
      startedAt: a.started_at,
    })),
  });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) => {
  const supabase = await createClient();
  const { quizId } = await params;
  const payload = attemptSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get quiz details
  const { data: quiz, error: quizError } = await withBranchFilter(
    client.from('training_quizzes'),
    branchContext,
  )
    .select('id, passing_score, max_attempts, training_id')
    .eq('id', quizId)
    .eq('is_active', true)
    .single();

  if (quizError || !quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  // Check attempt limit
  const { data: previousAttempts } = await client
    .from('quiz_attempts')
    .select('id')
    .eq('quiz_id', quizId)
    .eq('guide_id', user.id);

  if ((previousAttempts?.length || 0) >= (quiz.max_attempts || 3)) {
    return NextResponse.json(
      { error: 'Maximum attempts reached' },
      { status: 400 }
    );
  }

  // Get questions with correct answers for scoring
  const { data: questions, error: questionsError } = await client
    .from('quiz_questions')
    .select('id, question_type, options, correct_answer, points')
    .eq('quiz_id', quizId);

  if (questionsError || !questions) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }

  // Score the attempt
  let totalPoints = 0;
  let earnedPoints = 0;
  const answerDetails: Record<string, { answer: unknown; isCorrect: boolean; points: number }> = {};

  questions.forEach((question: any) => {
    totalPoints += question.points || 1;
    const userAnswer = payload.answers[question.id];
    let isCorrect = false;

    if (question.question_type === 'multiple_choice') {
      // Check if selected options match correct options
      const correctOptions = (question.options || []).filter((opt: any) => opt.is_correct);
      const correctOptionIds = correctOptions.map((opt: any, idx: number) => idx.toString());
      const userSelected = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      
      isCorrect = correctOptionIds.length === userSelected.length &&
        correctOptionIds.every((id: string) => userSelected.includes(id));
    } else if (question.question_type === 'true_false') {
      isCorrect = userAnswer === question.correct_answer;
    } else {
      // Short answer - simple string comparison (case-insensitive)
      isCorrect = String(userAnswer || '').toLowerCase().trim() ===
        String(question.correct_answer || '').toLowerCase().trim();
    }

    const points = isCorrect ? (question.points || 1) : 0;
    earnedPoints += points;

    answerDetails[question.id] = {
      answer: userAnswer,
      isCorrect,
      points,
    };
  });

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= (quiz.passing_score || 70);

  // Create attempt record
  const { data: attempt, error: attemptError } = await withBranchFilter(
    client.from('quiz_attempts'),
    branchContext,
  )
    .insert({
      quiz_id: quizId,
      guide_id: user.id,
      training_id: quiz.training_id || null,
      branch_id: branchContext.branchId,
      score,
      total_points: totalPoints,
      earned_points: earnedPoints,
      passed,
      time_taken_seconds: payload.timeTakenSeconds || null,
      completed_at: new Date().toISOString(),
      answers: answerDetails as unknown as any,
    } as never)
    .select()
    .single();

  if (attemptError) {
    logger.error('Failed to create quiz attempt', attemptError, { quizId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 });
  }

  logger.info('Quiz attempt completed', {
    quizId,
    guideId: user.id,
    score,
    passed,
  });

  return NextResponse.json({
    success: true,
    attempt: {
      id: attempt.id,
      score,
      passed,
      totalPoints,
      earnedPoints,
      answerDetails,
    },
  });
});

