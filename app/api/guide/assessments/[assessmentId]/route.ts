/**
 * API: Get Assessment Details
 * GET /api/guide/assessments/[assessmentId]
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ assessmentId: string }>;
};

export const GET = withErrorHandler(async (_request: NextRequest, { params }: RouteParams) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { assessmentId } = await params;

  try {
    const { data: assessment, error: assessmentError } = await (supabase as any)
      .from('guide_assessments')
      .select(`
        *,
        template:guide_assessment_templates(*)
      `)
      .eq('id', assessmentId)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (assessmentError) {
      logger.error('Failed to fetch assessment', assessmentError, { assessmentId });
      return NextResponse.json({ error: 'Failed to fetch assessment' }, { status: 500 });
    }

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    return NextResponse.json({
      assessment,
    });
  } catch (error) {
    logger.error('Failed to fetch assessment', error, { assessmentId });
    return NextResponse.json({ error: 'Failed to fetch assessment' }, { status: 500 });
  }
});
