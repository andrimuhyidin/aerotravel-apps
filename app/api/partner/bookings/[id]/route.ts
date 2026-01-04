/**
 * API: Partner Booking Detail
 * GET /api/partner/bookings/[id] - Get booking detail
 * PUT /api/partner/bookings/[id] - Update booking (minor edits before confirmation)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type Params = Promise<{ id: string }>;

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: bookingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  try {
    const { data: booking, error } = await client
      .from('bookings')
      .select(`
        id,
        booking_code,
        booking_date,
        trip_date,
        adult_pax,
        child_pax,
        infant_pax,
        price_per_adult,
        price_per_child,
        subtotal,
        discount_amount,
        tax_amount,
        total_amount,
        nta_price_per_adult,
        nta_total,
        status,
        customer_id,
        customer_name,
        customer_phone,
        customer_email,
        special_requests,
        internal_notes,
        created_at,
        updated_at,
        package:packages(
          id,
          name,
          destination,
          duration_days,
          duration_nights
        )
      `)
      .eq('id', bookingId)
      .eq('mitra_id', partnerId)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get passenger details
    const { data: passengerData } = await client
      .from('booking_passengers')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    
    const passengers = passengerData || [];

    // Get reschedule requests if any
    const { data: rescheduleRequests } = await client
      .from('booking_reschedule_requests')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      booking,
      passengers,
      rescheduleRequests: rescheduleRequests || [],
    });
  } catch (error) {
    logger.error('Failed to fetch booking detail', error, {
      bookingId,
      userId: user.id,
    });
    throw error;
  }
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: bookingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const body = await request.json();
  
  // Sanitize input
  const sanitizedBody = sanitizeRequestBody(body, {
    strings: ['customerName', 'specialRequests'],
    emails: ['customerEmail'],
    phones: ['customerPhone'],
  });
  
  const {
    customerName,
    customerPhone,
    customerEmail,
    specialRequests,
    passengers, // Array of passenger details for update
  } = sanitizedBody;

  const client = supabase as unknown as any;

  try {
    // Check if booking exists and belongs to partner
    const { data: existingBooking } = await client
      .from('bookings')
      .select('id, status')
      .eq('id', bookingId)
      .eq('mitra_id', partnerId)
      .single();

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Only allow edits if booking is not confirmed/completed
    if (['confirmed', 'ongoing', 'completed'].includes(existingBooking.status)) {
      return NextResponse.json(
        { error: 'Cannot edit confirmed or completed bookings' },
        { status: 400 }
      );
    }

    // Update booking (minor edits only)
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (customerName !== undefined) updateData.customer_name = customerName;
    if (customerPhone !== undefined) updateData.customer_phone = customerPhone;
    if (customerEmail !== undefined) updateData.customer_email = customerEmail || null;
    if (specialRequests !== undefined) updateData.special_requests = specialRequests || null;

    const { data: booking, error } = await client
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update booking', error, {
        bookingId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to update booking', details: error.message },
        { status: 500 }
      );
    }

    // Emit booking.updated event (non-blocking)
    try {
      const { emitEvent } = await import('@/lib/events/event-bus');
      await emitEvent(
        {
          type: 'booking.updated',
          app: 'partner',
          userId: user.id,
          data: {
            bookingId: bookingId,
            bookingCode: booking?.booking_code,
            updatedFields: Object.keys(updateData),
            packageId: booking?.package_id,
          },
        },
        {
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        }
      ).catch((eventError) => {
        logger.warn('Failed to emit booking.updated event', eventError);
      });
    } catch (eventError) {
      logger.warn('Event emission error (non-critical)', {
        error: eventError instanceof Error ? eventError.message : String(eventError),
      });
    }

    // Update passenger details if provided
    if (passengers !== undefined && booking) {
      try {
        // Get existing booking to determine passenger types
        const { data: bookingData } = await client
          .from('bookings')
          .select('adult_pax, child_pax, infant_pax')
          .eq('id', bookingId)
          .single();

        if (bookingData) {
          // Delete existing passengers
          await client
            .from('booking_passengers')
            .delete()
            .eq('booking_id', bookingId);

          // Insert updated passengers if provided
          if (Array.isArray(passengers) && passengers.length > 0) {
            const determinePassengerType = (index: number): 'adult' | 'child' | 'infant' => {
              const adultPax = bookingData.adult_pax || 0;
              const childPax = bookingData.child_pax || 0;
              if (index < adultPax) return 'adult';
              if (index < adultPax + childPax) return 'child';
              return 'infant';
            };

            const passengerRecords = passengers
              .filter((p: { fullName?: string }) => p && p.fullName && p.fullName.trim() !== '')
              .map((p: {
                fullName: string;
                dateOfBirth?: string | Date | null;
                dietaryRequirements?: string;
                healthConditions?: string;
                emergencyName?: string;
                emergencyPhone?: string;
              }, index: number) => ({
                booking_id: bookingId,
                full_name: p.fullName.trim(),
                passenger_type: determinePassengerType(index),
                date_of_birth: p.dateOfBirth
                  ? (typeof p.dateOfBirth === 'string' 
                      ? p.dateOfBirth 
                      : new Date(p.dateOfBirth).toISOString().split('T')[0])
                  : null,
                dietary_requirements: p.dietaryRequirements?.trim() || null,
                health_conditions: p.healthConditions?.trim() || null,
                emergency_name: p.emergencyName?.trim() || null,
                emergency_phone: p.emergencyPhone?.trim() || null,
              }));

            if (passengerRecords.length > 0) {
              const { error: passengerError } = await client
                .from('booking_passengers')
                .insert(passengerRecords);

          if (passengerError) {
            logger.warn('Failed to update passenger details', { 
              bookingId,
              error: passengerError instanceof Error ? passengerError.message : String(passengerError)
            });
            // Don't fail booking update if passenger update fails
          } else {
            logger.info('Passenger details updated', { bookingId, count: passengerRecords.length });
          }
            }
          }
        }
      } catch (passengerError) {
        logger.warn('Error updating passenger details', { 
          bookingId,
          error: passengerError instanceof Error ? passengerError.message : String(passengerError)
        });
        // Don't fail booking update if passenger update fails
      }
    }

    logger.info('Booking updated', {
      bookingId,
      userId: user.id,
    });

    return NextResponse.json({ booking });
  } catch (error) {
    logger.error('Failed to update booking', error, {
      bookingId,
      userId: user.id,
    });
    throw error;
  }
});

