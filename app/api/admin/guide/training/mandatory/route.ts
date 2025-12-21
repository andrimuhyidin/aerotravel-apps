/**
 * API: Mandatory Training Management (Admin)
 * POST /api/admin/guide/training/mandatory - Create mandatory training rule
 * GET /api/admin/guide/training/mandatory - List mandatory trainings
 * PATCH /api/admin/guide/training/mandatory/[id] - Update mandatory training
 * DELETE /api/admin/guide/training/mandatory/[id] - Delete mandatory training
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createMandatoryTrainingSchema = z.object({
  training_type: z.enum(['sop', 'safety', 'drill', 'chse', 'first_aid', 'other']),
  frequency: z.enum(['monthly', 'quarterly', 'yearly']),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

const updateMandatoryTrainingSchema = createMandatoryTrainingSchema.partial();

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const allowed = await hasRole(['super_admin', 'ops_admin']);

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const { data: trainings, error } = await withBranchFilter(
    client.from('mandatory_trainings'),
    branchContext,
  )
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch mandatory trainings', error);
    return NextResponse.json({ error: 'Failed to fetch trainings' }, { status: 500 });
  }

  return NextResponse.json({ trainings: trainings || [] });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const allowed = await hasRole(['super_admin', 'ops_admin']);

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  const payload = createMandatoryTrainingSchema.parse(await request.json());
  const client = supabase as unknown as any;

  const { data: training, error } = await withBranchFilter(
    client.from('mandatory_trainings'),
    branchContext,
  )
    .insert({
      branch_id: branchContext.branchId,
      training_type: payload.training_type,
      frequency: payload.frequency,
      title: payload.title,
      description: payload.description || null,
      is_active: payload.is_active,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create mandatory training', error);
    return NextResponse.json({ error: 'Failed to create training' }, { status: 500 });
  }

  logger.info('Mandatory training created', { trainingId: training.id, adminId: user.id });

  return NextResponse.json({ training });
});

