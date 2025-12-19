/**
 * API: Guide Feedback
 * GET /api/guide/feedback - Get feedbacks
 * POST /api/guide/feedback - Create feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';


import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createFeedbackSchema = z.object({
  feedback_type: z.enum([
    'general',
    'app_improvement',
    'work_environment',
    'compensation',
    'training',
    'safety',
    'suggestion',
  ]),
  rating: z.number().min(1).max(10).optional(),
  title: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
  is_anonymous: z.boolean().optional().default(false),
  attachments: z.array(z.string().url()).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Check if user is guide or admin
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isGuide = userProfile?.role === 'guide';
  const isAdmin = ['super_admin', 'ops_admin', 'finance_manager'].includes(userProfile?.role || '');

  if (!isGuide && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Build query
  let query = client.from('guide_feedbacks').select('*');

  // Filter by guide (if guide) or branch (if admin)
  if (isGuide) {
    query = query.eq('guide_id', user.id);
  } else if (!branchContext.isSuperAdmin && branchContext.branchId) {
    query = query.eq('branch_id', branchContext.branchId);
  }

  // Apply filters
  const status = searchParams.get('status');
  if (status) {
    query = query.eq('status', status);
  }

  const feedbackType = searchParams.get('feedback_type');
  if (feedbackType) {
    query = query.eq('feedback_type', feedbackType);
  }

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: feedbacks, error } = await query;

  if (error) {
    logger.error('Failed to fetch feedbacks', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch feedbacks' }, { status: 500 });
  }

  // Get total count
  let countQuery = client.from('guide_feedbacks').select('*', { count: 'exact', head: true });

  if (isGuide) {
    countQuery = countQuery.eq('guide_id', user.id);
  } else if (!branchContext.isSuperAdmin && branchContext.branchId) {
    countQuery = countQuery.eq('branch_id', branchContext.branchId);
  }

  if (status) {
    countQuery = countQuery.eq('status', status);
  }
  if (feedbackType) {
    countQuery = countQuery.eq('feedback_type', feedbackType);
  }

  const { count } = await countQuery;

  return NextResponse.json({
    feedbacks: feedbacks || [],
    total: count || 0,
    page,
    limit,
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const body = await request.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate user is guide
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role, branch_id')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate input
  let validated;
  try {
    validated = createFeedbackSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Invalid feedback input', error, { guideId: user.id, body });
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // Create feedback
  const { data: feedback, error } = await client
    .from('guide_feedbacks')
    .insert({
      guide_id: user.id,
      branch_id: userProfile.branch_id,
      feedback_type: validated.feedback_type,
      rating: validated.rating,
      title: validated.title,
      message: validated.message,
      is_anonymous: validated.is_anonymous ?? false,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create feedback', error, { guideId: user.id, validated });
    // Provide more specific error message
    if (error.code === '23503') {
      return NextResponse.json({ error: 'Invalid guide or branch reference' }, { status: 400 });
    }
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Duplicate feedback' }, { status: 400 });
    }
    return NextResponse.json({ 
      error: 'Failed to create feedback',
      details: error.message 
    }, { status: 500 });
  }

  // Handle attachments if provided
  if (validated.attachments && validated.attachments.length > 0) {
    const attachments = validated.attachments.map((url) => ({
      feedback_id: feedback.id,
      file_url: url,
      file_type: url.split('.').pop() || 'unknown',
    }));

    await client.from('guide_feedback_attachments').insert(attachments);
  }

  logger.info('Feedback created', { feedbackId: feedback.id, guideId: user.id });

  return NextResponse.json({ feedback, id: feedback.id });
});
