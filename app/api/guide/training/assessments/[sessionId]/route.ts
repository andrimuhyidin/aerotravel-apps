/**
 * API: Training Assessment Submission
 * POST /api/guide/training/assessments/[sessionId] - Submit assessment (self-rating + quiz)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const assessmentSchema = z.object({
  self_rating: z.number().min(1).max(5),
  answers: z.array(
    z.object({
      question_id: z.string().uuid(),
      answer: z.string(),
    })
  ),
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) => {
  const supabase = await createClient();
  const { sessionId } = await params;
  const payload = assessmentSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Verify guide attended the session
  const { data: attendance } = await client
    .from('training_attendance')
    .select('id')
    .eq('session_id', sessionId)
    .eq('guide_id', user.id)
    .eq('status', 'present')
    .single();

  if (!attendance) {
    return NextResponse.json(
      { error: 'You must attend the training session to submit assessment' },
      { status: 403 }
    );
  }

  // Get questions for this session
  const { data: questions, error: questionsError } = await client
    .from('training_assessment_questions')
    .select('*')
    .eq('session_id', sessionId)
    .order('question_order', { ascending: true });

  if (questionsError) {
    logger.error('Failed to fetch assessment questions', questionsError);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'No assessment questions found for this session' }, { status: 404 });
  }

  // Calculate quiz score
  let totalPoints = 0;
  let earnedPoints = 0;
  const answersToInsert = [];

  for (const question of questions) {
    totalPoints += question.points || 1;
    const userAnswer = payload.answers.find((a) => a.question_id === question.id);
    
    if (userAnswer) {
      const isCorrect = userAnswer.answer === question.correct_answer;
      if (isCorrect) {
        earnedPoints += question.points || 1;
      }
      
      answersToInsert.push({
        question_id: question.id,
        answer: userAnswer.answer,
        is_correct: isCorrect,
      });
    }
  }

  const quizScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const quizPassed = quizScore >= 70;

  // Create assessment
  const { data: assessment, error: assessmentError } = await client
    .from('training_assessments')
    .insert({
      session_id: sessionId,
      guide_id: user.id,
      self_rating: payload.self_rating,
      quiz_score: quizScore,
      quiz_passed: quizPassed,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (assessmentError) {
    logger.error('Failed to create assessment', assessmentError);
    return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
  }

  // Insert answers
  if (answersToInsert.length > 0) {
    const answersWithAssessmentId = answersToInsert.map((answer) => ({
      ...answer,
      assessment_id: assessment.id,
    }));

    const { error: answersError } = await client
      .from('training_assessment_answers')
      .insert(answersToInsert.map((answer) => ({
        assessment_id: assessment.id,
        question_id: answer.question_id,
        answer: answer.answer,
        is_correct: answer.is_correct,
      })));

    if (answersError) {
      logger.error('Failed to insert answers', answersError);
      // Don't fail the whole request, assessment is already created
    }
  }

  logger.info('Assessment submitted', {
    assessmentId: assessment.id,
    sessionId,
    guideId: user.id,
    quizScore,
    quizPassed,
  });

  return NextResponse.json({
    assessment: {
      ...assessment,
      quiz_score: quizScore,
      quiz_passed: quizPassed,
    },
    message: quizPassed
      ? 'Assessment submitted successfully. You passed the quiz!'
      : 'Assessment submitted. Quiz score below passing threshold (70%).',
  });
});

