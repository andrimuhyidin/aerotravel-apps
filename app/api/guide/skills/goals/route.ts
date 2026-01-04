/**
 * API: Skill Goals
 * GET /api/guide/skills/goals - Get skill goals
 * POST /api/guide/skills/goals - Create skill goal
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
    const { data: goals, error: goalsError } = await (supabase as any)
      .from('guide_skill_goals')
      .select(`
        *,
        skill:guide_skills_catalog(*)
      `)
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false });

    if (goalsError) {
      logger.error('Failed to fetch skill goals', goalsError, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    return NextResponse.json({
      goals: goals || [],
    });
  } catch (error) {
    logger.error('Failed to fetch skill goals', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { skillId, targetLevel, targetDate, priority } = body;

  if (!skillId || !targetLevel) {
    return NextResponse.json({ error: 'skillId and targetLevel are required' }, { status: 400 });
  }

  try {
    // Check if skill exists
    const { data: skillCatalog, error: catalogError } = await (supabase as any)
      .from('guide_skills_catalog')
      .select('*')
      .eq('id', skillId)
      .eq('is_active', true)
      .maybeSingle();

    if (catalogError || !skillCatalog) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Check if goal already exists
    const { data: existing } = await (supabase as any)
      .from('guide_skill_goals')
      .select('id')
      .eq('guide_id', user.id)
      .eq('skill_id', skillId)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      // Update existing goal
      const { data: updated, error: updateError } = await (supabase as any)
        .from('guide_skill_goals')
        .update({
          target_level: targetLevel,
          target_date: targetDate || null,
          priority: priority || 'medium',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select(`
          *,
          skill:guide_skills_catalog(*)
        `)
        .single();

      if (updateError) {
        logger.error('Failed to update skill goal', updateError, { guideId: user.id, skillId });
        return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        goal: updated,
      });
    }

    // Create new goal
    const { data: newGoal, error: insertError } = await (supabase as any)
      .from('guide_skill_goals')
      .insert({
        guide_id: user.id,
        skill_id: skillId,
        target_level: targetLevel,
        target_date: targetDate || null,
        priority: priority || 'medium',
        status: 'active',
      })
      .select(`
        *,
        skill:guide_skills_catalog(*)
      `)
      .single();

    if (insertError) {
      logger.error('Failed to create skill goal', insertError, { guideId: user.id, skillId });
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      goal: newGoal,
    });
  } catch (error) {
    logger.error('Failed to create skill goal', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
});
