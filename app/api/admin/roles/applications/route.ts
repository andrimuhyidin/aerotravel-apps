/**
 * Admin API: Role Applications Management
 * GET  /api/admin/roles/applications - List all role applications
 * POST /api/admin/roles/applications/[id]/approve - Approve application
 * POST /api/admin/roles/applications/[id]/reject - Reject application
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';
  const roleParam = searchParams.get('role');

  try {
    let query = supabase
      .from('role_applications')
      .select(
        `
        id,
        user_id,
        requested_role,
        status,
        message,
        admin_notes,
        applied_at,
        reviewed_at,
        reviewed_by,
        rejection_reason,
        user:users(id, email, full_name, phone)
      `
      )
      .eq('status', status);

    if (roleParam) {
      const role = roleParam as UserRole;
      query = query.eq('requested_role', role) as typeof query;
    }

    const { data: applications, error } = await (query as any).order('applied_at', {
      ascending: false,
    });

    if (error) {
      logger.error('Failed to fetch role applications', error);
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      applications: applications || [],
    });
  } catch (error) {
    logger.error('Error in GET /api/admin/roles/applications', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

