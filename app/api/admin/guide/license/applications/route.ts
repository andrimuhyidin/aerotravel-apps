/**
 * API: Admin - Get License Applications
 * GET /api/admin/guide/license/applications - Get all applications (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if admin
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['super_admin', 'ops_admin', 'finance_manager'].includes(
    userProfile?.role || ''
  );

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);

  // Build query
  let query = client
    .from('guide_license_applications')
    .select(`
      *,
      guide:users!guide_license_applications_guide_id_fkey(id, full_name, email, phone)
    `);

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    query = query.eq('branch_id', branchContext.branchId);
  }

  // Filters
  const status = searchParams.get('status');
  if (status) {
    query = query.eq('status', status);
  }

  const stage = searchParams.get('stage');
  if (stage) {
    query = query.eq('current_stage', stage);
  }

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: applications, error } = await query;

  if (error) {
    logger.error('Failed to fetch license applications', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }

  // Get total count
  let countQuery = client
    .from('guide_license_applications')
    .select('*', { count: 'exact', head: true });

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    countQuery = countQuery.eq('branch_id', branchContext.branchId);
  }

  if (status) {
    countQuery = countQuery.eq('status', status);
  }
  if (stage) {
    countQuery = countQuery.eq('current_stage', stage);
  }

  const { count } = await countQuery;

  return NextResponse.json({
    applications: applications || [],
    total: count || 0,
    page,
    limit,
  });
});
