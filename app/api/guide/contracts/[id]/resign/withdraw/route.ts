/**
 * API: Withdraw Guide Contract Resignation
 * POST /api/guide/contracts/[id]/resign/withdraw
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
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

  // Get pending resignation
  const { data: resignation, error: resignationError } = await client
    .from('guide_contract_resignations')
    .select('id, status')
    .eq('contract_id', contractId)
    .eq('guide_id', user.id)
    .eq('status', 'pending')
    .single();

  if (resignationError || !resignation) {
    return NextResponse.json(
      { error: 'No pending resignation found' },
      { status: 404 }
    );
  }

  // Withdraw resignation
  const { data: updatedResignation, error: updateError } = await withBranchFilter(
    client.from('guide_contract_resignations'),
    branchContext,
  )
    .update({
      status: 'withdrawn',
      withdrawn_at: new Date().toISOString(),
    })
    .eq('id', resignation.id)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to withdraw resignation', updateError, { resignationId: resignation.id });
    return NextResponse.json({ error: 'Failed to withdraw resignation' }, { status: 500 });
  }

  logger.info('Resignation withdrawn', { resignationId: resignation.id, contractId });

  return NextResponse.json({
    data: updatedResignation,
    message: 'Pengajuan resign berhasil ditarik kembali.',
  });
});
