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

  try {
    const client = supabase as unknown as any;

    const { data: partners, error } = await client
      .from('users')
      .select('id, full_name, email, company_name, partner_tier, tier_auto_calculated, tier_assigned_at')
      .eq('role', 'mitra')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch partners', error);
      return NextResponse.json(
        { error: 'Failed to fetch partners' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      partners: partners || [],
    });
  } catch (error) {
    logger.error('Error in GET /api/admin/partners', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

