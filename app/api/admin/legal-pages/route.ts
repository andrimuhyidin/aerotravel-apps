/**
 * API: Legal Pages Management (Admin)
 * GET /api/admin/legal-pages - List all legal pages
 * POST /api/admin/legal-pages - Create new legal page
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createLegalPageSchema = z.object({
  page_type: z.enum(['terms', 'privacy', 'dpo']),
  title: z.string().min(1).max(200),
  content_html: z.string().min(1),
  is_active: z.boolean().optional().default(true),
});

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  // Check authorization
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: pages, error } = await supabase
    .from('legal_pages')
    .select('*')
    .order('page_type', { ascending: true });

  if (error) {
    logger.error('Failed to fetch legal pages', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }

  return NextResponse.json({ pages });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Only super_admin can create legal pages
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = createLegalPageSchema.parse(await request.json());

  const { data: page, error } = await supabase
    .from('legal_pages')
    .insert({
      ...body,
      last_updated: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create legal page', error);
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }

  logger.info('Legal page created', { page_type: body.page_type });
  return NextResponse.json({ page }, { status: 201 });
});

