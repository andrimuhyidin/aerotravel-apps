/**
 * API: Reject Contract
 * POST /api/guide/contracts/[id]/reject - Guide rejects contract
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const rejectSchema = z.object({
  rejection_reason: z.string().min(10, 'Alasan penolakan minimal 10 karakter'),
});

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const resolvedParams = await context.params;
  const { id: contractId } = resolvedParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = rejectSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get contract
  const { data: contract, error: contractError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .select('*')
    .eq('id', contractId)
    .eq('guide_id', user.id)
    .single();

  if (contractError || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  // Validate status
  if (contract.status !== 'pending_signature') {
    return NextResponse.json(
      { error: `Contract tidak dapat ditolak. Status: ${contract.status}` },
      { status: 400 }
    );
  }

  // Update contract
  const now = new Date().toISOString();
  const { data: updatedContract, error: updateError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .update({
      status: 'rejected',
      rejected_at: now,
      rejection_reason: body.rejection_reason,
      updated_at: now,
    })
    .eq('id', contractId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to reject contract', updateError, { contractId });
    return NextResponse.json({ error: 'Gagal menolak kontrak' }, { status: 500 });
  }

  logger.info('Contract rejected by guide', {
    contractId,
    guideId: user.id,
    reason: body.rejection_reason,
  });

  // Notify admin
  try {
    const { createInAppNotification } = await import('@/lib/integrations/contract-notifications');
    
    if (contract.created_by) {
      await createInAppNotification(
        contract.created_by,
        'contract_expiring', // Reuse type
        'Kontrak Ditolak Guide',
        `Guide telah menolak kontrak ${contract.contract_number || contractId}. Alasan: ${body.rejection_reason}`,
        contractId
      );
    }
  } catch (error) {
    logger.error('Failed to send notification', error, { contractId });
    // Don't fail the request if notification fails
  }

  return NextResponse.json({
    success: true,
    contract: updatedContract,
    message: 'Kontrak telah ditolak',
  });
});
