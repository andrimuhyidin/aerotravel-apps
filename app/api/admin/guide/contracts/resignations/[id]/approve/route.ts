/**
 * API: Approve Guide Contract Resignation
 * POST /api/admin/guide/contracts/resignations/[id]/approve
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const approveSchema = z.object({
  review_notes: z.string().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const resolvedParams = await context.params;
  const { id: resignationId } = resolvedParams;
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

  const body = approveSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get resignation
  const { data: resignation, error: resignationError } = await withBranchFilter(
    client.from('guide_contract_resignations'),
    branchContext,
  )
    .select('id, contract_id, guide_id, status')
    .eq('id', resignationId)
    .single();

  if (resignationError || !resignation) {
    return NextResponse.json({ error: 'Resignation not found' }, { status: 404 });
  }

  if (resignation.status !== 'pending') {
    return NextResponse.json(
      { error: 'Can only approve pending resignations' },
      { status: 400 }
    );
  }

  // Approve resignation (trigger will auto-terminate contract)
  const { data: updatedResignation, error: updateError } = await withBranchFilter(
    client.from('guide_contract_resignations'),
    branchContext,
  )
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: body.review_notes,
    })
    .eq('id', resignationId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to approve resignation', updateError, { resignationId });
    return NextResponse.json({ error: 'Failed to approve resignation' }, { status: 500 });
  }

  // Notify guide
  try {
    const { createInAppNotification } = await import('@/lib/integrations/contract-notifications');
    await createInAppNotification(
      resignation.guide_id,
      'contract_expiring', // Reuse type
      'Resign Disetujui',
      `Pengajuan resign Anda telah disetujui. Kontrak akan dihentikan pada tanggal efektif yang ditentukan.`,
      resignation.contract_id
    );
  } catch (error) {
    logger.error('Failed to send notification', error, { resignationId });
    // Don't fail the request if notification fails
  }

  logger.info('Resignation approved', { resignationId, contractId: resignation.contract_id });

  return NextResponse.json({
    data: updatedResignation,
    message: 'Resignation approved. Contract will be terminated automatically.',
  });
});
