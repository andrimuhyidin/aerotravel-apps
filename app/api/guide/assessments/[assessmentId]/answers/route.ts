/**
 * API: Save Assessment Answers (Auto-save)
 * POST /api/guide/assessments/[assessmentId]/answers
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ assessmentId: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { assessmentId } = await params;
  const body = await request.json().catch(() => ({}));
  const { answers } = body;

  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'answers is required' }, { status: 400 });
  }

  try {
    // Check assessment exists and belongs to user
    const { data: assessment, error: assessmentError } = await (supabase as any)
      .from('guide_assessments')
      .select('id, status')
      .eq('id', assessmentId)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (assessment.status === 'completed') {
      return NextResponse.json({ error: 'Assessment already completed' }, { status: 400 });
    }

    // Update answers (merge with existing)
    const { data: currentAssessment } = await (supabase as any)
      .from('guide_assessments')
      .select('answers')
      .eq('id', assessmentId)
      .single();

    const currentAnswers = currentAssessment?.answers && typeof currentAssessment.answers === 'object' 
      ? currentAssessment.answers as Record<string, unknown>
      : {};
    
    const mergedAnswers = {
      ...currentAnswers,
      ...answers,
    };

    const { error: updateError } = await (supabase as any)
      .from('guide_assessments')
      .update({
        answers: mergedAnswers,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assessmentId);

    if (updateError) {
      logger.error('Failed to save answers', updateError, { assessmentId });
      return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Answers saved',
    });
  } catch (error) {
    logger.error('Failed to save assessment answers', error, { assessmentId });
    return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 });
  }
});
