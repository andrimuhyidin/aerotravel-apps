/**
 * API: Get Assessment Questions
 * GET /api/guide/training/assessments/[sessionId]/questions - Get questions for assessment
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) => {
  const supabase = await createClient();
  const { sessionId } = await params;

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
      { error: 'You must attend the training session to view assessment' },
      { status: 403 }
    );
  }

  // Get questions
  const { data: questions, error } = await client
    .from('training_assessment_questions')
    .select('*')
    .eq('session_id', sessionId)
    .order('question_order', { ascending: true });

  if (error) {
    logger.error('Failed to fetch assessment questions', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }

  return NextResponse.json({ questions: questions || [] });
});

