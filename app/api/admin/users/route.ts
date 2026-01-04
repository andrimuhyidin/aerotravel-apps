/**
 * API: Admin - Users List
 * GET /api/admin/users - List all users with pagination and filters
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
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

  // Check authorization using user metadata (bypasses RLS issues)
  const userRole = user.user_metadata?.role as string;
  const allowedRoles = ['super_admin', 'ops_admin'];
  if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use admin client for data queries (bypasses RLS - already authorized above)
  const supabase = await createAdminClient();

  // Get query params
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || 'all';
  const status = searchParams.get('status') || 'all'; // all, active, inactive
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  const client = supabase as unknown as any;

  try {
    // Build query - no branch filter for super_admin
    let query = client.from('users').select(
      `
      id,
      full_name,
      email,
      phone,
      role,
      branch_id,
      is_active,
      created_at,
      updated_at,
      employee_number,
      avatar_url
    `,
      { count: 'exact' }
    );

    // Apply filters
    if (role !== 'all') {
      query = query.eq('role', role);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Search filter
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,phone.ilike.%${search}%,employee_number.ilike.%${search}%`
      );
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch users', error, {
        adminId: user.id,
        searchParams: { search, role, status, page, limit },
      });
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Get user roles for each user (multi-role support)
    type UserRecord = { id: string; full_name: string; role: string; [key: string]: unknown };
    type UserRoleRecord = { user_id: string; role: string; is_primary: boolean };
    
    const userIds = (users as UserRecord[] || []).map((u: UserRecord) => u.id);
    const { data: userRoles } = await client
      .from('user_roles')
      .select('user_id, role, is_primary')
      .in('user_id', userIds)
      .eq('status', 'active');

    const typedUserRoles = userRoles as UserRoleRecord[] | null;

    // Map roles to users
    const usersWithRoles = (users as UserRecord[] || []).map((userData: UserRecord) => {
      const roles =
        typedUserRoles
          ?.filter((ur: UserRoleRecord) => ur.user_id === userData.id)
          .map((ur: UserRoleRecord) => ur.role) || [];

      return {
        ...userData,
        roles,
        primaryRole: typedUserRoles?.find(
          (ur: UserRoleRecord) => ur.user_id === userData.id && ur.is_primary
        )?.role || userData.role,
      };
    });

    return NextResponse.json({
      users: usersWithRoles,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Error in GET /api/admin/users', error, {
      adminId: user.id,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

