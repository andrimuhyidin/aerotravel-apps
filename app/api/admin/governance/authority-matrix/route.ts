/**
 * Authority Matrix API
 * GET /api/admin/governance/authority-matrix - List all rules
 * POST /api/admin/governance/authority-matrix - Create/Update rule
 * DELETE /api/admin/governance/authority-matrix - Delete rule
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type AuthorityRule = {
  id: string;
  branch_id: string | null;
  action_type: string;
  action_name: string;
  description: string | null;
  required_roles: string[];
  min_approvers: number;
  threshold_amount: number | null;
  is_active: boolean;
};

/**
 * GET /api/admin/governance/authority-matrix
 * List all authority matrix rules
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const branchId = searchParams.get('branch_id');

  logger.info('GET /api/admin/governance/authority-matrix', { branchId });

  const supabase = await createClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = userData?.role as string;
  if (!['super_admin', 'ops_admin'].includes(userRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Build query
  let query = supabase
    .from('authority_matrix')
    .select('*')
    .order('action_type', { ascending: true });

  if (branchId) {
    query = query.eq('branch_id', branchId);
  } else {
    query = query.is('branch_id', null);
  }

  const { data: rules, error } = await query;

  if (error) {
    logger.error('Failed to fetch authority matrix', error);
    return NextResponse.json({ error: 'Failed to fetch authority matrix' }, { status: 500 });
  }

  // Get available roles
  const availableRoles = [
    { id: 'super_admin', name: 'Super Admin' },
    { id: 'branch_admin', name: 'Branch Admin' },
    { id: 'ops_admin', name: 'Ops Admin' },
    { id: 'finance', name: 'Finance' },
    { id: 'cs', name: 'Customer Service' },
    { id: 'guide', name: 'Guide' },
    { id: 'product_manager', name: 'Product Manager' },
    { id: 'marketing', name: 'Marketing' },
  ];

  return NextResponse.json({
    rules: rules || [],
    availableRoles,
    total: rules?.length || 0,
  });
});

/**
 * POST /api/admin/governance/authority-matrix
 * Create or update authority matrix rule
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = (await request.json()) as Partial<AuthorityRule> & { id?: string };

  logger.info('POST /api/admin/governance/authority-matrix', { actionType: body.action_type });

  const supabase = await createClient();

  // Verify super_admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = userData?.role as string;
  if (userRole !== 'super_admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Validate required fields
  if (!body.action_type || !body.action_name || !body.required_roles) {
    return NextResponse.json(
      { error: 'action_type, action_name, and required_roles are required' },
      { status: 400 }
    );
  }

  const branchId = body.branch_id || null;

  if (body.id) {
    // Update existing
    const { data: rule, error } = await supabase
      .from('authority_matrix')
      .update({
        action_name: body.action_name,
        description: body.description,
        required_roles: body.required_roles,
        min_approvers: body.min_approvers || 1,
        threshold_amount: body.threshold_amount,
        is_active: body.is_active ?? true,
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update authority rule', error);
      return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true, rule });
  } else {
    // Create new
    const { data: rule, error } = await supabase
      .from('authority_matrix')
      .insert({
        branch_id: branchId,
        action_type: body.action_type,
        action_name: body.action_name,
        description: body.description,
        required_roles: body.required_roles,
        min_approvers: body.min_approvers || 1,
        threshold_amount: body.threshold_amount,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create authority rule', error);
      return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true, rule });
  }
});

/**
 * DELETE /api/admin/governance/authority-matrix
 * Delete authority matrix rule
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
  }

  logger.info('DELETE /api/admin/governance/authority-matrix', { id });

  const supabase = await createClient();

  // Verify super_admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = userData?.role as string;
  if (userRole !== 'super_admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { error } = await supabase.from('authority_matrix').delete().eq('id', id);

  if (error) {
    logger.error('Failed to delete authority rule', error);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

