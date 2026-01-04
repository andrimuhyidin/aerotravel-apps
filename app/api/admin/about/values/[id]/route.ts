/**
 * API: About Value Management by ID (Admin)
 * GET /api/admin/about/values/[id] - Get single value
 * PUT /api/admin/about/values/[id] - Update value
 * DELETE /api/admin/about/values/[id] - Delete value
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateValueSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  icon_name: z.string().max(50).optional().nullable(),
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

  const { data: value, error } = await supabase
    .from('about_values')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error(`Failed to fetch about value: ${id}`, error);
    return NextResponse.json({ error: 'Value not found' }, { status: 404 });
  }

  return NextResponse.json({ value });
});

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();

  // Only super_admin can update values
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = updateValueSchema.parse(await request.json());

  const { data: value, error } = await supabase
    .from('about_values')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error(`Failed to update about value: ${id}`, error);
    return NextResponse.json({ error: 'Failed to update value' }, { status: 500 });
  }

  logger.info(`About value updated: ${id}`);
  return NextResponse.json({ value });
});

export const DELETE = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();

  // Only super_admin can delete values
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('about_values')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    logger.error(`Failed to delete about value: ${id}`, error);
    return NextResponse.json({ error: 'Failed to delete value' }, { status: 500 });
  }

  logger.info(`About value deleted: ${id}`);
  return NextResponse.json({ message: 'Value deleted successfully' });
});

