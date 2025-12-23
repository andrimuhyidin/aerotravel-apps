/**
 * API: Complete Onboarding Step
 * POST /api/guide/onboarding/steps/[stepId]/complete
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ stepId: string }>;
};

export const POST = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stepId } = await params;
    const body = await request.json().catch(() => ({}));
    const { completionData, validationResult } = body;

    try {
      const branchContext = await getBranchContext(user.id);

      // Get progress
      const { data: progress, error: progressError } = await (supabase as any)
        .from('guide_onboarding_progress')
        .select('*')
        .eq('guide_id', user.id)
        .maybeSingle();

      if (progressError || !progress) {
        return NextResponse.json(
          { error: 'Onboarding not started' },
          { status: 400 }
        );
      }

      // Get step info
      const { data: step, error: stepError } = await (supabase as any)
        .from('guide_onboarding_steps')
        .select('*')
        .eq('id', stepId)
        .eq('is_active', true)
        .maybeSingle();

      if (stepError || !step) {
        return NextResponse.json({ error: 'Step not found' }, { status: 404 });
      }

      // Check if already completed
      const { data: existing } = await (supabase as any)
        .from('guide_onboarding_step_completions')
        .select('id')
        .eq('progress_id', progress.id)
        .eq('step_id', stepId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          success: true,
          message: 'Step already completed',
          completionId: existing.id,
        });
      }

      // Create completion
      const { data: completion, error: completionError } = await (
        supabase as any
      )
        .from('guide_onboarding_step_completions')
        .insert({
          progress_id: progress.id,
          step_id: stepId,
          completion_data: completionData || {},
          validation_result: validationResult || {},
          status: 'completed',
        })
        .select()
        .single();

      if (completionError) {
        logger.error('Failed to complete step', completionError, {
          guideId: user.id,
          stepId,
        });
        return NextResponse.json(
          { error: 'Failed to complete step' },
          { status: 500 }
        );
      }

      // Calculate completion percentage
      // IMPORTANT: Use same branch filtering logic as steps endpoint

      // Get branch-specific steps first
      const branchQuery = (supabase as any)
        .from('guide_onboarding_steps')
        .select('id')
        .eq('is_active', true)
        .order('step_order', { ascending: true });

      if (branchContext.branchId) {
        branchQuery.eq('branch_id', branchContext.branchId);
      } else {
        branchQuery.is('branch_id', null);
      }

      const { data: branchSteps } = await branchQuery;

      // Get global steps
      const { data: globalSteps } = await (supabase as any)
        .from('guide_onboarding_steps')
        .select('id')
        .is('branch_id', null)
        .eq('is_active', true)
        .order('step_order', { ascending: true });

      // Merge: branch-specific first, then global (avoid duplicates by step_order)
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
      ];

      const { data: completedSteps } = await (supabase as any)
        .from('guide_onboarding_step_completions')
        .select('step_id')
        .eq('progress_id', progress.id)
        .eq('status', 'completed');

      const totalSteps = allSteps.length;
      const completedCount = completedSteps?.length || 0;
      const completionPercentage =
        totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

      // Get next step
      const { data: nextStep } = await (supabase as any)
        .from('guide_onboarding_steps')
        .select('id')
        .eq('is_active', true)
        .gt('step_order', step.step_order)
        .order('step_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      // Update progress
      const isCompleted = completionPercentage >= 100;
      await (supabase as any)
        .from('guide_onboarding_progress')
        .update({
          current_step_id: nextStep?.id || null,
          completion_percentage: completionPercentage,
          status: isCompleted ? 'completed' : 'in_progress',
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id);

      return NextResponse.json({
        success: true,
        completion,
        nextStepId: nextStep?.id || null,
        completionPercentage,
        isCompleted,
      });
    } catch (error) {
      logger.error('Failed to complete onboarding step', error, {
        guideId: user.id,
        stepId,
      });
      return NextResponse.json(
        { error: 'Failed to complete step' },
        { status: 500 }
      );
    }
  }
);
