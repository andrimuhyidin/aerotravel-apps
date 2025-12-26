/**
 * API: Generate Terms and Conditions PDF
 * GET /api/partner/bookings/[id]/documents/terms
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { generateTermsAndConditionsPDF } from '@/lib/pdf/terms-and-conditions';
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
    // Get booking with package and whitelabel settings
    const { data: booking, error: bookingError } = await client
      .from('bookings')
      .select(`
        id,
        booking_code,
        trip_date,
        total_amount,
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
            company_email,
            invoice_footer,
            custom_terms
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
    const companyAddress = whitelabel?.company_address || '';
    const companyPhone = whitelabel?.company_phone || '';
    const companyEmail = whitelabel?.company_email || '';

    // Generate T&C PDF
    const termsData = {
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      bookingCode: booking.booking_code,
      packageName: booking.package?.name || 'Paket Wisata',
      destination: booking.package?.destination || '',
      tripDate: booking.trip_date,
      totalAmount: Number(booking.total_amount),
      footerText: whitelabel?.invoice_footer || undefined,
      customTerms: whitelabel?.custom_terms || undefined,
      language,
    };

    const pdfBuffer = await generateTermsAndConditionsPDF(termsData);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="terms-conditions-${booking.booking_code}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Failed to generate terms and conditions PDF', error, {
      bookingId,
      userId: user.id,
    });
    throw error;
  }
});

