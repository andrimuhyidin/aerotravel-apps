/**
 * API: Admin Guide Contract Sanctions
 * GET  /api/admin/guide/contracts/[id]/sanctions - List sanctions for a contract
 * POST /api/admin/guide/contracts/[id]/sanctions - Create new sanction
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createSanctionSchema = z.object({
  sanction_type: z.enum(['warning', 'suspension', 'fine', 'demotion', 'termination']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  title: z.string().min(1),
  description: z.string().min(1),
  violation_date: z.string().date(),
  action_taken: z.string().optional(),
  fine_amount: z.number().nonnegative().optional(),
  suspension_start_date: z.string().date().optional(),
  suspension_end_date: z.string().date().optional(),
});

const resolveSanctionSchema = z.object({
  resolution_notes: z.string().min(1),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  // Get sanctions for contract
  const { data: sanctions, error } = await withBranchFilter(
    client.from('guide_contract_sanctions'),
    branchContext,
  )
    .select(
      `
      *,
      issued_by_user:users!guide_contract_sanctions_issued_by_fkey(id, full_name),
      resolved_by_user:users!guide_contract_sanctions_resolved_by_fkey(id, full_name)
    `
    )
    .eq('contract_id', contractId)
    .order('issued_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch sanctions', error, { contractId });
    return NextResponse.json({ error: 'Failed to fetch sanctions' }, { status: 500 });
  }

  return NextResponse.json({ data: sanctions || [] });
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

  const body = createSanctionSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get contract
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

  // Validate contract status
  if (contract.status !== 'active') {
    return NextResponse.json(
      { error: 'Can only issue sanctions for active contracts' },
      { status: 400 }
    );
  }

  // Create sanction
  const { data: sanction, error: sanctionError } = await withBranchFilter(
    client.from('guide_contract_sanctions'),
    branchContext,
  )
    .insert({
      contract_id: contractId,
      guide_id: contract.guide_id,
      branch_id: contract.branch_id,
      sanction_type: body.sanction_type,
      severity: body.severity,
      title: body.title,
      description: body.description,
      violation_date: body.violation_date,
      action_taken: body.action_taken,
      fine_amount: body.fine_amount,
      suspension_start_date: body.suspension_start_date,
      suspension_end_date: body.suspension_end_date,
      issued_by: user.id,
      status: 'active',
    })
    .select()
    .single();

  if (sanctionError) {
    logger.error('Failed to create sanction', sanctionError, { contractId });
    return NextResponse.json({ error: 'Failed to create sanction' }, { status: 500 });
  }

  // If fine, create wallet deduction
  if (body.sanction_type === 'fine' && body.fine_amount && body.fine_amount > 0) {
    try {
      // Get or create wallet
      const { data: wallet } = await client
        .from('guide_wallets')
        .select('id, balance')
        .eq('guide_id', contract.guide_id)
        .maybeSingle();

      let walletId: string;
      if (!wallet) {
        const { data: newWallet, error: walletError } = await client
          .from('guide_wallets')
          .insert({ guide_id: contract.guide_id, balance: 0 })
          .select('id')
          .single();

        if (walletError) throw walletError;
        walletId = newWallet.id;
      } else {
        walletId = wallet.id;
      }

      // Create deduction transaction
      const balanceBefore = Number(wallet?.balance || 0);
      const balanceAfter = Math.max(0, balanceBefore - body.fine_amount);

      await client.from('guide_wallet_transactions').insert({
        wallet_id: walletId,
        transaction_type: 'adjustment',
        amount: -body.fine_amount, // Negative for deduction
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference_type: 'sanction',
        reference_id: sanction.id,
        description: `Denda: ${body.title}`,
        created_by: user.id,
      });

      logger.info('Wallet deduction created for sanction', {
        sanctionId: sanction.id,
        walletId,
        amount: body.fine_amount,
      });
    } catch (error) {
      logger.error('Failed to create wallet deduction', error, { sanctionId: sanction.id });
      // Don't fail the request, just log
    }
  }

  // Send notification to guide
  try {
    const { createInAppNotification } = await import('@/lib/integrations/contract-notifications');
    await createInAppNotification(
      contract.guide_id,
      'contract_expiring', // Reuse type
      'Sanksi Diterima',
      `Anda menerima sanksi: ${body.title}. ${body.description}`,
      contractId
    );
  } catch (error) {
    logger.error('Failed to send notification', error, { contractId });
    // Don't fail the request if notification fails
  }

  logger.info('Sanction created', { sanctionId: sanction.id, contractId });

  return NextResponse.json({ data: sanction }, { status: 201 });
});
