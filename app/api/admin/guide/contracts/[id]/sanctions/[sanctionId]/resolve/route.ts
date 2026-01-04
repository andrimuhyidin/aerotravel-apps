/**
 * API: Resolve Guide Contract Sanction
 * POST /api/admin/guide/contracts/[id]/sanctions/[sanctionId]/resolve
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const resolveSchema = z.object({
  resolution_notes: z.string().min(1),
});

type RouteContext = {
  params: Promise<{ id: string; sanctionId: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const resolvedParams = await context.params;
  const { id: contractId, sanctionId } = resolvedParams;
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

  const body = resolveSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get sanction
  const { data: sanction, error: sanctionError } = await withBranchFilter(
    client.from('guide_contract_sanctions'),
    branchContext,
  )
    .select('id, contract_id, guide_id, status')
    .eq('id', sanctionId)
    .eq('contract_id', contractId)
    .single();

  if (sanctionError || !sanction) {
    return NextResponse.json({ error: 'Sanction not found' }, { status: 404 });
  }

  if (sanction.status !== 'active') {
    return NextResponse.json(
      { error: 'Can only resolve active sanctions' },
      { status: 400 }
    );
  }

  // Resolve sanction
  const { data: updatedSanction, error: updateError } = await withBranchFilter(
    client.from('guide_contract_sanctions'),
    branchContext,
  )
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      resolution_notes: body.resolution_notes,
    })
    .eq('id', sanctionId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to resolve sanction', updateError, { sanctionId });
    return NextResponse.json({ error: 'Failed to resolve sanction' }, { status: 500 });
  }

  logger.info('Sanction resolved', { sanctionId, contractId });

  return NextResponse.json({ data: updatedSanction });
});
