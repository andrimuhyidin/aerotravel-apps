/**
 * API: Permenparekraf Assessment Detail
 * Route: /api/admin/compliance/permenparekraf/[id]
 * Purpose: Update, approve, or delete specific assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const updateStatusSchema = z.object({
  status: z.enum(['draft', 'submitted', 'under_review', 'revision_required', 'approved', 'rejected']),
  reviewNotes: z.string().optional(),
});

/**
 * GET /api/admin/compliance/permenparekraf/[id]
 * Get assessment details
 */
export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  const { data: assessment, error } = await supabase
    .from('permenparekraf_self_assessments')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
  }

  return NextResponse.json({ assessment });
});

/**
 * PATCH /api/admin/compliance/permenparekraf/[id]
 * Update assessment status (submit, review, approve)
 */
export const PATCH = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (!profile || !['super_admin', 'ops_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { status, reviewNotes } = parsed.data;

  const updateData: Record<string, unknown> = {
    status,
  };

  if (reviewNotes) {
    updateData.review_notes = reviewNotes;
  }

  if (status === 'under_review' || status === 'approved' || status === 'rejected') {
    updateData.reviewed_by = user.id;
    updateData.reviewed_at = new Date().toISOString();
  }

  if (status === 'approved') {
    updateData.approved_by = user.id;
    updateData.approved_at = new Date().toISOString();
  }

  const { data: assessment, error } = await supabase
    .from('permenparekraf_self_assessments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update assessment', error);
    return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 });
  }

  logger.info('Assessment status updated', { assessmentId: id, status });

  return NextResponse.json({
    success: true,
    assessment,
  });
});

/**
 * DELETE /api/admin/compliance/permenparekraf/[id]
 * Delete assessment
 */
export const DELETE = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is super_admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (!profile || profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;

  const { error } = await supabase
    .from('permenparekraf_self_assessments')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Failed to delete assessment', error);
    return NextResponse.json({ error: 'Failed to delete assessment' }, { status: 500 });
  }

  logger.info('Assessment deleted', { assessmentId: id });

  return NextResponse.json({
    success: true,
    message: 'Assessment deleted successfully',
  });
});

