/**
 * Admin API: User Roles Management
 * GET  /api/admin/roles/users/[userId] - Get user's roles
 * POST /api/admin/roles/users/[userId] - Add role to user
 * DELETE /api/admin/roles/users/[userId] - Remove role from user
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export const GET = withErrorHandler(async (
  request: NextRequest,
  context: RouteContext
) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await context.params;

  try {
    // Get user roles
    // Type assertion needed until types are regenerated after migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRoles, error } = await (supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: unknown) => {
            order: (column: string, options: { ascending: boolean }) => Promise<{
              data: Array<{
                id: string;
                role: UserRole;
                status: string;
                is_primary: boolean;
                created_at: string;
              }> | null;
              error: Error | null;
            }>;
          };
        };
      };
    })
      .from('user_roles')
      .select('id, role, status, is_primary, created_at')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false });

    if (error) {
      logger.error('Failed to fetch user roles', error, { userId });
      return NextResponse.json(
        { error: 'Failed to fetch user roles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      roles: userRoles || [],
    });
  } catch (error) {
    logger.error('Error in GET /api/admin/roles/users/[userId]', error, {
      userId,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  context: RouteContext
) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await context.params;
  const body = (await request.json()) as {
    role: UserRole;
    isPrimary?: boolean;
  };

  if (!body.role) {
    return NextResponse.json(
      { error: 'Role is required' },
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
    // Check if user already has this role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', body.role)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'User already has this role' },
        { status: 400 }
      );
    }

    // Get current roles to determine if this should be primary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentRoles } = await (supabase as any)
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');

    const isPrimary = body.isPrimary ?? (currentRoles?.length === 0);

    // If setting as primary, unset other primary roles
    if (isPrimary) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('user_roles')
        .update({ is_primary: false })
        .eq('user_id', userId);
    }

    // Add role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any).from('user_roles').insert({
      user_id: userId,
      role: body.role,
      status: 'active',
      is_primary: isPrimary,
      approved_at: new Date().toISOString(),
      approved_by: adminUser.id,
    });

    if (insertError) {
      logger.error('Failed to add user role', insertError, {
        userId,
        role: body.role,
      });
      return NextResponse.json(
        { error: 'Failed to add role' },
        { status: 500 }
      );
    }

    logger.info('User role added', {
      userId,
      role: body.role,
      adminId: adminUser.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Role added successfully',
    });
  } catch (error) {
    logger.error('Error in POST /api/admin/roles/users/[userId]', error, {
      userId,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  context: RouteContext
) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await context.params;
  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get('roleId');

  if (!roleId) {
    return NextResponse.json(
      { error: 'roleId is required' },
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
    // Soft delete: set status to 'suspended'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('user_roles')
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspended_reason: 'Removed by admin',
      })
      .eq('id', roleId)
      .eq('user_id', userId);

    if (updateError) {
      logger.error('Failed to remove user role', updateError, {
        userId,
        roleId,
      });
      return NextResponse.json(
        { error: 'Failed to remove role' },
        { status: 500 }
      );
    }

    logger.info('User role removed', {
      userId,
      roleId,
      adminId: adminUser.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Role removed successfully',
    });
  } catch (error) {
    logger.error('Error in DELETE /api/admin/roles/users/[userId]', error, {
      userId,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

