/**
 * Corporate Budget API
 * GET /api/partner/corporate/budget - List budgets
 * POST /api/partner/corporate/budget - Create/update budget
 * DELETE /api/partner/corporate/budget - Delete budget
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type Budget = {
  id: string;
  company_id: string;
  department: string;
  fiscal_year: number;
  fiscal_quarter: number | null;
  allocated_amount: number;
  spent_amount: number;
  pending_amount: number;
  alert_threshold: number;
  is_active: boolean;
  notes: string | null;
};

/**
 * GET /api/partner/corporate/budget
 * List corporate budgets
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const fiscalYear = searchParams.get('year') || new Date().getFullYear().toString();
  const department = searchParams.get('department');

  logger.info('GET /api/partner/corporate/budget', { fiscalYear, department });

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's company
  const { data: userData } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (!userData?.company_id) {
    return NextResponse.json({ error: 'No company associated' }, { status: 403 });
  }

  // Build query
  let query = supabase
    .from('corporate_budgets')
    .select('*')
    .eq('company_id', userData.company_id)
    .eq('fiscal_year', parseInt(fiscalYear))
    .eq('is_active', true)
    .order('department', { ascending: true });

  if (department) {
    query = query.eq('department', department);
  }

  const { data: budgets, error } = await query;

  if (error) {
    logger.error('Failed to fetch budgets', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }

  // Calculate summary
  const summary = {
    totalAllocated: 0,
    totalSpent: 0,
    totalPending: 0,
    totalRemaining: 0,
    usagePercent: 0,
  };

  for (const budget of budgets || []) {
    summary.totalAllocated += budget.allocated_amount;
    summary.totalSpent += budget.spent_amount;
    summary.totalPending += budget.pending_amount;
  }

  summary.totalRemaining = summary.totalAllocated - summary.totalSpent - summary.totalPending;
  summary.usagePercent =
    summary.totalAllocated > 0
      ? Math.round(((summary.totalSpent + summary.totalPending) / summary.totalAllocated) * 100)
      : 0;

  // Get departments with alerts
  const alertDepartments = (budgets || []).filter((b) => {
    const usage = ((b.spent_amount + b.pending_amount) / b.allocated_amount) * 100;
    const threshold = b.alert_threshold ?? 80; // Default threshold 80%
    return usage >= threshold;
  });

  return NextResponse.json({
    budgets: budgets || [],
    summary,
    alertDepartments: alertDepartments.map((b) => b.department),
    fiscalYear: parseInt(fiscalYear),
  });
});

/**
 * POST /api/partner/corporate/budget
 * Create or update budget
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = (await request.json()) as Partial<Budget>;

  logger.info('POST /api/partner/corporate/budget', { department: body.department });

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify corporate admin access
  const { data: userData } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  const userRole = userData?.role as string;
  if (!userData?.company_id || !['corporate', 'super_admin'].includes(userRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Validate required fields
  if (!body.department || !body.fiscal_year || body.allocated_amount === undefined) {
    return NextResponse.json(
      { error: 'department, fiscal_year, and allocated_amount are required' },
      { status: 400 }
    );
  }

  if (body.id) {
    // Update existing
    const { data: budget, error } = await supabase
      .from('corporate_budgets')
      .update({
        allocated_amount: body.allocated_amount,
        alert_threshold: body.alert_threshold || 80,
        notes: body.notes,
        is_active: body.is_active ?? true,
      })
      .eq('id', body.id)
      .eq('company_id', userData.company_id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update budget', error);
      return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 });
    }

    return NextResponse.json({ success: true, budget });
  } else {
    // Create new
    const { data: budget, error } = await supabase
      .from('corporate_budgets')
      .insert({
        company_id: userData.company_id,
        department: body.department,
        fiscal_year: body.fiscal_year,
        fiscal_quarter: body.fiscal_quarter || null,
        allocated_amount: body.allocated_amount,
        spent_amount: 0,
        pending_amount: 0,
        alert_threshold: body.alert_threshold || 80,
        notes: body.notes,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create budget', error);
      return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 });
    }

    return NextResponse.json({ success: true, budget });
  }
});

/**
 * DELETE /api/partner/corporate/budget
 * Delete budget (soft delete)
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 });
  }

  logger.info('DELETE /api/partner/corporate/budget', { id });

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify corporate admin access
  const { data: userData } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  const userRole = userData?.role as string;
  if (!['corporate', 'super_admin'].includes(userRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Soft delete - only if company_id exists
  if (!userData?.company_id && userRole !== 'super_admin') {
    return NextResponse.json({ error: 'No company associated' }, { status: 403 });
  }

  let deleteQuery = supabase
    .from('corporate_budgets')
    .update({ is_active: false })
    .eq('id', id);

  // Non-super_admin users can only delete their company's budgets
  if (userData?.company_id) {
    deleteQuery = deleteQuery.eq('company_id', userData.company_id);
  }

  const { error } = await deleteQuery;

  if (error) {
    logger.error('Failed to delete budget', error);
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

