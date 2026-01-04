/**
 * API: Merge Bookings
 * POST /api/partner/bookings/merge
 * Merge multiple bookings into one
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { validateBookingMerge, mergeBookings } from '@/lib/partner/trip-merger';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const mergeSchema = z.object({
  bookingIds: z.array(z.string().uuid()).min(2),
  mergeInto: z.string().uuid(), // ID of booking to merge into
});

export const POST = withErrorHandler(async (request: NextRequest) => {
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
  const { bookingIds, mergeInto } = mergeSchema.parse(body);

  try {
    // Validate merge
    const validation = await validateBookingMerge(bookingIds, partnerId);
    if (!validation.canMerge) {
      return NextResponse.json(
        { error: validation.reason || 'Tidak bisa merge bookings' },
        { status: 400 }
      );
    }

    // Ensure mergeInto is in bookingIds
    if (!bookingIds.includes(mergeInto)) {
      return NextResponse.json(
        { error: 'Booking target merge harus ada dalam list bookingIds' },
        { status: 400 }
      );
    }

    // Perform merge
    const result = await mergeBookings(bookingIds, mergeInto, partnerId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    logger.info('Bookings merged successfully', {
      userId: user.id,
      mergeInto,
      bookingIds,
    });

    return NextResponse.json({
      success: true,
      mergedBookingId: result.mergedBookingId,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to merge bookings', error, {
      userId: user.id,
      bookingIds,
    });
    throw error;
  }
});

/**
 * GET /api/partner/bookings/merge?bookingIds=id1,id2,id3
 * Validate if bookings can be merged
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
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

  // Sanitize search params
  const searchParams = sanitizeSearchParams(request);
  const bookingIdsParam = searchParams.get('bookingIds');

  if (!bookingIdsParam) {
    return NextResponse.json(
      { error: 'bookingIds parameter required' },
      { status: 400 }
    );
  }

  const bookingIds = bookingIdsParam.split(',').filter(Boolean);

  if (bookingIds.length < 2) {
    return NextResponse.json(
      { error: 'Minimal 2 bookings untuk merge' },
      { status: 400 }
    );
  }

  try {
    const validation = await validateBookingMerge(bookingIds, partnerId);

    return NextResponse.json({
      canMerge: validation.canMerge,
      reason: validation.reason,
      bookings: validation.bookings,
    });
  } catch (error) {
    logger.error('Failed to validate booking merge', error, {
      userId: user.id,
      bookingIds,
    });
    throw error;
  }
});

