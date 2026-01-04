/**
 * API: Assessment History
 * GET /api/guide/assessments/history?templateId=xxx&limit=10&offset=0
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('templateId');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    let query = (supabase as any)
      .from('guide_assessments')
      .select(`
        *,
        template:guide_assessment_templates(*)
      `, { count: 'exact' })
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false });

    if (templateId) {
      query = query.eq('template_id', templateId);
    }

    const { data: assessments, error: assessmentsError, count } = await query
      .range(offset, offset + limit - 1);

    if (assessmentsError) {
      logger.error('Failed to fetch assessment history', assessmentsError, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    return NextResponse.json({
      assessments: assessments || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Failed to fetch assessment history', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
});
