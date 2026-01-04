/**
 * API: Start Assessment
 * POST /api/guide/assessments/start
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { templateId } = body;

  if (!templateId) {
    return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
  }

  try {
    // Check if template exists
    const { data: template, error: templateError } = await (supabase as any)
      .from('guide_assessment_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .maybeSingle();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check if there's an in-progress assessment
    const { data: existing } = await (supabase as any)
      .from('guide_assessments')
      .select('id')
      .eq('guide_id', user.id)
      .eq('template_id', templateId)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        assessmentId: existing.id,
        message: 'Assessment already in progress',
      });
    }

    // Create new assessment
    const { data: assessment, error: assessmentError } = await (supabase as any)
      .from('guide_assessments')
      .insert({
        guide_id: user.id,
        template_id: templateId,
        answers: {},
        status: 'in_progress',
      })
      .select()
      .single();

    if (assessmentError) {
      logger.error('Failed to start assessment', assessmentError, { guideId: user.id, templateId });
      return NextResponse.json({ error: 'Failed to start assessment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      assessmentId: assessment.id,
      assessment,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        questions: template.questions,
        assessment_type: template.assessment_type,
        estimated_minutes: template.estimated_minutes,
      },
    });
  } catch (error) {
    logger.error('Failed to start assessment', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to start assessment' }, { status: 500 });
  }
});
