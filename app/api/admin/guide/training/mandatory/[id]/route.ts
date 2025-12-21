/**
 * API: Mandatory Training Management (Admin) - Update/Delete
 * PATCH /api/admin/guide/training/mandatory/[id] - Update mandatory training
 * DELETE /api/admin/guide/training/mandatory/[id] - Delete mandatory training
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateMandatoryTrainingSchema = z.object({
  training_type: z.enum(['sop', 'safety', 'drill', 'chse', 'first_aid', 'other']).optional(),
  frequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
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

  const { id } = await params;
  const payload = updateMandatoryTrainingSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const { data: training, error } = await withBranchFilter(
    client.from('mandatory_trainings'),
    branchContext,
  )
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update mandatory training', error, { trainingId: id });
    return NextResponse.json({ error: 'Failed to update training' }, { status: 500 });
  }

  if (!training) {
    return NextResponse.json({ error: 'Training not found' }, { status: 404 });
  }

  logger.info('Mandatory training updated', { trainingId: id, adminId: user.id });

  return NextResponse.json({ training });
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
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

  const { id } = await params;
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const { error } = await withBranchFilter(
    client.from('mandatory_trainings'),
    branchContext,
  )
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Failed to delete mandatory training', error, { trainingId: id });
    return NextResponse.json({ error: 'Failed to delete training' }, { status: 500 });
  }

  logger.info('Mandatory training deleted', { trainingId: id, adminId: user.id });

  return NextResponse.json({ success: true, message: 'Training deleted successfully' });
});

