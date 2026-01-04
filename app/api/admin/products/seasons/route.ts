/**
 * Seasons API
 * GET /api/admin/products/seasons - List all seasons
 * POST /api/admin/products/seasons - Create season
 * PUT /api/admin/products/seasons - Update season
 * DELETE /api/admin/products/seasons - Delete season
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type Season = {
  id: string;
  branch_id: string | null;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  price_multiplier: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * GET /api/admin/products/seasons
 * List all seasons with optional filters
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const branchId = searchParams.get('branch_id');
  const year = searchParams.get('year');
  const activeOnly = searchParams.get('active') === 'true';

  logger.info('GET /api/admin/products/seasons', { branchId, year, activeOnly });

  const supabase = await createClient();

  // Verify user access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Build query
  let query = supabase
    .from('seasons')
    .select('*')
    .order('start_date', { ascending: true });

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  if (year) {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    query = query.or(`start_date.gte.${yearStart},end_date.lte.${yearEnd}`);
  }

  const { data: seasons, error } = await query;

  if (error) {
    logger.error('Failed to fetch seasons', error);
    return NextResponse.json({ error: 'Failed to fetch seasons' }, { status: 500 });
  }

  // Calculate stats
  const now = new Date().toISOString().split('T')[0] ?? '';
  const activeSeason = (seasons || []).find(
    (s) => s.is_active && now && s.start_date <= now && s.end_date >= now
  );

  return NextResponse.json({
    seasons: seasons || [],
    total: seasons?.length || 0,
    activeSeason: activeSeason || null,
    currentMultiplier: activeSeason?.price_multiplier || 1.0,
  });
});

/**
 * POST /api/admin/products/seasons
 * Create new season
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = (await request.json()) as Partial<Season>;

  logger.info('POST /api/admin/products/seasons', { name: body.name });

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
  const allowedRoles = ['super_admin', 'ops_admin', 'marketing'];
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Validate required fields
  if (!body.name || !body.start_date || !body.end_date) {
    return NextResponse.json(
      { error: 'Name, start_date, and end_date are required' },
      { status: 400 }
    );
  }

  // Validate date range
  if (body.start_date > body.end_date) {
    return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
  }

  // Insert season
  const { data: season, error } = await supabase
    .from('seasons')
    .insert({
      branch_id: body.branch_id || null,
      name: body.name,
      description: body.description || null,
      start_date: body.start_date,
      end_date: body.end_date,
      price_multiplier: body.price_multiplier || 1.0,
      color: body.color || '#3b82f6',
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create season', error);
    return NextResponse.json({ error: 'Failed to create season' }, { status: 500 });
  }

  logger.info('Season created', { id: season.id, name: season.name });

  return NextResponse.json({ success: true, season });
});

/**
 * PUT /api/admin/products/seasons
 * Update existing season
 */
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const body = (await request.json()) as Partial<Season> & { id: string };

  if (!body.id) {
    return NextResponse.json({ error: 'Season ID is required' }, { status: 400 });
  }

  logger.info('PUT /api/admin/products/seasons', { id: body.id });

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
  const allowedRoles = ['super_admin', 'ops_admin', 'marketing'];
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Build update object
  const updateData: Partial<Season> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.start_date !== undefined) updateData.start_date = body.start_date;
  if (body.end_date !== undefined) updateData.end_date = body.end_date;
  if (body.price_multiplier !== undefined) updateData.price_multiplier = body.price_multiplier;
  if (body.color !== undefined) updateData.color = body.color;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;

  // Update season
  const { data: season, error } = await supabase
    .from('seasons')
    .update(updateData)
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update season', error);
    return NextResponse.json({ error: 'Failed to update season' }, { status: 500 });
  }

  logger.info('Season updated', { id: season.id });

  return NextResponse.json({ success: true, season });
});

/**
 * DELETE /api/admin/products/seasons
 * Delete season
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Season ID is required' }, { status: 400 });
  }

  logger.info('DELETE /api/admin/products/seasons', { id });

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
  if (userRole !== 'super_admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { error } = await supabase.from('seasons').delete().eq('id', id);

  if (error) {
    logger.error('Failed to delete season', error);
    return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

