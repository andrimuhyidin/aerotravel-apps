/**
 * API: Admin Contract Detail & Update
 * GET  /api/admin/guide/contracts/[id] - Get contract detail
 * PATCH /api/admin/guide/contracts/[id] - Update contract
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

const updateContractSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().nullable().optional(),
  fee_amount: z.number().positive().optional(),
  payment_terms: z.string().optional(),
  terms_and_conditions: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
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

  // Get contract detail
  const { data: contract, error: contractError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .select(
      `
      *,
      guide:users!guide_contracts_guide_id_fkey(
        id,
        full_name,
        email,
        phone
      )
    `
    )
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    logger.error('Contract not found', contractError, { contractId });
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  // Get contract trips
  const { data: contractTrips } = await withBranchFilter(
    client.from('guide_contract_trips'),
    branchContext,
  )
    .select('*')
    .eq('contract_id', contractId)
    .order('trip_date', { ascending: true });

  // Get contract payments
  const { data: contractPayments } = await withBranchFilter(
    client.from('guide_contract_payments'),
    branchContext,
  )
    .select('*')
    .eq('contract_id', contractId)
    .order('payment_date', { ascending: false });

  return NextResponse.json({
    contract: {
      ...contract,
      trips: contractTrips ?? [],
      payments: contractPayments ?? [],
    },
  });
});

export const PATCH = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
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

  const body = updateContractSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get contract
  const { data: contract, error: contractError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .select('status')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  // Only allow update if draft or pending_signature
  if (contract.status !== 'draft' && contract.status !== 'pending_signature') {
    return NextResponse.json(
      { error: `Contract tidak dapat diubah. Status: ${contract.status}` },
      { status: 400 }
    );
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.title) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.start_date) updateData.start_date = body.start_date;
  if (body.end_date !== undefined) updateData.end_date = body.end_date;
  if (body.fee_amount) updateData.fee_amount = body.fee_amount;
  if (body.payment_terms !== undefined) updateData.payment_terms = body.payment_terms;
  if (body.terms_and_conditions) updateData.terms_and_conditions = body.terms_and_conditions;

  // Update contract
  const { data: updatedContract, error: updateError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .update(updateData)
    .eq('id', contractId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to update contract', updateError, { contractId });
    return NextResponse.json({ error: 'Gagal memperbarui kontrak' }, { status: 500 });
  }

  logger.info('Contract updated', {
    contractId,
    adminId: user.id,
    updates: Object.keys(updateData),
  });

  return NextResponse.json({
    success: true,
    contract: updatedContract,
    message: 'Kontrak berhasil diperbarui',
  });
});
