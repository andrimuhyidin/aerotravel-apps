/**
 * API: Admin - Leave Requests
 * GET /api/admin/hr/leave - List leave requests
 * POST /api/admin/hr/leave - Create leave request
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createLeaveSchema = z.object({
  employeeId: z.string().uuid(),
  leaveType: z.enum(['annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(5),
  attachmentUrl: z.string().url().optional(),
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
  const leaveType = searchParams.get('leaveType');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('leave_requests')
      .select(`
        id,
        employee_id,
        leave_type,
        start_date,
        end_date,
        days_count,
        reason,
        status,
        reviewed_by,
        reviewed_at,
        review_notes,
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (leaveType) {
      query = query.eq('leave_type', leaveType);
    }

    const { data: leaveRequests, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch leave requests', error);
      return NextResponse.json(
        { error: 'Failed to fetch leave requests' },
        { status: 500 }
      );
    }

    // Get employee names
    const employeeIds = [...new Set((leaveRequests || []).map(l => l.employee_id))];
    let employeesMap: Record<string, { full_name: string }> = {};
    
    if (employeeIds.length > 0) {
      const { data: employees } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', employeeIds);
      
      if (employees) {
        employeesMap = Object.fromEntries(
          employees.map(e => [e.id, { full_name: e.full_name || 'Unknown' }])
        );
      }
    }

    const mappedLeaves = (leaveRequests || []).map(l => ({
      ...l,
      employee: employeesMap[l.employee_id] || { full_name: 'Unknown' },
    }));

    return NextResponse.json({
      leaveRequests: mappedLeaves,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Unexpected error in leave requests API', error);
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
  const parsed = createLeaveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const {
    employeeId,
    leaveType,
    startDate,
    endDate,
    reason,
    attachmentUrl,
  } = parsed.data;

  const supabase = await createAdminClient();

  try {
    // Calculate days count
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (daysCount < 1) {
      return NextResponse.json(
        { error: 'End date must be after or same as start date' },
        { status: 400 }
      );
    }

    // Create leave request
    const { data: leaveRequest, error: createError } = await supabase
      .from('leave_requests')
      .insert({
        employee_id: employeeId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        days_count: daysCount,
        reason,
        attachment_url: attachmentUrl || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (createError) {
      logger.error('Failed to create leave request', createError);
      return NextResponse.json(
        { error: 'Failed to create leave request' },
        { status: 500 }
      );
    }

    logger.info('Leave request created', {
      leaveRequestId: leaveRequest?.id,
      employeeId,
      leaveType,
      daysCount,
    });

    return NextResponse.json({
      success: true,
      message: 'Leave request created',
      leaveRequest: { id: leaveRequest?.id, daysCount },
    });
  } catch (error) {
    logger.error('Unexpected error in create leave request', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

