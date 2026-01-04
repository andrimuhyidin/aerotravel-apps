/**
 * API: Generate Confirmation Letter PDF
 * GET /api/partner/bookings/[id]/documents/confirmation
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { generateConfirmationLetterPDF } from '@/lib/pdf/confirmation-letter';
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

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const searchParams = sanitizeSearchParams(request);
  const language = (searchParams.get('language') || 'id') as 'id' | 'en';

  const client = supabase as unknown as any;

  try {
    // Get booking with package and whitelabel settings
    const { data: booking, error: bookingError } = await client
      .from('bookings')
      .select(`
        id,
        booking_code,
        trip_date,
        adult_pax,
        child_pax,
        infant_pax,
        total_amount,
        customer_name,
        customer_phone,
        customer_email,
        created_at,
        package:packages(
          id,
          name,
          destination
        ),
        mitra:users!bookings_mitra_id_fkey(
          id,
          full_name,
          company_name,
          partner_whitelabel_settings(
            company_name,
            company_address,
            company_phone,
            company_email
          )
        )
      `)
      .eq('id', bookingId)
      .eq('mitra_id', partnerId)
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
    const companyAddress = whitelabel?.company_address || '';

    // Generate confirmation letter PDF
    const confirmationData = {
      companyName,
      companyAddress,
      customerName: booking.customer_name,
      customerAddress: undefined,
      bookingCode: booking.booking_code,
      packageName: booking.package?.name || 'Paket Wisata',
      destination: booking.package?.destination || '',
      tripDate: booking.trip_date,
      adultPax: booking.adult_pax,
      childPax: booking.child_pax,
      infantPax: booking.infant_pax,
      totalAmount: Number(booking.total_amount),
      confirmationDate: new Date(booking.created_at).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      language,
    };

    const pdfBuffer = await generateConfirmationLetterPDF(confirmationData);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="confirmation-${booking.booking_code}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Failed to generate confirmation letter PDF', error, {
      bookingId,
      userId: user.id,
    });
    throw error;
  }
});

