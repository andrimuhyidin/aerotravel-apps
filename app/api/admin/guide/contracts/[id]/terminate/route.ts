/**
 * API: Terminate Contract
 * POST /api/admin/guide/contracts/[id]/terminate - Terminate active contract
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const terminateSchema = z.object({
  termination_reason: z.string().min(10, 'Alasan penghentian minimal 10 karakter'),
  effective_date: z.string().date().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const resolvedParams = await context.params;
  const { id: contractId } = resolvedParams;
  const supabase = await createClient();

  // Check admin role
  const isAuthorized = await hasRole([
    'super_admin',
    'ops_admin',
    'finance_manager',
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = terminateSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get contract
  const { data: contract, error: contractError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .select('*')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  // Validate status
  if (contract.status !== 'active') {
    return NextResponse.json(
      { error: `Contract tidak dapat dihentikan. Status: ${contract.status}` },
      { status: 400 }
    );
  }

  // Update contract
  const effectiveDate = body.effective_date || new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  const { data: updatedContract, error: updateError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .update({
      status: 'terminated',
      terminated_at: now,
      termination_reason: body.termination_reason,
      terminated_by: user.id,
      end_date: effectiveDate, // Update end_date to effective_date
      updated_at: now,
    })
    .eq('id', contractId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to terminate contract', updateError, { contractId });
    return NextResponse.json({ error: 'Gagal menghentikan kontrak' }, { status: 500 });
  }

  logger.info('Contract terminated', {
    contractId,
    adminId: user.id,
    effectiveDate,
    reason: body.termination_reason,
  });

  // Send notification to guide
  try {
    const { createInAppNotification } = await import('@/lib/integrations/contract-notifications');
    
    await createInAppNotification(
      contract.guide_id,
      'contract_expiring', // Reuse type for terminated
      'Kontrak Dihentikan',
      `Kontrak ${contract.contract_number || contractId} telah dihentikan. Alasan: ${body.termination_reason}`,
      contractId
    );
  } catch (error) {
    logger.error('Failed to send notification', error, { contractId });
    // Don't fail the request if notification fails
  }

  return NextResponse.json({
    success: true,
    contract: updatedContract,
    message: 'Kontrak telah dihentikan',
  });
});
