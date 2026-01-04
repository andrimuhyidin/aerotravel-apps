/**
 * API: Admin - Bulk User Operations
 * POST /api/admin/users/bulk - Bulk update or deactivate users
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const bulkActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'update_role', 'export']),
  ids: z.array(z.string().uuid()).min(1).max(100),
  payload: z.record(z.unknown()).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check authorization - only super_admin can bulk manage users
  const allowed = await hasRole(['super_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Prevent self-modification in bulk
  const body = await request.json();
  const parsed = bulkActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { action, ids, payload } = parsed.data;

  // Check if user is trying to modify themselves
  if (ids.includes(user.id)) {
    return NextResponse.json(
      { error: 'Cannot modify your own account in bulk actions' },
      { status: 400 }
    );
  }

  const supabase = await createAdminClient();
  const results: Array<{ id: string; success: boolean; error?: string }> = [];

  try {
    switch (action) {
      case 'activate': {
        for (const id of ids) {
          try {
            const { error } = await supabase
              .from('users')
              .update({
                is_active: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', id);

            if (error) {
              results.push({ id, success: false, error: error.message });
            } else {
              results.push({ id, success: true });
            }
          } catch (err) {
            results.push({ id, success: false, error: 'Unexpected error' });
          }
        }
        break;
      }

      case 'deactivate': {
        for (const id of ids) {
          try {
            const { error } = await supabase
              .from('users')
              .update({
                is_active: false,
                updated_at: new Date().toISOString(),
              })
              .eq('id', id);

            if (error) {
              results.push({ id, success: false, error: error.message });
            } else {
              results.push({ id, success: true });
            }
          } catch (err) {
            results.push({ id, success: false, error: 'Unexpected error' });
          }
        }
        break;
      }

      case 'update_role': {
        const newRole = payload?.role as string;
        if (!newRole) {
          return NextResponse.json(
            { error: 'Role is required for update_role action' },
            { status: 400 }
          );
        }

        // Validate role
        const validRoles = ['customer', 'guide', 'mitra', 'ops_admin', 'marketing', 'finance_manager'];
        if (!validRoles.includes(newRole)) {
          return NextResponse.json(
            { error: 'Invalid role' },
            { status: 400 }
          );
        }

        for (const id of ids) {
          try {
            const { error } = await supabase
              .from('users')
              .update({
                role: newRole,
                updated_at: new Date().toISOString(),
              })
              .eq('id', id);

            if (error) {
              results.push({ id, success: false, error: error.message });
            } else {
              results.push({ id, success: true });
            }
          } catch (err) {
            results.push({ id, success: false, error: 'Unexpected error' });
          }
        }
        break;
      }

      case 'export': {
        const { data: users, error } = await supabase
          .from('users')
          .select(`
            id,
            full_name,
            email,
            phone,
            role,
            is_active,
            created_at
          `)
          .in('id', ids);

        if (error) {
          return NextResponse.json(
            { error: 'Failed to fetch users for export' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          action: 'export',
          data: users,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

    // Calculate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    logger.info('Bulk user action completed', {
      action,
      total: ids.length,
      successful,
      failed,
      performedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      action,
      summary: {
        total: ids.length,
        successful,
        failed,
      },
      results,
    });
  } catch (error) {
    logger.error('Bulk user action error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

