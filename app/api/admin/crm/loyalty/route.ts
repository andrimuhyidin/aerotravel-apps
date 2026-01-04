/**
 * API: Admin - Loyalty Management
 * GET /api/admin/crm/loyalty - List loyalty adjustments and customer loyalty data
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'marketing']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);

  const view = searchParams.get('view') || 'adjustments'; // 'adjustments' or 'customers'
  const customerId = searchParams.get('customerId');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = (page - 1) * limit;

  try {
    if (view === 'customers') {
      // Get customers with loyalty data
      let query = supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          phone,
          loyalty_points,
          loyalty_tier,
          total_bookings,
          total_spent,
          created_at
        `, { count: 'exact' })
        .eq('role', 'customer')
        .order('loyalty_points', { ascending: false })
        .range(offset, offset + limit - 1);

      if (customerId) {
        query = query.eq('id', customerId);
      }

      const { data: customers, error, count } = await query;

      if (error) {
        logger.error('Failed to fetch customer loyalty data', error);
        return NextResponse.json(
          { error: 'Failed to fetch data' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        customers: customers || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    }

    // Default: Get loyalty adjustments
    let query = supabase
      .from('loyalty_adjustments')
      .select(`
        id,
        customer_id,
        points_change,
        reason,
        adjustment_type,
        reference_id,
        reference_type,
        adjusted_by,
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data: adjustments, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch loyalty adjustments', error);
      return NextResponse.json(
        { error: 'Failed to fetch adjustments' },
        { status: 500 }
      );
    }

    // Get customer and adjuster names
    const customerIds = [...new Set((adjustments || []).map(a => a.customer_id))];
    const adjusterIds = [...new Set((adjustments || []).map(a => a.adjusted_by).filter(Boolean))];
    
    let customersMap: Record<string, { full_name: string; email: string }> = {};
    let adjustersMap: Record<string, string> = {};
    
    if (customerIds.length > 0) {
      const { data: customers } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', customerIds);
      
      if (customers) {
        customersMap = Object.fromEntries(
          customers.map(c => [c.id, { full_name: c.full_name || 'Unknown', email: c.email }])
        );
      }
    }

    if (adjusterIds.length > 0) {
      const { data: adjusters } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', adjusterIds);
      
      if (adjusters) {
        adjustersMap = Object.fromEntries(
          adjusters.map(a => [a.id, a.full_name || a.email])
        );
      }
    }

    const mappedAdjustments = (adjustments || []).map(a => ({
      ...a,
      customer: customersMap[a.customer_id] || { full_name: 'Unknown', email: '' },
      adjusted_by_name: a.adjusted_by ? adjustersMap[a.adjusted_by] || 'Unknown' : 'System',
    }));

    return NextResponse.json({
      adjustments: mappedAdjustments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Unexpected error in loyalty API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

