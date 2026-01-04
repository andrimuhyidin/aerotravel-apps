/**
 * API: Admin - Transfer Booking
 * POST /api/admin/bookings/[bookingId]/transfer - Transfer booking to new customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const transferBookingSchema = z.object({
  newCustomerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  newCustomerEmail: z.string().email('Invalid email address'),
  newCustomerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  notifyOldCustomer: z.boolean().default(true),
  notifyNewCustomer: z.boolean().default(true),
});

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { bookingId } = await context.params;

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = transferBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { 
    newCustomerName, 
    newCustomerEmail, 
    newCustomerPhone, 
    reason,
    // notifyOldCustomer, // TODO: implement notifications
    // notifyNewCustomer, // TODO: implement notifications
  } = parsed.data;
  
  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  try {
    // Get current booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_code,
        customer_name,
        customer_email,
        customer_phone,
        status,
        trip_date
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking can be transferred
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return NextResponse.json(
        { error: `Cannot transfer ${booking.status} booking` },
        { status: 400 }
      );
    }

    // Store old customer info
    const oldCustomer = {
      name: booking.customer_name,
      email: booking.customer_email,
      phone: booking.customer_phone,
    };

    // Update booking with new customer
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        customer_name: newCustomerName,
        customer_email: newCustomerEmail,
        customer_phone: newCustomerPhone,
        updated_at: now,
      })
      .eq('id', bookingId);

    if (updateError) {
      logger.error('Failed to transfer booking', updateError);
      return NextResponse.json(
        { error: 'Failed to transfer booking' },
        { status: 500 }
      );
    }

    // Log the modification
    await supabase.from('booking_modifications').insert({
      booking_id: bookingId,
      modified_by: user.id,
      modification_type: 'customer_transfer',
      old_value: oldCustomer,
      new_value: {
        name: newCustomerName,
        email: newCustomerEmail,
        phone: newCustomerPhone,
      },
      reason,
    });

    // TODO: Send notifications
    // if (notifyOldCustomer) {
    //   await sendTransferNotification(oldCustomer, 'old', booking);
    // }
    // if (notifyNewCustomer) {
    //   await sendTransferNotification({ name: newCustomerName, email: newCustomerEmail }, 'new', booking);
    // }

    logger.info('Booking transferred', {
      bookingId,
      bookingCode: booking.booking_code,
      fromCustomer: oldCustomer.email,
      toCustomer: newCustomerEmail,
      transferredBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Booking berhasil ditransfer ke customer baru',
      booking: {
        id: bookingId,
        booking_code: booking.booking_code,
        oldCustomer,
        newCustomer: {
          name: newCustomerName,
          email: newCustomerEmail,
          phone: newCustomerPhone,
        },
      },
    });
  } catch (error) {
    logger.error('Unexpected error in transfer booking', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

