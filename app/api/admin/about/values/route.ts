/**
 * API: About Values Management (Admin)
 * GET /api/admin/about/values - List all values
 * POST /api/admin/about/values - Create new value
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createValueSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  icon_name: z.string().max(50).optional().nullable(),
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

  const { data: values, error } = await supabase
    .from('about_values')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    logger.error('Failed to fetch about values', error);
    return NextResponse.json({ error: 'Failed to fetch values' }, { status: 500 });
  }

  return NextResponse.json({ values });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Only super_admin can create values
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = createValueSchema.parse(await request.json());

  const { data: value, error } = await supabase
    .from('about_values')
    .insert(body)
    .select()
    .single();

  if (error) {
    logger.error('Failed to create about value', error);
    return NextResponse.json({ error: 'Failed to create value' }, { status: 500 });
  }

  logger.info('About value created', { id: value.id });
  return NextResponse.json({ value }, { status: 201 });
});

