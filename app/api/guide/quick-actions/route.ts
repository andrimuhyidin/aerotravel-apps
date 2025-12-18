import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
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

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get global actions (branch_id = NULL) and branch-specific actions
  // RLS policy will handle filtering automatically
  const { data: actions, error } = await client
    .from('guide_quick_actions')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    logger.error('Failed to fetch quick actions', error, { guideId: user.id, branchId: branchContext.branchId });
    return NextResponse.json({ error: 'Failed to fetch quick actions' }, { status: 500 });
  }

  return NextResponse.json({ actions: actions || [] });
});

