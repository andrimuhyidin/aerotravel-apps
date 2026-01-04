/**
 * API: Admin - Employee Attendance
 * GET /api/admin/hr/attendance - List attendance records
 * POST /api/admin/hr/attendance - Record attendance
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const recordAttendanceSchema = z.object({
  employeeId: z.string().uuid(),
  attendanceDate: z.string(),
  status: z.enum(['present', 'absent', 'late', 'leave', 'sick', 'half_day', 'remote']),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
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
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('employee_attendance')
      .select(`
        id,
        employee_id,
        attendance_date,
        check_in_time,
        check_out_time,
        status,
        late_minutes,
        work_hours,
        notes,
        location,
        created_at
      `, { count: 'exact' })
      .order('attendance_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (startDate) {
      query = query.gte('attendance_date', startDate);
    }

    if (endDate) {
      query = query.lte('attendance_date', endDate);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: attendance, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch attendance', error);
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      );
    }

    // Get employee names
    const employeeIds = [...new Set((attendance || []).map(a => a.employee_id))];
    let employeesMap: Record<string, { full_name: string; email: string }> = {};
    
    if (employeeIds.length > 0) {
      const { data: employees } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', employeeIds);
      
      if (employees) {
        employeesMap = Object.fromEntries(
          employees.map(e => [e.id, { full_name: e.full_name || 'Unknown', email: e.email }])
        );
      }
    }

    const mappedAttendance = (attendance || []).map(a => ({
      ...a,
      employee: employeesMap[a.employee_id] || { full_name: 'Unknown', email: '' },
    }));

    return NextResponse.json({
      attendance: mappedAttendance,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Unexpected error in attendance API', error);
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
  const parsed = recordAttendanceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const {
    employeeId,
    attendanceDate,
    status,
    checkInTime,
    checkOutTime,
    notes,
    location,
  } = parsed.data;

  const supabase = await createAdminClient();

  try {
    // Check if attendance already exists for this date
    const { data: existing } = await supabase
      .from('employee_attendance')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('attendance_date', attendanceDate)
      .single();

    // Calculate work hours if both check-in and check-out provided
    let workHours = 0;
    let lateMinutes = 0;
    
    if (checkInTime && checkOutTime) {
      const checkIn = new Date(checkInTime);
      const checkOut = new Date(checkOutTime);
      workHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      
      // Calculate late minutes (assuming 9 AM start)
      const expectedStart = new Date(attendanceDate);
      expectedStart.setHours(9, 0, 0, 0);
      if (checkIn > expectedStart) {
        lateMinutes = Math.round((checkIn.getTime() - expectedStart.getTime()) / (1000 * 60));
      }
    }

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('employee_attendance')
        .update({
          status,
          check_in_time: checkInTime || null,
          check_out_time: checkOutTime || null,
          work_hours: Math.round(workHours * 100) / 100,
          late_minutes: lateMinutes,
          notes: notes || null,
          location: location || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        logger.error('Failed to update attendance', updateError);
        return NextResponse.json(
          { error: 'Failed to update attendance' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Attendance updated',
        attendance: { id: existing.id },
      });
    }

    // Create new attendance record
    const { data: attendance, error: createError } = await supabase
      .from('employee_attendance')
      .insert({
        employee_id: employeeId,
        attendance_date: attendanceDate,
        status,
        check_in_time: checkInTime || null,
        check_out_time: checkOutTime || null,
        work_hours: Math.round(workHours * 100) / 100,
        late_minutes: lateMinutes,
        notes: notes || null,
        location: location || null,
        recorded_by: user.id,
      })
      .select('id')
      .single();

    if (createError) {
      logger.error('Failed to create attendance', createError);
      return NextResponse.json(
        { error: 'Failed to record attendance' },
        { status: 500 }
      );
    }

    logger.info('Attendance recorded', {
      attendanceId: attendance?.id,
      employeeId,
      date: attendanceDate,
      status,
      recordedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded',
      attendance: { id: attendance?.id },
    });
  } catch (error) {
    logger.error('Unexpected error in record attendance', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

