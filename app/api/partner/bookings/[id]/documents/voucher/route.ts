/**
 * API: Generate Voucher PDF
 * GET /api/partner/bookings/[id]/documents/voucher
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { generateVoucherPDF } from '@/lib/pdf/voucher';
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
        adult_pax,
        child_pax,
        infant_pax,
        total_amount,
        customer_name,
        customer_phone,
        customer_email,
        special_requests,
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
            company_logo_url,
            company_address,
            company_phone,
            company_email,
            invoice_footer
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

    // Generate voucher PDF
    const voucherData = {
      voucherNumber: `VCH-${booking.booking_code}`,
      bookingCode: booking.booking_code,
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      customerName: booking.customer_name,
      customerPhone: booking.customer_phone || undefined,
      customerEmail: booking.customer_email || undefined,
      packageName: booking.package?.name || 'Paket Wisata',
      destination: booking.package?.destination || '',
      tripDate: booking.trip_date,
      adultPax: booking.adult_pax,
      childPax: booking.child_pax,
      infantPax: booking.infant_pax,
      totalAmount: Number(booking.total_amount),
      specialInstructions: booking.special_requests || undefined,
      footerText: whitelabel?.invoice_footer || undefined,
      language,
    };

    const pdfBuffer = await generateVoucherPDF(voucherData);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="voucher-${booking.booking_code}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Failed to generate voucher PDF', error, {
      bookingId,
      userId: user.id,
    });
    throw error;
  }
});

