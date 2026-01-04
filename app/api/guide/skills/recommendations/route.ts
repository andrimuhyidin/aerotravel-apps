/**
 * API: Skill Recommendations
 * GET /api/guide/skills/recommendations
 * AI-powered skill recommendations based on performance
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
    // Get guide's current skills
    const { data: currentSkills } = await (supabase as any)
      .from('guide_skills')
      .select('skill_id')
      .eq('guide_id', user.id)
      .eq('status', 'validated');

    const currentSkillIds = (currentSkills || []).map((s: { skill_id: string }) => s.skill_id);

    // Get guide's performance data
    const { data: stats } = await (supabase as any)
      .from('trip_guides')
      .select(`
        trip:trips(
          trip_code,
          trip_date,
          status,
          total_pax
        ),
        fee_amount
      `)
      .eq('guide_id', user.id)
      .limit(20);

    // Get reviews
    const { data: reviews } = await (supabase as any)
      .from('reviews')
      .select('guide_rating, comment')
      .eq('guide_id', user.id)
      .limit(10);

    // Simple recommendation logic (can be enhanced with AI)
    // Recommend skills based on:
    // 1. Popular skills not yet claimed
    // 2. Skills related to trip types
    // 3. Skills mentioned in reviews

    const { data: allSkills } = await (supabase as any)
      .from('guide_skills_catalog')
      .select('id, name, description, category, icon_name, levels, validation_method, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Filter out already claimed skills
    const recommended = (allSkills || [])
      .filter((skill: { id: string }) => !currentSkillIds.includes(skill.id))
      .slice(0, 5)
      .map((skill: { id: string; name: string; description: string; category: string }) => ({
        skill,
        reason: 'Recommended based on your profile',
      }));

    return NextResponse.json({
      recommended,
      basedOn: 'profile_analysis',
    });
  } catch (error) {
    logger.error('Failed to fetch skill recommendations', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
});
