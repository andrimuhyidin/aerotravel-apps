/**
 * User Roles API
 * GET /api/user/roles - Get all user roles
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getUserRoles } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Use regular client for auth
  const authClient = await createClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all active roles from user_metadata (bypasses RLS)
    const roles = await getUserRoles(user.id);

    // Use admin client for data queries (bypasses RLS)
    const supabase = await createAdminClient();

    // Get detailed role information
    const { data: userRoles, error } = await (supabase as any)
      .from('user_roles')
      .select('role, status, is_primary, applied_at, approved_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch user roles', error, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to fetch user roles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      roles,
      userRoles: userRoles || [],
    });
  } catch (error) {
    logger.error('Error in GET /api/user/roles', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

