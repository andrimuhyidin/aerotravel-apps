import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/admin/settings
 * Get all system settings (admin only)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('users')
    .select('role, active_role')
    .eq('id', user.id)
    .single();

  const userRole = profile?.active_role || profile?.role;
  if (userRole !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Admin only' },
      { status: 403 }
    );
  }

  // Get search params
  const searchParams = request.nextUrl.searchParams;
  const branchId = searchParams.get('branch_id');

  // Build query
  let query = supabase
    .from('settings')
    .select('*')
    .order('key', { ascending: true });

  if (branchId) {
    query = query.eq('branch_id', branchId);
  } else {
    // Get global settings (branch_id = null)
    query = query.is('branch_id', null);
  }

  const { data: settings, error } = await query;

  if (error) {
    logger.error('Failed to fetch settings', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }

  logger.info('Admin fetched settings', {
    userId: user.id,
    count: settings?.length || 0,
    branchId,
  });

  return NextResponse.json({ settings });
});

/**
 * PUT /api/admin/settings
 * Update a setting (admin only)
 */
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('users')
    .select('role, active_role')
    .eq('id', user.id)
    .single();

  const userRole = profile?.active_role || profile?.role;
  if (userRole !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Admin only' },
      { status: 403 }
    );
  }

  // Parse request body
  const body = (await request.json()) as {
    key: string;
    value: string;
    branch_id?: string | null;
  };

  const { key, value, branch_id } = body;

  if (!key || value === undefined || value === null) {
    return NextResponse.json(
      { error: 'Missing required fields: key, value' },
      { status: 400 }
    );
  }

  // Update setting
  const { data, error } = await supabase
    .from('settings')
    .update({
      value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('key', key)
    .is('branch_id', branch_id || null)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update setting', error, {
      userId: user.id,
      key,
      value,
    });
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }

  logger.info('Admin updated setting', {
    userId: user.id,
    key,
    value,
    branchId: branch_id,
  });

  return NextResponse.json({ setting: data });
});
