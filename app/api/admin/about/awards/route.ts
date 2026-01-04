/**
 * API: About Awards Management (Admin)
 * GET /api/admin/about/awards - List all awards
 * POST /api/admin/about/awards - Create new award
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createAwardSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  display_order: z.number().optional().default(0),
  is_active: z.boolean().optional().default(true),
});

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  // Check authorization
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: awards, error } = await supabase
    .from('about_awards')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    logger.error('Failed to fetch about awards', error);
    return NextResponse.json({ error: 'Failed to fetch awards' }, { status: 500 });
  }

  return NextResponse.json({ awards });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Only super_admin can create awards
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = createAwardSchema.parse(await request.json());

  const { data: award, error } = await supabase
    .from('about_awards')
    .insert(body)
    .select()
    .single();

  if (error) {
    logger.error('Failed to create about award', error);
    return NextResponse.json({ error: 'Failed to create award' }, { status: 500 });
  }

  logger.info('About award created', { id: award.id });
  return NextResponse.json({ award }, { status: 201 });
});

