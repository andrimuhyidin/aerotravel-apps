/**
 * API: About Award Management by ID (Admin)
 * GET /api/admin/about/awards/[id] - Get single award
 * PUT /api/admin/about/awards/[id] - Update award
 * DELETE /api/admin/about/awards/[id] - Delete award
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateAwardSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
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

  const { data: award, error } = await supabase
    .from('about_awards')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error(`Failed to fetch about award: ${id}`, error);
    return NextResponse.json({ error: 'Award not found' }, { status: 404 });
  }

  return NextResponse.json({ award });
});

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();

  // Only super_admin can update awards
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = updateAwardSchema.parse(await request.json());

  const { data: award, error } = await supabase
    .from('about_awards')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error(`Failed to update about award: ${id}`, error);
    return NextResponse.json({ error: 'Failed to update award' }, { status: 500 });
  }

  logger.info(`About award updated: ${id}`);
  return NextResponse.json({ award });
});

export const DELETE = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();

  // Only super_admin can delete awards
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('about_awards')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    logger.error(`Failed to delete about award: ${id}`, error);
    return NextResponse.json({ error: 'Failed to delete award' }, { status: 500 });
  }

  logger.info(`About award deleted: ${id}`);
  return NextResponse.json({ message: 'Award deleted successfully' });
});

