/**
 * API: Guide Onboarding Progress
 * GET /api/guide/onboarding/progress - Get onboarding progress
 * POST /api/guide/onboarding/start - Start onboarding
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
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

  try {
    // Get progress
    const { data: progress, error: progressError } = await (supabase as any)
      .from('guide_onboarding_progress')
      .select(`
        *,
        current_step:guide_onboarding_steps(*)
      `)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (progressError) {
      logger.error('Failed to fetch onboarding progress', progressError, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    // Get completed steps
    if (progress) {
      const { data: completions } = await (supabase as any)
        .from('guide_onboarding_step_completions')
        .select('step_id, status, completed_at')
        .eq('progress_id', progress.id);

      return NextResponse.json({
        progress,
        completedSteps: (completions || []).map((c: { step_id: string }) => c.step_id),
      });
    }

    return NextResponse.json({
      progress: null,
      completedSteps: [],
    });
  } catch (error) {
    logger.error('Failed to fetch onboarding progress', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
});

export const POST = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if progress already exists
    const { data: existing } = await (supabase as any)
      .from('guide_onboarding_progress')
      .select('id')
      .eq('guide_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        progressId: existing.id,
        message: 'Onboarding already started',
      });
    }

    // Get first step
    const { data: firstStep } = await (supabase as any)
      .from('guide_onboarding_steps')
      .select('id')
      .eq('is_active', true)
      .order('step_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    // Create progress
    const { data: progress, error: progressError } = await (supabase as any)
      .from('guide_onboarding_progress')
      .insert({
        guide_id: user.id,
        current_step_id: firstStep?.id || null,
        status: 'in_progress',
        completion_percentage: 0,
      })
      .select()
      .single();

    if (progressError) {
      logger.error('Failed to start onboarding', progressError, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to start onboarding' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      progressId: progress.id,
      progress,
    });
  } catch (error) {
    logger.error('Failed to start onboarding', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to start onboarding' }, { status: 500 });
  }
});
