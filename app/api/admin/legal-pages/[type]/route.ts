/**
 * API: Legal Page Management by Type (Admin)
 * GET /api/admin/legal-pages/[type] - Get specific legal page
 * PUT /api/admin/legal-pages/[type] - Update legal page
 * DELETE /api/admin/legal-pages/[type] - Delete legal page (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ type: string }>;
};

const updateLegalPageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content_html: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { type } = await context.params;
  const supabase = await createClient();

  // Check authorization
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: page, error } = await supabase
    .from('legal_pages')
    .select('*')
    .eq('page_type', type)
    .single();

  if (error) {
    logger.error(`Failed to fetch legal page: ${type}`, error);
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  return NextResponse.json({ page });
});

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { type } = await context.params;
  const supabase = await createClient();

  // Only super_admin can update legal pages
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = updateLegalPageSchema.parse(await request.json());

  const updateData: Record<string, unknown> = {
    ...body,
    updated_at: new Date().toISOString(),
  };

  if (body.content_html !== undefined) {
    updateData.last_updated = new Date().toISOString();
  }

  const { data: page, error } = await supabase
    .from('legal_pages')
    .update(updateData)
    .eq('page_type', type)
    .select()
    .single();

  if (error) {
    logger.error(`Failed to update legal page: ${type}`, error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }

  logger.info(`Legal page updated: ${type}`);
  return NextResponse.json({ page });
});

export const DELETE = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { type } = await context.params;
  const supabase = await createClient();

  // Only super_admin can delete legal pages
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('legal_pages')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('page_type', type);

  if (error) {
    logger.error(`Failed to delete legal page: ${type}`, error);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }

  logger.info(`Legal page deleted: ${type}`);
  return NextResponse.json({ message: 'Page deleted successfully' });
});

