/**
 * API: Create Draft Booking from Parsed Inbox Data
 * POST /api/partner/inbox/[threadId]/create-draft
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createDraftSchema = z.object({
  parsedData: z.any(), // ParsedBookingInquiry
  packageId: z.string().uuid().optional(),
  overrideData: z.record(z.any()).optional(),
});

type Params = Promise<{ threadId: string }>;

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const supabase = await createClient();
  const { threadId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { parsedData, packageId, overrideData } = createDraftSchema.parse(body);

  const client = supabase as unknown as any;

  try {
    // Get partner ID
    const { data: userProfile } = await client
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    let partnerId = user.id;
    if (userProfile.role !== 'mitra') {
      const { data: partnerUser } = await client
        .from('partner_users')
        .select('partner_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .eq('is_active', true)
        .maybeSingle();

      if (partnerUser) {
        partnerId = partnerUser.partner_id;
      } else {
        return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
      }
    }

    // Merge parsed data with overrides
    const finalData = { ...parsedData, ...overrideData };

    // Determine trip date
    let tripDate = finalData.dateRange?.start;
    if (!tripDate) {
      // Default to 30 days from now if no date specified
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      tripDate = defaultDate.toISOString().split('T')[0];
    }

    // Determine pax count
    const adultPax = finalData.paxCount?.adults || 2;
    const childPax = finalData.paxCount?.children || 0;
    const infantPax = finalData.paxCount?.infants || 0;

    // If packageId not provided, try to find matching package
    let selectedPackageId = packageId;
    if (!selectedPackageId && finalData.destination) {
      const { data: matchingPackage } = await client
        .from('packages')
        .select('id')
        .ilike('destination', `%${finalData.destination}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (matchingPackage) {
        selectedPackageId = matchingPackage.id;
      }
    }

    if (!selectedPackageId) {
      return NextResponse.json(
        { error: 'Package ID required. Please select a package first.' },
        { status: 400 }
      );
    }

    // Get package pricing
    const { data: packageData } = await client
      .from('packages')
      .select(`
        id,
        branch_id,
        prices:package_prices(
          min_pax,
          max_pax,
          price_nta
        )
      `)
      .eq('id', selectedPackageId)
      .single();

    if (!packageData) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Find matching price tier
    const totalPax = adultPax + childPax;
    const matchingPrice = (packageData.prices as Array<{
      min_pax: number;
      max_pax: number;
      price_nta: number;
    }>)?.find(
      (p) => totalPax >= p.min_pax && totalPax <= p.max_pax
    );

    if (!matchingPrice) {
      return NextResponse.json(
        { error: 'No matching price tier for this pax count' },
        { status: 400 }
      );
    }

    // Generate booking code
    const bookingCode = `BK-${Date.now()}`;

    // Create draft booking
    const { data: booking, error: bookingError } = await client
      .from('bookings')
      .insert({
        branch_id: packageData.branch_id,
        package_id: selectedPackageId,
        booking_code: bookingCode,
        trip_date: tripDate,
        source: 'mitra',
        mitra_id: partnerId,
        adult_pax: adultPax,
        child_pax: childPax,
        infant_pax: infantPax,
        status: 'draft',
        draft_saved_at: new Date().toISOString(),
        customer_name: finalData.customerName || 'Customer dari Inbox',
        special_requests: finalData.specialRequests?.join('\n') || null,
        nta_price_per_adult: matchingPrice.price_nta,
        nta_total: matchingPrice.price_nta * totalPax,
      })
      .select('id, booking_code')
      .single();

    if (bookingError || !booking) {
      logger.error('Failed to create draft booking', bookingError);
      return NextResponse.json(
        { error: 'Failed to create draft booking' },
        { status: 500 }
      );
    }

    // Link draft booking to thread
    await client
      .from('inbox_threads')
      .update({
        draft_booking_id: booking.id,
      })
      .eq('id', threadId);

    // Also update message if exists
    const { data: threadMessages } = await client
      .from('inbox_messages')
      .select('id')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (threadMessages && threadMessages.length > 0) {
      await client
        .from('inbox_messages')
        .update({
          draft_booking_id: booking.id,
        })
        .eq('id', threadMessages[0]!.id);
    }

    logger.info('Draft booking created from inbox', {
      userId: user.id,
      threadId,
      bookingId: booking.id,
      bookingCode: booking.booking_code,
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      message: 'Draft booking berhasil dibuat',
    });
  } catch (error) {
    logger.error('Failed to create draft booking from inbox', error, {
      userId: user.id,
      threadId,
    });
    throw error;
  }
});

