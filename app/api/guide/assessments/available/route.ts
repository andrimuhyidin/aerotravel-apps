/**
 * API: Available Assessments
 * GET /api/guide/assessments/available?type=self_assessment|performance_review
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
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
  const type = searchParams.get('type'); // 'self_assessment', 'performance_review', 'skills_evaluation'

  const branchContext = await getBranchContext(user.id);

  try {
    // Get available templates
    // Priority: branch-specific, then global
    const branchQuery = supabase
      .from('guide_assessment_templates')
      .select('*')
      .eq('is_active', true);

    if (type) {
      branchQuery.eq('category', type);
    }

    if (branchContext.branchId) {
      branchQuery.eq('branch_id', branchContext.branchId);
    } else {
      branchQuery.is('branch_id', null);
    }

    const { data: branchTemplates } = await branchQuery.order('created_at', { ascending: false });

    const globalQuery = supabase
      .from('guide_assessment_templates')
      .select('*')
      .eq('is_active', true)
      .is('branch_id', null);

    if (type) {
      globalQuery.eq('category', type);
    }

    const { data: globalTemplates } = await globalQuery;

    const branchTemplatesList = (branchTemplates || []) as Array<{ id: string; [key: string]: unknown }>;
    const globalTemplatesList = (globalTemplates || []) as Array<{ id: string; [key: string]: unknown }>;
    const allTemplates = [
      ...branchTemplatesList,
      ...globalTemplatesList.filter((g) => !branchTemplatesList.find((b) => b.id === g.id)),
    ] as Array<{ id: string; is_recurring?: boolean; recurrence_interval?: number; [key: string]: unknown }>;

    // Get recent assessments to check if recurring assessment is due
    const { data: recentAssessments } = await (supabase as any)
      .from('guide_assessments')
      .select('template_id, completed_at')
      .eq('guide_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    // Filter templates based on recurrence
    const availableTemplates = (allTemplates as Array<{ id: string; is_recurring?: boolean; recurrence_interval?: number }>).filter((template) => {
      if (!template.is_recurring) {
        // Check if already completed
        const completed = (recentAssessments as Array<{ template_id: string }> | undefined)?.find((a) => a.template_id === template.id);
        return !completed; // Show if not completed
      }

      // For recurring, check if due
      if (template.recurrence_interval) {
        const lastCompleted = (recentAssessments as Array<{ template_id: string; completed_at: string }> | undefined)?.find((a) => a.template_id === template.id);
        if (!lastCompleted) return true; // Never completed, show it

        const lastDate = new Date(lastCompleted.completed_at);
        const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince >= template.recurrence_interval; // Due if interval passed
      }

      return true;
    });

    return NextResponse.json({
      templates: availableTemplates,
    });
  } catch (error) {
    logger.error('Failed to fetch available assessments', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
});
