/**
 * API: Admin - Booking Detail
 * GET /api/admin/bookings/[bookingId] - Get booking details with related data
 * PATCH /api/admin/bookings/[bookingId] - Update booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateBookingSchema = z.object({
  customer_name: z.string().min(2).max(200).optional(),
  customer_phone: z.string().regex(/^[0-9+\-\s()]+$/).optional(),
  customer_email: z.string().email().optional().nullable(),
  adult_pax: z.number().int().min(1).optional(),
  child_pax: z.number().int().min(0).optional(),
  infant_pax: z.number().int().min(0).optional(),
  special_requests: z.string().max(1000).optional().nullable(),
  status: z.enum([
    'draft',
    'pending_payment',
    'awaiting_full_payment',
    'paid',
    'confirmed',
    'ongoing',
    'cancelled',
    'refunded',
    'completed',
  ]).optional(),
});

export const GET = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ bookingId: string }> }
  ) => {
    const { bookingId } = await params;

    // Check authorization first
    const allowed = await hasRole([
      'super_admin',
      'ops_admin',
      'finance_manager',
      'marketing',
    ]);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get auth client to verify user
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS for reading booking details
    // Authorization is already checked above
    const supabase = await createAdminClient();

    try {
      // Fetch booking with package
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(
          `
          *,
          packages(id, name, destination, trip_type, duration_days)
        `
        )
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        logger.warn('Booking not found', {
          bookingId,
          adminId: user.id,
          error: bookingError?.message,
        });
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      // Fetch trip assignment if exists
      const { data: tripBooking } = await supabase
        .from('trip_bookings')
        .select(
          `
          trip_id,
          trips(id, trip_code, trip_date, status, guide_id, guides:users(full_name, phone))
        `
        )
        .eq('booking_id', bookingId)
        .single();

      // Fetch payments if exists
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      // Fetch audit logs for this booking
      const { data: activityLog } = await supabase
        .from('audit_logs')
        .select(
          `
          id,
          action,
          resource_type,
          created_at,
          users(full_name, email)
        `
        )
        .eq('resource_type', 'booking')
        .eq('resource_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(20);

      return NextResponse.json({
        booking: {
          ...booking,
          trip: tripBooking?.trips || null,
          guide: tripBooking?.trips?.guides || null,
          payments: payments || [],
          activityLog: activityLog || [],
        },
      });
    } catch (error) {
      logger.error('Error in GET /api/admin/bookings/[bookingId]', error, {
        bookingId,
        adminId: user.id,
      });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

export const PATCH = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ bookingId: string }> }
  ) => {
    const { bookingId } = await params;
    const supabase = await createAdminClient(); // Use admin client to bypass RLS

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization
    const allowed = await hasRole([
      'super_admin',
      'ops_admin',
      'finance_manager',
      'marketing',
    ]);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      const body = await request.json();
      const validated = updateBookingSchema.parse(body);

      const client = supabase as unknown as any;

      // Check if booking exists
      const { data: existingBooking, error: fetchError } = await client
        .from('bookings')
        .select('id, status')
        .eq('id', bookingId)
        .single();

      if (fetchError || !existingBooking) {
        logger.error('Booking not found', fetchError, {
          bookingId,
          adminId: user.id,
        });
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      // Validate status transitions
      if (validated.status && validated.status !== existingBooking.status) {
        // Prevent certain transitions
        const invalidTransitions: Record<string, string[]> = {
          completed: ['draft', 'pending_payment'],
          cancelled: ['completed', 'refunded'],
          refunded: ['draft', 'pending_payment', 'ongoing', 'completed'],
        };

        const invalidTargets = invalidTransitions[validated.status];
        if (invalidTargets?.includes(existingBooking.status)) {
          return NextResponse.json(
            {
              error: `Cannot change status from ${existingBooking.status} to ${validated.status}`,
            },
            { status: 400 }
          );
        }
      }

      // Build update data
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (validated.customer_name !== undefined) {
        updateData.customer_name = validated.customer_name;
      }
      if (validated.customer_phone !== undefined) {
        updateData.customer_phone = validated.customer_phone;
      }
      if (validated.customer_email !== undefined) {
        updateData.customer_email = validated.customer_email;
      }
      if (validated.adult_pax !== undefined) {
        updateData.adult_pax = validated.adult_pax;
      }
      if (validated.child_pax !== undefined) {
        updateData.child_pax = validated.child_pax;
      }
      if (validated.infant_pax !== undefined) {
        updateData.infant_pax = validated.infant_pax;
      }
      if (validated.special_requests !== undefined) {
        updateData.special_requests = validated.special_requests;
      }
      if (validated.status !== undefined) {
        updateData.status = validated.status;
      }

      // Update booking
      const { data: updatedBooking, error: updateError } = await client
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (updateError) {
        logger.error('Failed to update booking', updateError, {
          bookingId,
          adminId: user.id,
          updateData,
        });
        return NextResponse.json(
          { error: 'Failed to update booking' },
          { status: 500 }
        );
      }

      logger.info('Booking updated successfully', {
        bookingId,
        adminId: user.id,
        fields: Object.keys(updateData),
      });

      return NextResponse.json({
        success: true,
        booking: updatedBooking,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      logger.error('Error in PATCH /api/admin/bookings/[bookingId]', error, {
        bookingId,
        adminId: user.id,
      });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

