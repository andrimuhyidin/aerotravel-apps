/**
 * API: Admin - Performance Reviews
 * GET /api/admin/hr/performance - List performance reviews
 * POST /api/admin/hr/performance - Create performance review
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createReviewSchema = z.object({
  employeeId: z.string().uuid(),
  reviewPeriodStart: z.string(),
  reviewPeriodEnd: z.string(),
  overallRating: z.number().min(1).max(5),
  categories: z.array(z.object({
    name: z.string(),
    rating: z.number().min(1).max(5),
    comments: z.string().optional(),
  })).optional(),
  strengths: z.string().optional(),
  areasForImprovement: z.string().optional(),
  goals: z.string().optional(),
  comments: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'acknowledged']).default('draft'),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);

  const employeeId = searchParams.get('employeeId');
  const status = searchParams.get('status');
  const reviewerId = searchParams.get('reviewerId');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('performance_reviews')
      .select(`
        id,
        employee_id,
        reviewer_id,
        review_period_start,
        review_period_end,
        overall_rating,
        categories,
        strengths,
        areas_for_improvement,
        goals,
        comments,
        status,
        submitted_at,
        acknowledged_at,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (reviewerId) {
      query = query.eq('reviewer_id', reviewerId);
    }

    const { data: reviews, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch performance reviews', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Get employee and reviewer names
    const employeeIds = [...new Set((reviews || []).map(r => r.employee_id))];
    const reviewerIds = [...new Set((reviews || []).map(r => r.reviewer_id).filter(Boolean))];
    const allUserIds = [...new Set([...employeeIds, ...reviewerIds])];
    
    let usersMap: Record<string, { full_name: string; email: string; role: string }> = {};
    
    if (allUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .in('id', allUserIds);
      
      if (users) {
        usersMap = Object.fromEntries(
          users.map(u => [u.id, { 
            full_name: u.full_name || 'Unknown', 
            email: u.email,
            role: u.role 
          }])
        );
      }
    }

    const mappedReviews = (reviews || []).map(r => ({
      ...r,
      employee: usersMap[r.employee_id] || { full_name: 'Unknown', email: '', role: '' },
      reviewer: r.reviewer_id ? usersMap[r.reviewer_id] || { full_name: 'Unknown', email: '', role: '' } : null,
    }));

    return NextResponse.json({
      reviews: mappedReviews,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Unexpected error in performance reviews API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = createReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const {
    employeeId,
    reviewPeriodStart,
    reviewPeriodEnd,
    overallRating,
    categories,
    strengths,
    areasForImprovement,
    goals,
    comments,
    status,
  } = parsed.data;

  const supabase = await createAdminClient();

  try {
    // Verify employee exists
    const { data: employee, error: employeeError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', employeeId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const { data: review, error: createError } = await supabase
      .from('performance_reviews')
      .insert({
        employee_id: employeeId,
        reviewer_id: user.id,
        review_period_start: reviewPeriodStart,
        review_period_end: reviewPeriodEnd,
        overall_rating: overallRating,
        categories: categories || null,
        strengths: strengths || null,
        areas_for_improvement: areasForImprovement || null,
        goals: goals || null,
        comments: comments || null,
        status,
        submitted_at: status === 'submitted' ? new Date().toISOString() : null,
      })
      .select('id, overall_rating, status')
      .single();

    if (createError) {
      logger.error('Failed to create performance review', createError);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    logger.info('Performance review created', {
      reviewId: review?.id,
      employeeId,
      reviewerId: user.id,
      rating: overallRating,
    });

    return NextResponse.json({
      success: true,
      message: 'Performance review berhasil dibuat',
      review,
    });
  } catch (error) {
    logger.error('Unexpected error in create performance review', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

