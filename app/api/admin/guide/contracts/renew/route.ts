/**
 * API: Renew Master Contract
 * POST /api/admin/guide/contracts/renew - Renew an expiring master contract
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const renewSchema = z.object({
  contract_id: z.string().uuid(),
  auto_send: z.boolean().optional().default(false),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
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

  const body = renewSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get current contract
  const { data: currentContract, error: contractError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .select('*')
    .eq('id', body.contract_id)
    .single();

  if (contractError || !currentContract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  if (!currentContract.is_master_contract) {
    return NextResponse.json(
      { error: 'Only master contracts can be renewed' },
      { status: 400 }
    );
  }

  if (currentContract.status !== 'active') {
    return NextResponse.json(
      { error: 'Only active contracts can be renewed' },
      { status: 400 }
    );
  }

  // Mark current contract as expired
  await withBranchFilter(client.from('guide_contracts'), branchContext)
    .update({
      status: 'expired',
      expires_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.contract_id);

  // Calculate new dates
  const startDate = currentContract.end_date
    ? new Date(currentContract.end_date)
    : new Date();
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Create new master contract
  const { data: newContract, error: newContractError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .insert({
      guide_id: currentContract.guide_id,
      branch_id: currentContract.branch_id,
      contract_type: 'annual',
      is_master_contract: true,
      auto_cover_trips: true,
      title: `Kontrak Kerja Tahunan ${startDate.getFullYear()}`,
      description: `Kontrak kerja tahunan untuk periode ${startDateStr} - ${endDateStr}`,
      start_date: startDateStr,
      end_date: endDateStr,
      renewal_date: endDateStr,
      fee_amount: null, // Fee in trip_guides
      fee_type: 'per_trip',
      payment_terms: 'Dibayar setelah trip selesai berdasarkan fee di trip assignment',
      terms_and_conditions: currentContract.terms_and_conditions || {},
      status: body.auto_send ? 'pending_signature' : 'draft',
      previous_contract_id: body.contract_id,
      created_by: user.id,
    })
    .select()
    .single();

  if (newContractError) {
    logger.error('Failed to create renewed contract', newContractError, {
      contractId: body.contract_id,
    });
    return NextResponse.json(
      { error: 'Failed to create renewed contract' },
      { status: 500 }
    );
  }

  logger.info('Master contract renewed', {
    oldContractId: body.contract_id,
    newContractId: newContract.id,
    guideId: currentContract.guide_id,
    autoSend: body.auto_send,
  });

  // Send notifications if auto_send
  if (body.auto_send) {
    try {
      const { notifyGuideContractSent, createInAppNotification } = await import('@/lib/integrations/contract-notifications');

      // Get guide info
      const { data: guide } = await client
        .from('users')
        .select('phone, full_name')
        .eq('id', currentContract.guide_id)
        .single();

      // WhatsApp notification
      if (guide?.phone) {
        await notifyGuideContractSent(
          guide.phone,
          newContract.contract_number || newContract.id,
          newContract.title
        );
      }

      // In-app notification
      await createInAppNotification(
        currentContract.guide_id,
        'contract_sent',
        'Kontrak Kerja Diperpanjang',
        `Kontrak kerja Anda telah diperpanjang untuk periode ${startDateStr} - ${endDateStr}. Silakan buka aplikasi untuk melihat detail.`,
        newContract.id
      );
    } catch (error) {
      logger.error('Failed to send notifications', error, { contractId: newContract.id });
      // Don't fail the request if notification fails
    }
  }

  return NextResponse.json({
    success: true,
    contract: newContract,
    message: 'Kontrak berhasil diperpanjang',
  });
});

/**
 * GET /api/admin/guide/contracts/renew - Get contracts expiring soon
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
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

  // Get query params
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);

  // Calculate date threshold
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + days);

  // Get expiring contracts
  let query = client
    .from('guide_contracts')
    .select(
      `
      id,
      contract_number,
      title,
      guide_id,
      guide:users!guide_contracts_guide_id_fkey(id, full_name, email),
      start_date,
      end_date,
      renewal_date,
      status,
      created_at
    `
    )
    .eq('is_master_contract', true)
    .eq('status', 'active')
    .lte('renewal_date', thresholdDate.toISOString().split('T')[0])
    .gte('renewal_date', new Date().toISOString().split('T')[0])
    .order('renewal_date', { ascending: true });

  // Apply branch filter
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    query = query.eq('branch_id', branchContext.branchId);
  }

  const { data: expiringContracts, error } = await query;

  if (error) {
    logger.error('Failed to fetch expiring contracts', error);
    return NextResponse.json(
      { error: 'Failed to fetch expiring contracts' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    contracts: expiringContracts || [],
    count: expiringContracts?.length || 0,
  });
});
