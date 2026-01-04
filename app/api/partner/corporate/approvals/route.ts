/**
 * API: Corporate Approvals
 * GET /api/partner/corporate/approvals - List approvals
 * POST /api/partner/corporate/approvals - Create approval request
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeSearchParams } from '@/lib/api/partner-helpers';
import {
  createApprovalRequest,
  getCorporateClient,
  getPendingApprovals,
  type ApprovalStatus,
} from '@/lib/corporate';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createApprovalSchema = z.object({
  bookingId: z.string().uuid('Booking ID tidak valid'),
  employeeId: z.string().uuid('Employee ID tidak valid'),
  requestedAmount: z.number().positive('Jumlah harus positif'),
  requestNotes: z.string().optional(),
});

/**
 * GET /api/partner/corporate/approvals
 * List approvals with optional status filter
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const corporate = await getCorporateClient(user.id);

    if (!corporate) {
      return NextResponse.json(
        { error: 'No corporate access' },
        { status: 403 }
      );
    }

    // Sanitize search params
    const searchParams = sanitizeSearchParams(request);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') as ApprovalStatus | null;

    const result = await getPendingApprovals(corporate.id, {
      limit: Math.min(Math.max(1, limit), 100),
      offset: Math.max(0, offset),
      status: status || undefined,
    });

    return NextResponse.json({
      approvals: result.approvals,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.approvals.length < result.total,
      },
    });
  } catch (error) {
    logger.error('Failed to get approvals', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to get approvals' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/partner/corporate/approvals
 * Create new approval request
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const corporate = await getCorporateClient(user.id);

    if (!corporate) {
      return NextResponse.json(
        { error: 'No corporate access' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createApprovalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify employee belongs to this corporate
    const { data: employee } = await supabase
      .from('corporate_employees')
      .select('id, corporate_id, user_id')
      .eq('id', parsed.data.employeeId)
      .single();

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const employeeData = employee as {
      corporate_id: string;
      user_id: string | null;
    };

    if (employeeData.corporate_id !== corporate.id) {
      return NextResponse.json(
        { error: 'Employee does not belong to your corporate' },
        { status: 403 }
      );
    }

    // Verify user is the employee or PIC
    if (employeeData.user_id !== user.id && corporate.picId !== user.id) {
      return NextResponse.json(
        { error: 'You can only create approval requests for yourself' },
        { status: 403 }
      );
    }

    const result = await createApprovalRequest(
      corporate.id,
      parsed.data.bookingId,
      parsed.data.employeeId,
      parsed.data.requestedAmount,
      parsed.data.requestNotes
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create approval request' },
        { status: 400 }
      );
    }

    logger.info('Approval request created via API', {
      approvalId: result.approvalId,
      corporateId: corporate.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      approvalId: result.approvalId,
    });
  } catch (error) {
    logger.error('Failed to create approval request', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to create approval request' },
      { status: 500 }
    );
  }
});

