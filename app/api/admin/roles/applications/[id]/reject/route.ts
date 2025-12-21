/**
 * Admin API: Reject Role Application
 * POST /api/admin/roles/applications/[id]/reject
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

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
    rejectionReason: string;
    adminNotes?: string;
  };

  if (!body.rejectionReason || body.rejectionReason.trim().length === 0) {
    return NextResponse.json(
      { error: 'Rejection reason is required' },
      { status: 400 }
    );
  }

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
                status: string;
              } | null;
              error: Error | null;
            }>;
          };
        };
      };
    })
      .from('role_applications')
      .select('id, user_id, status')
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

    // Update application status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('role_applications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser.id,
        rejection_reason: body.rejectionReason,
        admin_notes: body.adminNotes || null,
      })
      .eq('id', id);

    if (updateError) {
      logger.error('Failed to reject application', updateError, { id });
      return NextResponse.json(
        { error: 'Failed to reject application' },
        { status: 500 }
      );
    }

    logger.info('Role application rejected', {
      applicationId: id,
      userId: application.user_id,
      adminId: adminUser.id,
      reason: body.rejectionReason,
    });

    return NextResponse.json({
      success: true,
      message: 'Application rejected successfully',
    });
  } catch (error) {
    logger.error('Error in POST /api/admin/roles/applications/[id]/reject', error, {
      id,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

