/**
 * API: Admin Guide Contract Resignations
 * GET  /api/admin/guide/contracts/resignations - List all resignation requests
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
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Build query
  let query = withBranchFilter(
    client.from('guide_contract_resignations'),
    branchContext,
  )
    .select(
      `
      *,
      contract:guide_contracts(id, contract_number, title, status),
      guide:users!guide_contract_resignations_guide_id_fkey(id, full_name, phone, email),
      reviewed_by_user:users!guide_contract_resignations_reviewed_by_fkey(id, full_name)
    `
    )
    .order('submitted_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: resignations, error } = await query;

  if (error) {
    logger.error('Failed to fetch resignations', error);
    return NextResponse.json({ error: 'Failed to fetch resignations' }, { status: 500 });
  }

  return NextResponse.json({ data: resignations || [] });
});
