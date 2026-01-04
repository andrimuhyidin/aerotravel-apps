/**
 * API: Guide Contract Resignation (Self-Service)
 * POST /api/guide/contracts/[id]/resign - Submit resignation request
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const resignSchema = z.object({
  reason: z.string().min(10, 'Alasan resign minimal 10 karakter'),
  effective_date: z.string().date(),
  notice_period_days: z.number().int().min(0).max(90).default(14),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  const body = resignSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify contract belongs to guide
  const { data: contract, error: contractError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .select('id, guide_id, branch_id, status')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  if (contract.guide_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate contract status
  if (contract.status !== 'active') {
    return NextResponse.json(
      { error: 'Can only resign from active contracts' },
      { status: 400 }
    );
  }

  // Check if there's already a pending resignation
  const { data: existingResignation } = await client
    .from('guide_contract_resignations')
    .select('id, status')
    .eq('contract_id', contractId)
    .eq('guide_id', user.id)
    .eq('status', 'pending')
    .single();

  if (existingResignation) {
    return NextResponse.json(
      { error: 'You already have a pending resignation request' },
      { status: 400 }
    );
  }

  // Validate effective date
  const effectiveDate = new Date(body.effective_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (effectiveDate < today) {
    return NextResponse.json(
      { error: 'Effective date must be today or in the future' },
      { status: 400 }
    );
  }

  // Create resignation request
  const { data: resignation, error: resignationError } = await withBranchFilter(
    client.from('guide_contract_resignations'),
    branchContext,
  )
    .insert({
      contract_id: contractId,
      guide_id: user.id,
      branch_id: contract.branch_id,
      reason: body.reason,
      effective_date: body.effective_date,
      notice_period_days: body.notice_period_days,
      status: 'pending',
    })
    .select()
    .single();

  if (resignationError) {
    logger.error('Failed to create resignation', resignationError, { contractId });
    return NextResponse.json({ error: 'Failed to submit resignation' }, { status: 500 });
  }

  // Notify admin
  try {
    const { createInAppNotification } = await import('@/lib/integrations/contract-notifications');
    
    // Get admin users
    const { data: admins } = await client
      .from('users')
      .select('id')
      .in('role', ['super_admin', 'ops_admin', 'finance_manager'])
      .limit(10);

    if (admins) {
      for (const admin of admins) {
        await createInAppNotification(
          admin.id,
          'contract_expiring', // Reuse type
          'Pengajuan Resign Guide',
          `Guide mengajukan resign untuk kontrak ${contract.contract_number || contractId}. Alasan: ${body.reason}`,
          contractId
        );
      }
    }
  } catch (error) {
    logger.error('Failed to send notification', error, { contractId });
    // Don't fail the request if notification fails
  }

  logger.info('Resignation submitted', { resignationId: resignation.id, contractId });

  return NextResponse.json(
    {
      data: resignation,
      message: 'Pengajuan resign berhasil dikirim. Menunggu persetujuan admin.',
    },
    { status: 201 }
  );
});
