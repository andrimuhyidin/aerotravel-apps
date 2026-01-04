/**
 * API: Admin - Modify Booking
 * POST /api/admin/bookings/[bookingId]/modify - Modify booking details
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const modifyBookingSchema = z.object({
  modificationType: z.enum(['date_change', 'pax_change', 'package_change', 'price_adjustment']),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  
  // Date change
  newTripDate: z.string().optional(),
  
  // Pax change
  adultPax: z.number().int().min(0).optional(),
  childPax: z.number().int().min(0).optional(),
  infantPax: z.number().int().min(0).optional(),
  
  // Package change
  newPackageId: z.string().uuid().optional(),
  
  // Price adjustment
  newTotalAmount: z.number().min(0).optional(),
  priceAdjustmentReason: z.string().optional(),
});

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
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
  const parsed = modifyBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { modificationType, reason, ...modificationData } = parsed.data;
  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  try {
    // Get current booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking can be modified
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return NextResponse.json(
        { error: `Cannot modify ${booking.status} booking` },
        { status: 400 }
      );
    }

    // Prepare update data based on modification type
    const updateData: Record<string, unknown> = {
      updated_at: now,
    };
    const oldValue: Record<string, unknown> = {};
    const newValue: Record<string, unknown> = {};

    switch (modificationType) {
      case 'date_change':
        if (!modificationData.newTripDate) {
          return NextResponse.json(
            { error: 'New trip date is required' },
            { status: 400 }
          );
        }
        oldValue.trip_date = booking.trip_date;
        newValue.trip_date = modificationData.newTripDate;
        updateData.trip_date = modificationData.newTripDate;
        break;

      case 'pax_change':
        oldValue.adult_pax = booking.adult_pax;
        oldValue.child_pax = booking.child_pax;
        oldValue.infant_pax = booking.infant_pax;
        
        if (modificationData.adultPax !== undefined) {
          newValue.adult_pax = modificationData.adultPax;
          updateData.adult_pax = modificationData.adultPax;
        }
        if (modificationData.childPax !== undefined) {
          newValue.child_pax = modificationData.childPax;
          updateData.child_pax = modificationData.childPax;
        }
        if (modificationData.infantPax !== undefined) {
          newValue.infant_pax = modificationData.infantPax;
          updateData.infant_pax = modificationData.infantPax;
        }
        break;

      case 'package_change':
        if (!modificationData.newPackageId) {
          return NextResponse.json(
            { error: 'New package ID is required' },
            { status: 400 }
          );
        }
        
        // Verify package exists
        const { data: newPackage, error: packageError } = await supabase
          .from('packages')
          .select('id, name')
          .eq('id', modificationData.newPackageId)
          .single();

        if (packageError || !newPackage) {
          return NextResponse.json(
            { error: 'Package not found' },
            { status: 404 }
          );
        }

        oldValue.package_id = booking.package_id;
        newValue.package_id = modificationData.newPackageId;
        newValue.package_name = newPackage.name;
        updateData.package_id = modificationData.newPackageId;
        break;

      case 'price_adjustment':
        if (modificationData.newTotalAmount === undefined) {
          return NextResponse.json(
            { error: 'New total amount is required' },
            { status: 400 }
          );
        }
        
        // Only finance_manager or super_admin can adjust price
        const canAdjustPrice = await hasRole(['super_admin', 'finance_manager']);
        if (!canAdjustPrice) {
          return NextResponse.json(
            { error: 'Only finance manager can adjust prices' },
            { status: 403 }
          );
        }

        oldValue.total_amount = booking.total_amount;
        newValue.total_amount = modificationData.newTotalAmount;
        newValue.adjustment_reason = modificationData.priceAdjustmentReason;
        updateData.total_amount = modificationData.newTotalAmount;
        break;
    }

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (updateError) {
      logger.error('Failed to modify booking', updateError);
      return NextResponse.json(
        { error: 'Failed to modify booking' },
        { status: 500 }
      );
    }

    // Log the modification
    await supabase.from('booking_modifications').insert({
      booking_id: bookingId,
      modified_by: user.id,
      modification_type: modificationType,
      old_value: oldValue as unknown as null,
      new_value: newValue as unknown as null,
      reason,
    });

    // TODO: Send notification to customer if date/package changed
    // await sendModificationNotification(booking, modificationType, newValue);

    logger.info('Booking modified', {
      bookingId,
      bookingCode: booking.booking_code,
      modificationType,
      modifiedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Booking berhasil dimodifikasi (${modificationType})`,
      booking: {
        id: bookingId,
        booking_code: booking.booking_code,
        modifications: {
          type: modificationType,
          oldValue,
          newValue,
        },
      },
    });
  } catch (error) {
    logger.error('Unexpected error in modify booking', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

