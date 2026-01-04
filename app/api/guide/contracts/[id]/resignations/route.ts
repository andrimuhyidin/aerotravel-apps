/**
 * API: Guide Contract Resignations (Guide View)
 * GET /api/guide/contracts/[id]/resignations - List own resignations for a contract
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
  const resolvedParams = await context.params;
  const { id: contractId } = resolvedParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get resignations for contract
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;
  const { data: resignations, error } = await withBranchFilter(
    client.from('guide_contract_resignations'),
    branchContext,
  )
    .select('*')
    .eq('contract_id', contractId)
    .eq('guide_id', user.id)
    .order('submitted_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch resignations', error, { contractId });
    return NextResponse.json({ error: 'Failed to fetch resignations' }, { status: 500 });
  }

  return NextResponse.json({ data: resignations || [] });
});
