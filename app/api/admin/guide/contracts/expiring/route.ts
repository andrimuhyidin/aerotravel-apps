/**
 * API: Get Expiring Contracts
 * GET /api/admin/guide/contracts/expiring - Get contracts expiring soon
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

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
  const days = parseInt(searchParams.get('days') || '7', 10);

  // Calculate date range
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);

  // Get contracts expiring in the next N days
  const { data: contracts, error } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .select(
      `
      id,
      contract_number,
      title,
      contract_type,
      start_date,
      end_date,
      expires_at,
      status,
      guide_id,
      guide:users!guide_contracts_guide_id_fkey(id, full_name, email, phone)
    `
    )
    .eq('status', 'active')
    .not('expires_at', 'is', null)
    .gte('expires_at', now.toISOString())
    .lte('expires_at', futureDate.toISOString())
    .order('expires_at', { ascending: true });

  if (error) {
    logger.error('Failed to load expiring contracts', error);
    return NextResponse.json({ error: 'Failed to load contracts' }, { status: 500 });
  }

  return NextResponse.json({
    contracts: contracts ?? [],
    days,
    count: contracts?.length || 0,
  });
});
