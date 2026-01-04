/**
 * API: List All Partners
 * GET /api/admin/partners - Get all partners with tier information
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get query params
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const tier = searchParams.get('tier') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  try {
    const client = supabase as unknown as any;

    let query = client
      .from('users')
      .select(
        'id, full_name, email, company_name, partner_tier, tier_auto_calculated, tier_assigned_at, created_at, is_active',
        { count: 'exact' }
      )
      .eq('role', 'mitra')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`
      );
    }

    // Apply tier filter
    if (tier !== 'all') {
      query = query.eq('partner_tier', tier);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: partners, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch partners', error);
      return NextResponse.json(
        { error: 'Failed to fetch partners' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      partners: partners || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Error in GET /api/admin/partners', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

