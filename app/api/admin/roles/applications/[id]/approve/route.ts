/**
 * Admin API: Approve Role Application
 * POST /api/admin/roles/applications/[id]/approve
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getUserRoles } from '@/lib/session/active-role';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (
  request: NextRequest,
  context: RouteContext
) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    adminNotes?: string;
  };

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get application
    // Type assertion needed until types are regenerated after migration
     
    const { data: application, error: appError } = await (supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: unknown) => {
            single: () => Promise<{
              data: {
                id: string;
                user_id: string;
                requested_role: UserRole;
                status: string;
              } | null;
              error: Error | null;
            }>;
          };
        };
      };
    })
      .from('role_applications')
      .select('id, user_id, requested_role, status')
      .eq('id', id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'Application already reviewed' },
        { status: 400 }
      );
    }

    // Check if user already has this role
    const userRoles = await getUserRoles(application.user_id);
    if (userRoles.includes(application.requested_role)) {
      // Update application status to approved (already has role)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('role_applications').update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser.id,
        admin_notes: body.adminNotes || null,
      }).eq('id', id);

      return NextResponse.json({
        success: true,
        message: 'User already has this role',
      });
    }

    // Update application status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('role_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser.id,
        admin_notes: body.adminNotes || null,
      })
      .eq('id', id);

    if (updateError) {
      logger.error('Failed to update application', updateError, { id });
      return NextResponse.json(
        { error: 'Failed to approve application' },
        { status: 500 }
      );
    }

    // Create user_role entry
    const isPrimary = userRoles.length === 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: roleError } = await (supabase as any).from('user_roles').insert({
      user_id: application.user_id,
      role: application.requested_role,
      status: 'active',
      is_primary: isPrimary,
      applied_at: application.status === 'pending' ? new Date().toISOString() : null,
      approved_at: new Date().toISOString(),
      approved_by: adminUser.id,
    });

    if (roleError) {
      logger.error('Failed to create user role', roleError, {
        userId: application.user_id,
        role: application.requested_role,
      });
      return NextResponse.json(
        { error: 'Failed to create user role' },
        { status: 500 }
      );
    }

    logger.info('Role application approved', {
      applicationId: id,
      userId: application.user_id,
      role: application.requested_role,
      adminId: adminUser.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Application approved successfully',
    });
  } catch (error) {
    logger.error('Error in POST /api/admin/roles/applications/[id]/approve', error, {
      id,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

