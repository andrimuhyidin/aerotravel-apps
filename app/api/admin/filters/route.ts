/**
 * API: Admin - Saved Filters
 * GET /api/admin/filters - Get user's saved filters
 * POST /api/admin/filters - Save new filter
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const saveFilterSchema = z.object({
  module: z.string().min(1),
  filterName: z.string().min(1).max(100),
  filterConditions: z.record(z.unknown()),
  isDefault: z.boolean().default(false),
  isShared: z.boolean().default(false),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);
  const module = searchParams.get('module');

  try {
    // Get user's filters and shared filters
    let query = supabase
      .from('user_saved_filters')
      .select('*')
      .or(`user_id.eq.${user.id},is_shared.eq.true`)
      .order('usage_count', { ascending: false });

    if (module) {
      query = query.eq('module', module);
    }

    const { data: filters, error } = await query;

    if (error) {
      logger.error('Failed to fetch saved filters', error);
      return NextResponse.json(
        { error: 'Failed to fetch filters' },
        { status: 500 }
      );
    }

    // Mark which ones are owned by current user
    const mappedFilters = (filters || []).map(filter => ({
      ...filter,
      isOwner: filter.user_id === user.id,
    }));

    return NextResponse.json({ filters: mappedFilters });
  } catch (error) {
    logger.error('Unexpected error in filters API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = saveFilterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { module, filterName, filterConditions, isDefault, isShared } = parsed.data;
  const supabase = await createAdminClient();

  try {
    // Check for existing filter with same name
    const { data: existing } = await supabase
      .from('user_saved_filters')
      .select('id')
      .eq('user_id', user.id)
      .eq('module', module)
      .eq('filter_name', filterName)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Filter dengan nama ini sudah ada' },
        { status: 409 }
      );
    }

    // If setting as default, clear other defaults
    if (isDefault) {
      await supabase
        .from('user_saved_filters')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('module', module);
    }

    // Create filter
    const { data: filter, error: createError } = await supabase
      .from('user_saved_filters')
      .insert({
        user_id: user.id,
        module,
        filter_name: filterName,
        filter_conditions: filterConditions,
        is_default: isDefault,
        is_shared: isShared,
      })
      .select('id, filter_name, module')
      .single();

    if (createError) {
      logger.error('Failed to create saved filter', createError);
      return NextResponse.json(
        { error: 'Failed to save filter' },
        { status: 500 }
      );
    }

    logger.info('Filter saved', {
      filterId: filter?.id,
      module,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Filter berhasil disimpan',
      filter,
    });
  } catch (error) {
    logger.error('Unexpected error in save filter', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

