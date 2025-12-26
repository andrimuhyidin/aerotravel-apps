/**
 * API: Generate Itinerary PDF
 * GET /api/partner/bookings/[id]/documents/itinerary
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { generateItineraryPDF } from '@/lib/pdf/itinerary';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

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

  const { searchParams } = new URL(request.url);
  const language = (searchParams.get('language') || 'id') as 'id' | 'en';

  const client = supabase as unknown as any;

  try {
    // Get booking with package details
    const { data: booking, error: bookingError } = await client
      .from('bookings')
      .select(`
        id,
        booking_code,
        trip_date,
        package:packages(
          id,
          name,
          destination,
          duration_days,
          duration_nights,
          inclusions,
          exclusions
        ),
        mitra:users!bookings_mitra_id_fkey(
          id,
          full_name,
          company_name,
          partner_whitelabel_settings(
            company_name
          )
        )
      `)
      .eq('id', bookingId)
      .eq('mitra_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get whitelabel settings
    const whitelabel = booking.mitra?.partner_whitelabel_settings?.[0];
    const companyName = whitelabel?.company_name || booking.mitra?.company_name || booking.mitra?.full_name || 'Partner';

    // Generate basic itinerary (can be enhanced with actual itinerary data from trips table)
    const itineraryData = {
      bookingCode: booking.booking_code,
      packageName: booking.package?.name || 'Paket Wisata',
      destination: booking.package?.destination || '',
      tripDate: booking.trip_date,
      durationDays: booking.package?.duration_days || 0,
      durationNights: booking.package?.duration_nights || 0,
      companyName,
      itinerary: Array.from({ length: booking.package?.duration_days || 1 }, (_, i) => ({
        day: i + 1,
        date: new Date(new Date(booking.trip_date).getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID'),
        activities: [
          {
            time: '08:00',
            activity: 'Check-in / Meeting Point',
            location: 'TBA',
          },
          {
            time: '09:00',
            activity: 'Aktivitas Wisata',
            location: 'TBA',
          },
        ],
      })),
      inclusions: booking.package?.inclusions || [],
      exclusions: booking.package?.exclusions || [],
      language,
    };

    const pdfBuffer = await generateItineraryPDF(itineraryData);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="itinerary-${booking.booking_code}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Failed to generate itinerary PDF', error, {
      bookingId,
      userId: user.id,
    });
    throw error;
  }
});

