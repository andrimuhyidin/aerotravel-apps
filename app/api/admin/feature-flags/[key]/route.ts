/**
 * API: Feature Flag Management by Key
 * GET /api/admin/feature-flags/[key] - Get single flag
 * PUT /api/admin/feature-flags/[key] - Update flag
 * DELETE /api/admin/feature-flags/[key] - Delete flag
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ key: string }>;
};

const updateFlagSchema = z.object({
  flag_name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  is_enabled: z.boolean().optional(),
  rollout_percentage: z.number().min(0).max(100).optional(),
  target_roles: z.array(z.string()).nullable().optional(),
  target_users: z.array(z.string()).nullable().optional(),
  target_branches: z.array(z.string()).nullable().optional(),
});

export const GET = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
  const { key } = await context.params;
  const supabase = await createClient();

  // Check authorization
  const isAuthorized = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: flag, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('flag_key', key)
    .single();

  if (error || !flag) {
    return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
  }

  return NextResponse.json({ flag });
});

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { key } = await context.params;
  const supabase = await createClient();

  // Only super_admin can update feature flags
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = updateFlagSchema.parse(await request.json());

  // Check if flag exists
  const { data: existing } = await supabase
    .from('feature_flags')
    .select('id')
    .eq('flag_key', key)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
  }

  // Build update object
  const updateData: Record<string, unknown> = {};
  if (body.flag_name !== undefined) updateData.flag_name = body.flag_name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.is_enabled !== undefined) updateData.is_enabled = body.is_enabled;
  if (body.rollout_percentage !== undefined) updateData.rollout_percentage = body.rollout_percentage;
  if (body.target_roles !== undefined) updateData.target_roles = body.target_roles;
  if (body.target_users !== undefined) updateData.target_users = body.target_users;
  if (body.target_branches !== undefined) updateData.target_branches = body.target_branches;

  const { data: flag, error } = await supabase
    .from('feature_flags')
    .update(updateData)
    .eq('flag_key', key)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update feature flag', error, { key });
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }

  logger.info('Feature flag updated', { flagKey: key });

  return NextResponse.json({ flag });
});

export const DELETE = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
  const { key } = await context.params;
  const supabase = await createClient();

  // Only super_admin can delete feature flags
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('feature_flags')
    .delete()
    .eq('flag_key', key);

  if (error) {
    logger.error('Failed to delete feature flag', error, { key });
    return NextResponse.json({ error: 'Failed to delete feature flag' }, { status: 500 });
  }

  logger.info('Feature flag deleted', { flagKey: key });

  return NextResponse.json({ message: 'Feature flag deleted successfully' });
});

