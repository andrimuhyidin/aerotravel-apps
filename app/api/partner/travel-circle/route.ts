/**
 * API: Travel Circle CRUD
 * GET /api/partner/travel-circle - List travel circles
 * POST /api/partner/travel-circle - Create travel circle
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createTravelCircle, getTravelCircle } from '@/lib/partner/travel-circle';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createCircleSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
  targetAmount: z.number().min(100000), // Min Rp 100k
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  packageId: z.string().uuid().optional(),
  preferredDestination: z.string().max(255).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // 'active', 'completed', 'cancelled'
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const client = supabase as unknown as any;

  try {
    // Get circles where user is creator or member
    let query = client
      .from('travel_circles')
      .select(
        `
        *,
        members:travel_circle_members!inner(user_id)
      `,
        { count: 'exact' }
      )
      .or(`created_by.eq.${user.id},members.user_id.eq.${user.id}`);

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Order by created_at
    query = query.order('created_at', { ascending: false });

    // Paginate
    const { data: circles, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch travel circles', error, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to fetch travel circles', details: error.message },
        { status: 500 }
      );
    }

    // Transform data
    const transformedCircles = (circles || []).map((circle: unknown) => {
      const c = circle as {
        id: string;
        name: string;
        description?: string;
        target_amount: number;
        target_date: string;
        package_id?: string;
        preferred_destination?: string;
        status: string;
        current_amount: number;
        contribution_count: number;
        created_by: string;
        branch_id?: string;
        created_at: string;
        updated_at: string;
        completed_at?: string;
      };
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        targetAmount: Number(c.target_amount),
        targetDate: c.target_date,
        packageId: c.package_id,
        preferredDestination: c.preferred_destination,
        status: c.status,
        currentAmount: Number(c.current_amount),
        contributionCount: Number(c.contribution_count || 0),
        createdBy: c.created_by,
        branchId: c.branch_id,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        completedAt: c.completed_at,
        progress: {
          percentage: c.target_amount > 0
            ? Math.min(100, (Number(c.current_amount) / Number(c.target_amount)) * 100)
            : 0,
          remaining: Math.max(0, Number(c.target_amount) - Number(c.current_amount)),
        },
      };
    });

    return NextResponse.json({
      circles: transformedCircles,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch travel circles', error, { userId: user.id });
    throw error;
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const data = createCircleSchema.parse(body);

  try {
    // Get partner branch_id
    const { data: partner } = await supabase
      .from('users')
      .select('id, branch_id')
      .eq('id', user.id)
      .single();

    // Validate target date is in the future
    const targetDate = new Date(data.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      return NextResponse.json(
        { error: 'Target date harus di masa depan' },
        { status: 400 }
      );
    }

    // Create circle
    const result = await createTravelCircle({
      name: data.name,
      description: data.description,
      targetAmount: data.targetAmount,
      targetDate: data.targetDate,
      packageId: data.packageId,
      preferredDestination: data.preferredDestination,
      createdBy: user.id,
      branchId: partner?.branch_id || null,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    logger.info('Travel circle created', {
      userId: user.id,
      circleId: result.circleId,
    });

    return NextResponse.json({
      success: true,
      circleId: result.circleId,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to create travel circle', error, { userId: user.id });
    throw error;
  }
});

