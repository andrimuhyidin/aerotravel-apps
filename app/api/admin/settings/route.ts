import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { invalidateSettingsCache } from '@/lib/settings';

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

  // Check admin role - try profile first, fallback to user_metadata
  const { data: profile } = await supabase
    .from('users')
    .select('role, active_role')
    .eq('id', user.id)
    .single();

  const userRole = profile?.active_role || profile?.role || (user.user_metadata?.role as string);
  const allowedRoles = ['super_admin', 'admin', 'ops_admin', 'finance_manager'];
  if (!allowedRoles.includes(userRole || '')) {
    return NextResponse.json(
      { error: 'Forbidden - Admin only' },
      { status: 403 }
    );
  }

  // Get search params
  const searchParams = request.nextUrl.searchParams;
  const branchId = searchParams.get('branch_id');
  const prefix = searchParams.get('prefix'); // Filter by prefix (e.g., 'branding.*')
  const category = searchParams.get('category'); // Filter by category

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

  // Filter by prefix
  if (prefix) {
    query = query.like('key', `${prefix}%`);
  }

  // Filter by category (extract from key prefix)
  if (category) {
    query = query.like('key', `${category}.%`);
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

  // Check admin role - try profile first, fallback to user_metadata
  const { data: profile } = await supabase
    .from('users')
    .select('role, active_role')
    .eq('id', user.id)
    .single();

  const userRole = profile?.active_role || profile?.role || (user.user_metadata?.role as string);
  const allowedRoles = ['super_admin', 'admin', 'ops_admin', 'finance_manager'];
  if (!allowedRoles.includes(userRole || '')) {
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

  // Invalidate cache after update
  await invalidateSettingsCache(branch_id || null);

  return NextResponse.json({ setting: data });
});

/**
 * PATCH /api/admin/settings
 * Batch update multiple settings (admin only)
 */
export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role - try profile first, fallback to user_metadata
  const { data: profile } = await supabase
    .from('users')
    .select('role, active_role')
    .eq('id', user.id)
    .single();

  const userRole = profile?.active_role || profile?.role || (user.user_metadata?.role as string);
  const allowedRoles = ['super_admin', 'admin', 'ops_admin', 'finance_manager'];
  if (!allowedRoles.includes(userRole || '')) {
    return NextResponse.json(
      { error: 'Forbidden - Admin only' },
      { status: 403 }
    );
  }

  // Parse request body
  const body = (await request.json()) as {
    settings: Array<{
      key: string;
      value: string;
      branch_id?: string | null;
    }>;
  };

  const { settings } = body;

  if (!Array.isArray(settings) || settings.length === 0) {
    return NextResponse.json(
      { error: 'Missing required field: settings (array)' },
      { status: 400 }
    );
  }

  // Update all settings in transaction
  const updates = settings.map((setting) =>
    supabase
      .from('settings')
      .update({
        value: setting.value,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('key', setting.key)
      .is('branch_id', setting.branch_id || null)
      .select()
      .single()
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error);

  if (errors.length > 0) {
    logger.error('Failed to batch update settings', errors, {
      userId: user.id,
      count: errors.length,
    });
    return NextResponse.json(
      { error: 'Some settings failed to update', errors },
      { status: 500 }
    );
  }

  // Invalidate cache for all affected branch_ids
  const branchIds = new Set(
    settings.map((s) => s.branch_id || null).filter((id) => id !== undefined)
  );
  await Promise.all(
    Array.from(branchIds).map((id) => invalidateSettingsCache(id))
  );

  logger.info('Admin batch updated settings', {
    userId: user.id,
    count: settings.length,
    branchIds: Array.from(branchIds),
  });

  return NextResponse.json({
    success: true,
    updated: results.length,
    settings: results.map((r) => r.data).filter(Boolean),
  });
});
