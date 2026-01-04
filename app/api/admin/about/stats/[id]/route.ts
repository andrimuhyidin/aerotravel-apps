/**
 * API: About Stat Management by ID (Admin)
 * GET /api/admin/about/stats/[id] - Get single stat
 * PUT /api/admin/about/stats/[id] - Update stat
 * DELETE /api/admin/about/stats/[id] - Delete stat
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateStatSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  value: z.string().min(1).max(50).optional(),
  display_order: z.number().optional(),
  is_active: z.boolean().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();

  // Check authorization
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: stat, error } = await supabase
    .from('about_stats')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error(`Failed to fetch about stat: ${id}`, error);
    return NextResponse.json({ error: 'Stat not found' }, { status: 404 });
  }

  return NextResponse.json({ stat });
});

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();

  // Only super_admin can update stats
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = updateStatSchema.parse(await request.json());

  const { data: stat, error } = await supabase
    .from('about_stats')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error(`Failed to update about stat: ${id}`, error);
    return NextResponse.json({ error: 'Failed to update stat' }, { status: 500 });
  }

  logger.info(`About stat updated: ${id}`);
  return NextResponse.json({ stat });
});

export const DELETE = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();

  // Only super_admin can delete stats
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('about_stats')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    logger.error(`Failed to delete about stat: ${id}`, error);
    return NextResponse.json({ error: 'Failed to delete stat' }, { status: 500 });
  }

  logger.info(`About stat deleted: ${id}`);
  return NextResponse.json({ message: 'Stat deleted successfully' });
});

