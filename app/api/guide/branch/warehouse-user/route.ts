/**
 * API: Get Warehouse User for Branch
 * GET /api/guide/branch/warehouse-user - Get warehouse user ID for current branch
 * Returns ops_admin user for the branch, or null if not found
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  logger.info('GET /api/guide/branch/warehouse-user');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  // Get ops_admin user for this branch (warehouse user)
  let warehouseUserQuery = client
    .from('users')
    .select('id, full_name, email')
    .eq('role', 'ops_admin')
    .limit(1);

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    warehouseUserQuery = warehouseUserQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: warehouseUsers, error } = await warehouseUserQuery;

  if (error) {
    logger.error('Failed to fetch warehouse user', error, { branchId: branchContext.branchId });
    return NextResponse.json({ error: 'Failed to fetch warehouse user' }, { status: 500 });
  }

  const warehouseUser = warehouseUsers && warehouseUsers.length > 0 ? warehouseUsers[0] : null;

  return NextResponse.json({
    warehouseUserId: warehouseUser?.id || null,
    warehouseUserName: warehouseUser?.full_name || null,
  });
});

