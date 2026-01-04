/**
 * API: About Stats Management (Admin)
 * GET /api/admin/about/stats - List all stats
 * POST /api/admin/about/stats - Create new stat
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createStatSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(50),
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

  const { data: stats, error } = await supabase
    .from('about_stats')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    logger.error('Failed to fetch about stats', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }

  return NextResponse.json({ stats });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Only super_admin can create stats
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = createStatSchema.parse(await request.json());

  const { data: stat, error } = await supabase
    .from('about_stats')
    .insert(body)
    .select()
    .single();

  if (error) {
    logger.error('Failed to create about stat', error);
    return NextResponse.json({ error: 'Failed to create stat' }, { status: 500 });
  }

  logger.info('About stat created', { id: stat.id });
  return NextResponse.json({ stat }, { status: 201 });
});

