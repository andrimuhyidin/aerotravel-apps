/**
 * API: Guide Skills
 * GET /api/guide/skills - Get guide's skills
 * POST /api/guide/skills/claim - Claim a skill
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
    const { data: skills, error: skillsError } = await (supabase as any)
      .from('guide_skills')
      .select(`
        *,
        skill:guide_skills_catalog(*)
      `)
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false });

    if (skillsError) {
      logger.error('Failed to fetch guide skills', skillsError, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }

    return NextResponse.json({
      skills: skills || [],
    });
  } catch (error) {
    logger.error('Failed to fetch guide skills', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
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
  const { skillId, level } = body;

  if (!skillId || !level) {
    return NextResponse.json({ error: 'skillId and level are required' }, { status: 400 });
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

    // Check if already claimed
    const { data: existing } = await (supabase as any)
      .from('guide_skills')
      .select('id')
      .eq('guide_id', user.id)
      .eq('skill_id', skillId)
      .maybeSingle();

    if (existing) {
      // Update level
      const { data: updated, error: updateError } = await (supabase as any)
        .from('guide_skills')
        .update({
          current_level: level,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select(`
          *,
          skill:guide_skills_catalog(*)
        `)
        .single();

      if (updateError) {
        logger.error('Failed to update skill', updateError, { guideId: user.id, skillId });
        return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        skill: updated,
      });
    }

    // Claim new skill
    const { data: newSkill, error: insertError } = await (supabase as any)
      .from('guide_skills')
      .insert({
        guide_id: user.id,
        skill_id: skillId,
        current_level: level,
        status: 'claimed',
      })
      .select(`
        *,
        skill:guide_skills_catalog(*)
      `)
      .single();

    if (insertError) {
      logger.error('Failed to claim skill', insertError, { guideId: user.id, skillId });
      return NextResponse.json({ error: 'Failed to claim skill' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      skill: newSkill,
    });
  } catch (error) {
    logger.error('Failed to claim skill', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to claim skill' }, { status: 500 });
  }
});
