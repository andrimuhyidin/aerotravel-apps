/**
 * API: Admin - User Management
 * GET /api/admin/users/[userId] - Get user details
 * PATCH /api/admin/users/[userId] - Update user details (including employee fields)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { logProfileUpdate } from '@/lib/audit/audit-logger';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateUserSchema = z.object({
  employee_number: z.string().max(50).optional().nullable(),
  hire_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  supervisor_id: z.string().uuid().optional().nullable(),
  home_address: z.string().optional().nullable(),
});

export const GET = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
  ) => {
    const { userId } = await params;

    // Check authorization first
    const allowed = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get auth client to verify current user
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS for reading user details
    const supabase = await createAdminClient();

    // Get user details with employee fields
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        `
      id,
      full_name,
      phone,
      role,
      branch_id,
      employee_number,
      hire_date,
      supervisor_id,
      home_address,
      address,
      created_at,
      is_active
    `
      )
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      logger.warn('User not found', {
        userId,
        adminId: user.id,
        error: userError?.message,
      });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get supervisor name if exists
    let supervisorName: string | null = null;
    if (userData.supervisor_id) {
      const { data: supervisor } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userData.supervisor_id)
        .single();
      supervisorName = supervisor?.full_name || null;
    }

    return NextResponse.json({
      user: {
        ...userData,
        supervisor_name: supervisorName,
      },
    });
  }
);

export const PATCH = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
  ) => {
    const { userId } = await params;

    // Check authorization first
    const allowed = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get auth client to verify current user
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    // Use admin client to bypass RLS for updating user
    const supabase = await createAdminClient();

    // Get current user data for audit log
    const { data: currentUserData } = await supabase
      .from('users')
      .select('employee_number, hire_date, supervisor_id, home_address')
      .eq('id', userId)
      .single();

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.employee_number !== undefined) {
      updateData.employee_number = validated.employee_number || null;
    }
    if (validated.hire_date !== undefined) {
      updateData.hire_date = validated.hire_date || null;
    }
    if (validated.supervisor_id !== undefined) {
      // Validate supervisor exists
      if (validated.supervisor_id) {
        const { data: supervisor } = await supabase
          .from('users')
          .select('id')
          .eq('id', validated.supervisor_id)
          .single();

        if (!supervisor) {
          return NextResponse.json(
            { error: 'Supervisor not found' },
            { status: 400 }
          );
        }

        // Prevent self-reference
        if (validated.supervisor_id === userId) {
          return NextResponse.json(
            { error: 'User cannot be their own supervisor' },
            { status: 400 }
          );
        }
      }
      updateData.supervisor_id = validated.supervisor_id || null;
    }
    if (validated.home_address !== undefined) {
      updateData.home_address = validated.home_address || null;
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update user', updateError, {
        userId,
        adminId: user.id,
        updateData,
      });
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Log audit trail for employee field changes
    if (currentUserData) {
      const oldValues: Record<string, unknown> = {};
      const newValues: Record<string, unknown> = {};

      if (validated.employee_number !== undefined) {
        oldValues.employee_number = currentUserData.employee_number;
        newValues.employee_number = validated.employee_number;
      }
      if (validated.hire_date !== undefined) {
        oldValues.hire_date = currentUserData.hire_date;
        newValues.hire_date = validated.hire_date;
      }
      if (validated.supervisor_id !== undefined) {
        oldValues.supervisor_id = currentUserData.supervisor_id;
        newValues.supervisor_id = validated.supervisor_id;
      }
      if (validated.home_address !== undefined) {
        oldValues.home_address = currentUserData.home_address;
        newValues.home_address = validated.home_address;
      }

      if (Object.keys(newValues).length > 0) {
        await logProfileUpdate(userId, oldValues, newValues, 'admin');
      }
    }

    logger.info('User employee fields updated', {
      userId,
      adminId: user.id,
      fields: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  }
);
