/**
 * API: Guide Contracts
 * GET /api/guide/contracts - List contracts for current guide
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

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
  const status = searchParams.get('status');
  const contractType = searchParams.get('type');

  // Build base query
  let baseQuery = client.from('guide_contracts')
    .select(
      `
      id,
      contract_number,
      contract_type,
      title,
      description,
      start_date,
      end_date,
      fee_amount,
      fee_type,
      payment_terms,
      status,
      guide_signed_at,
      company_signed_at,
      expires_at,
      created_at,
      updated_at
    `
    )
    .eq('guide_id', user.id);

  // Apply branch filter
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    baseQuery = baseQuery.eq('branch_id', branchContext.branchId);
  }

  // Apply status filter
  if (status) {
    baseQuery = baseQuery.eq('status', status);
  }

  // Apply contract type filter
  if (contractType) {
    baseQuery = baseQuery.eq('contract_type', contractType);
  }

  // Order and execute
  const { data: contracts, error } = await baseQuery
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to load guide contracts', error, { 
      guideId: user.id,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
    });
    
    // Return more detailed error for debugging
    return NextResponse.json({ 
      error: 'Failed to load contracts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }, { status: 500 });
  }

  logger.info('Guide contracts loaded', { 
    guideId: user.id,
    count: contracts?.length || 0,
    statusFilter: status || 'all',
  });

  return NextResponse.json({
    contracts: contracts ?? [],
  });
});
