/**
 * API: Admin - Bulk Booking Operations
 * POST /api/admin/bookings/bulk - Bulk update or delete bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const bulkActionSchema = z.object({
  action: z.enum(['update_status', 'delete', 'cancel', 'export']),
  ids: z.array(z.string().uuid()).min(1).max(100),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
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
  const parsed = bulkActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { action, ids, payload } = parsed.data;
  const supabase = await createAdminClient();
  const results: Array<{ id: string; success: boolean; error?: string }> = [];

  try {
    switch (action) {
      case 'update_status': {
        const newStatus = payload?.status as string;
        if (!newStatus) {
          return NextResponse.json(
            { error: 'Status is required for update_status action' },
            { status: 400 }
          );
        }

        for (const id of ids) {
          try {
            const { error } = await supabase
              .from('bookings')
              .update({
                status: newStatus as 'draft' | 'pending_payment' | 'awaiting_full_payment' | 'paid' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'refunded',
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

      case 'cancel': {
        const reason = payload?.reason as string || 'Bulk cancellation by admin';

        for (const id of ids) {
          try {
            const { error } = await supabase
              .from('bookings')
              .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancellation_reason: reason,
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

      case 'delete': {
        // Soft delete - only for super_admin
        const isSuperAdmin = await hasRole(['super_admin']);
        if (!isSuperAdmin) {
          return NextResponse.json(
            { error: 'Only super admin can delete bookings' },
            { status: 403 }
          );
        }

        for (const id of ids) {
          try {
            const { error } = await supabase
              .from('bookings')
              .update({
                deleted_at: new Date().toISOString(),
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
        // Export is handled differently - return the data for export
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_code,
            trip_date,
            customer_name,
            customer_phone,
            customer_email,
            adult_pax,
            child_pax,
            infant_pax,
            total_amount,
            status,
            created_at,
            packages(name, destination)
          `)
          .in('id', ids);

        if (error) {
          return NextResponse.json(
            { error: 'Failed to fetch bookings for export' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          action: 'export',
          data: bookings,
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

    logger.info('Bulk booking action completed', {
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
    logger.error('Bulk booking action error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

