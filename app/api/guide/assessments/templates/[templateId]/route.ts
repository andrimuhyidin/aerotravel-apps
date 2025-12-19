/**
 * API: Get Assessment Template
 * GET /api/guide/assessments/templates/[templateId]
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ templateId: string }>;
};

export const GET = withErrorHandler(async (_request: NextRequest, { params }: RouteParams) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { templateId } = await params;
  const branchContext = await getBranchContext(user.id);

  try {
    // Try branch-specific first, then global
    const branchQuery = (supabase as any)
      .from('guide_assessment_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true);

    if (branchContext.branchId) {
      branchQuery.eq('branch_id', branchContext.branchId);
    } else {
      branchQuery.is('branch_id', null);
    }

    const { data: branchTemplate } = await branchQuery.maybeSingle();

    const { data: globalTemplate } = await (supabase as any)
      .from('guide_assessment_templates')
      .select('*')
      .eq('id', templateId)
      .is('branch_id', null)
      .eq('is_active', true)
      .maybeSingle();

    const template = branchTemplate || globalTemplate;

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      template,
    });
  } catch (error) {
    logger.error('Failed to fetch assessment template', error, { templateId });
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
});
