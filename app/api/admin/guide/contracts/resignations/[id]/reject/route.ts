/**
 * API: Reject Guide Contract Resignation
 * POST /api/admin/guide/contracts/resignations/[id]/reject
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const rejectSchema = z.object({
  rejection_reason: z.string().min(1, 'Alasan penolakan wajib diisi'),
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

  const body = rejectSchema.parse(await request.json());
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
      { error: 'Can only reject pending resignations' },
      { status: 400 }
    );
  }

  // Reject resignation
  const { data: updatedResignation, error: updateError } = await withBranchFilter(
    client.from('guide_contract_resignations'),
    branchContext,
  )
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: body.rejection_reason,
      review_notes: body.review_notes,
    })
    .eq('id', resignationId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to reject resignation', updateError, { resignationId });
    return NextResponse.json({ error: 'Failed to reject resignation' }, { status: 500 });
  }

  // Notify guide
  try {
    const { createInAppNotification } = await import('@/lib/integrations/contract-notifications');
    await createInAppNotification(
      resignation.guide_id,
      'contract_expiring', // Reuse type
      'Resign Ditolak',
      `Pengajuan resign Anda ditolak. Alasan: ${body.rejection_reason}`,
      resignation.contract_id
    );
  } catch (error) {
    logger.error('Failed to send notification', error, { resignationId });
    // Don't fail the request if notification fails
  }

  logger.info('Resignation rejected', { resignationId, contractId: resignation.contract_id });

  return NextResponse.json({
    data: updatedResignation,
    message: 'Resignation rejected.',
  });
});
