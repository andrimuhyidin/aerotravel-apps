/**
 * API: Guide Contract Detail
 * GET /api/guide/contracts/[id] - Get contract detail
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
  const resolvedParams = await context.params;
  const { id: contractId } = resolvedParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get contract detail first
  let contractQuery = client.from('guide_contracts')
    .select('*')
    .eq('id', contractId)
    .eq('guide_id', user.id);

  // Apply branch filter manually
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    contractQuery = contractQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: contract, error: contractError } = await contractQuery.single();

  if (contractError) {
    logger.error('Failed to fetch contract', contractError, { 
      contractId, 
      guideId: user.id,
      errorCode: contractError.code,
      errorMessage: contractError.message,
      errorDetails: contractError.details,
    });
    
    // Check if it's a "not found" error
    if (contractError.code === 'PGRST116' || contractError.message?.includes('No rows')) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to load contract',
      details: process.env.NODE_ENV === 'development' ? contractError.message : undefined,
    }, { status: 500 });
  }

  if (!contract) {
    logger.error('Contract not found', { contractId, guideId: user.id });
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  // Get guide info separately (handle error gracefully)
  const { data: guideInfo, error: guideInfoError } = await client
    .from('users')
    .select('id, full_name, email, phone, address')
    .eq('id', contract.guide_id)
    .maybeSingle();

  if (guideInfoError) {
    logger.warn('Failed to fetch guide info', guideInfoError, { guideId: contract.guide_id });
  }

  // Get contract trips if exists
  let tripsQuery = client.from('guide_contract_trips')
    .select('*')
    .eq('contract_id', contractId);

  // Apply branch filter manually (via contract)
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripsQuery = tripsQuery.eq('contract_id', contractId); // Already filtered by contract
  }

  const { data: contractTrips } = await tripsQuery.order('trip_date', { ascending: true });

  // Get contract payments
  let paymentsQuery = client.from('guide_contract_payments')
    .select('*')
    .eq('contract_id', contractId);

  // Apply branch filter manually (via contract)
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    paymentsQuery = paymentsQuery.eq('contract_id', contractId); // Already filtered by contract
  }

  const { data: contractPayments } = await paymentsQuery.order('payment_date', { ascending: false }).limit(100);

  return NextResponse.json({
    contract: {
      ...contract,
      guide: guideInfo || null,
      trips: contractTrips ?? [],
      payments: contractPayments ?? [],
    },
  });
});
