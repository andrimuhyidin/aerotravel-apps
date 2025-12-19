/**
 * API: Skills Catalog
 * GET /api/guide/skills/catalog?category=language|activity|safety
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
  const category = searchParams.get('category');

  const branchContext = await getBranchContext(user.id);

  try {
    // Get branch-specific and global skills
    const branchQuery = (supabase as any)
      .from('guide_skills_catalog')
      .select('*')
      .eq('is_active', true);

    if (category) {
      branchQuery.eq('category', category);
    }

    if (branchContext.branchId) {
      branchQuery.eq('branch_id', branchContext.branchId);
    } else {
      branchQuery.is('branch_id', null);
    }

    const { data: branchSkills } = await branchQuery.order('display_order', { ascending: true });

    const globalQuery = (supabase as any)
      .from('guide_skills_catalog')
      .select('*')
      .eq('is_active', true)
      .is('branch_id', null);

    if (category) {
      globalQuery.eq('category', category);
    }

    const { data: globalSkills } = await globalQuery;

    const branchSkillsList = branchSkills || [];
    const globalSkillsList = globalSkills || [];
    const allSkills = [
      ...branchSkillsList,
      ...globalSkillsList.filter((g: { id: string }) => !branchSkillsList.find((b: { id: string }) => b.id === g.id)),
    ].sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order);

    return NextResponse.json({
      skills: allSkills,
    });
  } catch (error) {
    logger.error('Failed to fetch skills catalog', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch skills catalog' }, { status: 500 });
  }
});
