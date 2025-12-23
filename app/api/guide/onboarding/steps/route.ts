/**
 * API: Guide Onboarding Steps
 * GET /api/guide/onboarding/steps - Get available onboarding steps
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);

  try {
    // Get active onboarding steps
    // Priority: branch-specific steps, then global (branch_id = NULL)
    const branchQuery = (supabase as any)
      .from('guide_onboarding_steps')
      .select('*')
      .eq('is_active', true)
      .order('step_order', { ascending: true });

    if (branchContext.branchId) {
      branchQuery.eq('branch_id', branchContext.branchId);
    } else {
      branchQuery.is('branch_id', null);
    }

    const { data: branchSteps, error: branchError } = await branchQuery;

    const { data: globalSteps, error: globalError } = await (supabase as any)
      .from('guide_onboarding_steps')
      .select('*')
      .is('branch_id', null)
      .eq('is_active', true)
      .order('step_order', { ascending: true });

    if (branchError || globalError) {
      logger.error('Failed to fetch onboarding steps', {
        branchError,
        globalError,
        guideId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to fetch onboarding steps' },
        { status: 500 }
      );
    }

    // Merge: branch-specific first, then global (avoid duplicates)
    const branchStepsList = branchSteps || [];
    const globalStepsList = globalSteps || [];
    const allSteps = [
      ...branchStepsList,
      ...globalStepsList.filter(
        (g: { step_order: number; id: string }) =>
          !branchStepsList.find(
            (b: { step_order: number; id: string }) =>
              b.step_order === g.step_order
          )
      ),
    ].sort(
      (a: { step_order: number }, b: { step_order: number }) =>
        a.step_order - b.step_order
    );

    // Get current progress
    const { data: progress } = await (supabase as any)
      .from('guide_onboarding_progress')
      .select('*')
      .eq('guide_id', user.id)
      .maybeSingle();

    // Recalculate progress if exists (same logic as progress endpoint)
    if (progress) {
      // Get completed steps
      const { data: completedSteps } = await (supabase as any)
        .from('guide_onboarding_step_completions')
        .select('step_id')
        .eq('progress_id', progress.id)
        .eq('status', 'completed');

      // Calculate total steps (use allSteps from above which already has branch filtering)
      const totalSteps = allSteps.length;
      const completedCount = completedSteps?.length || 0;
      const recalculatedPercentage =
        totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

      // Update progress if percentage changed
      if (recalculatedPercentage !== progress.completion_percentage) {
        const isCompleted = recalculatedPercentage >= 100;
        await (supabase as any)
          .from('guide_onboarding_progress')
          .update({
            completion_percentage: recalculatedPercentage,
            status: isCompleted ? 'completed' : 'in_progress',
            completed_at: isCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', progress.id);

        // Update progress object for response
        progress.completion_percentage = recalculatedPercentage;
        progress.status = isCompleted ? 'completed' : 'in_progress';
        if (isCompleted && !progress.completed_at) {
          progress.completed_at = new Date().toISOString();
        }
      }
    }

    return NextResponse.json({
      steps: allSteps,
      currentProgress: progress || null,
    });
  } catch (error) {
    logger.error('Failed to fetch onboarding steps', error, {
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to fetch onboarding steps' },
      { status: 500 }
    );
  }
});
