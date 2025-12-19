/**
 * API: Guide Contract Sanctions (Guide View)
 * GET /api/guide/contracts/[id]/sanctions - List own sanctions
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
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

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify contract belongs to guide
  let contractQuery = client.from('guide_contracts')
    .select('id, guide_id')
    .eq('id', contractId)
    .eq('guide_id', user.id);

  // Apply branch filter manually
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    contractQuery = contractQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: contract, error: contractError } = await contractQuery.single();

  if (contractError || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  if (contract.guide_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get sanctions (simplified - no foreign key joins to avoid errors)
  const { data: sanctions, error } = await client
    .from('guide_contract_sanctions')
    .select('*')
    .eq('contract_id', contractId)
    .eq('guide_id', user.id)
    .order('issued_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch sanctions', error, { contractId });
    return NextResponse.json({ error: 'Failed to fetch sanctions' }, { status: 500 });
  }

  return NextResponse.json({ data: sanctions || [] });
});
