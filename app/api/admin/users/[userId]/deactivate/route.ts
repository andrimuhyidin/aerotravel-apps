/**
 * Admin User Deactivate/Activate API
 * POST /api/admin/users/[userId]/deactivate
 * 
 * Deactivates or activates a user account
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createAdminClient, createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ userId: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const { userId } = await params;
  
  logger.info('POST /api/admin/users/[userId]/deactivate', { userId });

  // Check admin role
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden - Super Admin or Ops Admin only' }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Prevent deactivating yourself
  if (currentUser.id === userId) {
    return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
  }

  try {
    // Parse body to get action (activate or deactivate)
    const body = await request.json().catch(() => ({})) as { action?: 'activate' | 'deactivate' };
    const action = body.action || 'deactivate';
    const newStatus = action === 'activate';

    // Get current user status
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, full_name, role, is_active')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deactivating super_admin if not super_admin
    const currentUserRole = currentUser.user_metadata?.role as string;
    if (targetUser.role === 'super_admin' && currentUserRole !== 'super_admin') {
      return NextResponse.json({ error: 'Only Super Admin can deactivate other Super Admins' }, { status: 403 });
    }

    // Update user status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      logger.error('Failed to update user status', updateError, { userId });
      throw updateError;
    }

    // Log to audit_logs
    try {
      const adminClient = await createAdminClient();
      await adminClient.from('audit_logs').insert({
        user_id: currentUser.id,
        user_email: currentUser.email,
        user_role: currentUserRole,
        action: 'update',
        entity_type: 'user',
        entity_id: userId,
        description: `User ${targetUser.full_name || userId} ${action === 'activate' ? 'activated' : 'deactivated'}`,
        old_values: { is_active: targetUser.is_active },
        new_values: { is_active: newStatus },
      });
    } catch (auditError) {
      // Don't fail if audit log fails
      logger.error('Failed to write audit log', auditError, { userId });
    }

    // If deactivating, try to revoke sessions (soft - just log for now)
    if (!newStatus) {
      logger.info('User deactivated, sessions should be invalidated on next auth check', { userId });
      // Note: In a production system, you might want to use Supabase Admin API
      // to revoke all refresh tokens for this user
    }

    logger.info(`User ${action === 'activate' ? 'activated' : 'deactivated'} successfully`, {
      userId,
      userName: targetUser.full_name,
      by: currentUser.id,
    });

    return NextResponse.json({
      success: true,
      message: `User ${action === 'activate' ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: userId,
        is_active: newStatus,
      },
    });
  } catch (error) {
    logger.error('Failed to deactivate/activate user', error, { userId });
    throw error;
  }
});

