/**
 * API: Feature Flags Management
 * GET /api/admin/feature-flags - List all feature flags
 * POST /api/admin/feature-flags - Create new feature flag
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createFlagSchema = z.object({
  flag_key: z.string().min(1).max(100).regex(/^[a-z][a-z0-9_-]*$/, 'Must be lowercase with hyphens/underscores'),
  flag_name: z.string().min(1).max(200),
  description: z.string().optional(),
  is_enabled: z.boolean().optional().default(false),
  rollout_percentage: z.number().min(0).max(100).optional().default(0),
  target_roles: z.array(z.string()).optional(),
});

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  // Check authorization
  const isAuthorized = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: flags, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('flag_name', { ascending: true });

  if (error) {
    logger.error('Failed to fetch feature flags', error);
    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
  }

  return NextResponse.json({ flags });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Only super_admin can create feature flags
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = createFlagSchema.parse(await request.json());

  const { data: flag, error } = await supabase
    .from('feature_flags')
    .insert({
      flag_key: body.flag_key,
      flag_name: body.flag_name,
      description: body.description,
      is_enabled: body.is_enabled,
      rollout_percentage: body.rollout_percentage,
      target_roles: body.target_roles,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create feature flag', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Flag key already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create feature flag' }, { status: 500 });
  }

  logger.info('Feature flag created', { flagKey: body.flag_key });

  return NextResponse.json({ flag }, { status: 201 });
});

