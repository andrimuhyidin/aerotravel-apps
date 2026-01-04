/**
 * API: Guide Feedback Detail
 * GET /api/guide/feedback/[id] - Get feedback detail
 * PATCH /api/guide/feedback/[id] - Update feedback (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateFeedbackSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'in_progress', 'resolved', 'closed']).optional(),
  admin_response: z.string().optional(),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get feedback
  const { data: feedback, error } = await client
    .from('guide_feedbacks')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !feedback) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
  }

  // Check access
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isGuide = userProfile?.role === 'guide';
  const isAdmin = ['super_admin', 'ops_admin', 'finance_manager'].includes(userProfile?.role || '');

  if (isGuide && feedback.guide_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (isAdmin) {
    const branchContext = await getBranchContext(user.id);
    if (!branchContext.isSuperAdmin && feedback.branch_id !== branchContext.branchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Get attachments
  const { data: attachments } = await client
    .from('guide_feedback_attachments')
    .select('*')
    .eq('feedback_id', id);

  return NextResponse.json({
    feedback,
    attachments: attachments || [],
  });
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if admin
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['super_admin', 'ops_admin', 'finance_manager'].includes(userProfile?.role || '');

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate input
  const validated = updateFeedbackSchema.parse(body);

  // Update feedback
  const updateData: Record<string, unknown> = {
    ...validated,
  };

  if (validated.admin_response) {
    updateData.admin_response = validated.admin_response;
    updateData.admin_id = user.id;
    updateData.responded_at = new Date().toISOString();
  }

  const { data: feedback, error } = await client
    .from('guide_feedbacks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update feedback', error, { feedbackId: id });
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }

  logger.info('Feedback updated', { feedbackId: id, adminId: user.id });

  return NextResponse.json({ feedback });
});
