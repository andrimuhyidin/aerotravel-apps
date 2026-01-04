/**
 * API: Send Contract to Guide
 * POST /api/admin/guide/contracts/[id]/send - Send draft contract to guide
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
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

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get contract
  const { data: contract, error: contractError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .select('*, guide:users!guide_contracts_guide_id_fkey(id, full_name, phone, email)')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  // Validate status
  if (contract.status !== 'draft') {
    return NextResponse.json(
      { error: `Contract tidak dapat dikirim. Status: ${contract.status}` },
      { status: 400 }
    );
  }

  // Update status
  const { data: updatedContract, error: updateError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .update({
      status: 'pending_signature',
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to send contract', updateError, { contractId });
    return NextResponse.json({ error: 'Gagal mengirim kontrak' }, { status: 500 });
  }

  logger.info('Contract sent to guide', {
    contractId,
    guideId: contract.guide_id,
    contractNumber: contract.contract_number,
  });

  // Send notifications
  try {
    const { notifyGuideContractSent, createInAppNotification } = await import('@/lib/integrations/contract-notifications');
    const guide = contract.guide as { phone?: string | null; full_name?: string | null } | null;
    
    // WhatsApp notification
    if (guide?.phone) {
      await notifyGuideContractSent(
        guide.phone,
        contract.contract_number || contractId,
        contract.title,
        undefined // No deadline for contract signature
      );
    }

    // In-app notification
    await createInAppNotification(
      contract.guide_id,
      'contract_sent',
      'Kontrak Kerja Baru',
      `Anda menerima kontrak kerja baru: ${contract.contract_number || contractId}. Silakan buka aplikasi untuk melihat detail.`,
      contractId
    );
  } catch (error) {
    logger.error('Failed to send notifications', error, { contractId });
    // Don't fail the request if notification fails
  }

  return NextResponse.json({
    success: true,
    contract: updatedContract,
    message: 'Kontrak telah dikirim ke guide',
  });
});
