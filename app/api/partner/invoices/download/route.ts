/**
 * API: Download Whitelabel Invoice
 * POST /api/partner/invoices/download
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const body = await request.json();

  const { bookingId, mitraId } = body;

  if (!bookingId || !mitraId) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Get booking data
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_code,
      trip_date,
      adult_pax,
      child_pax,
      infant_pax,
      total_amount,
      status,
      customer_name,
      package:packages(name)
    `)
    .eq('id', bookingId)
    .eq('mitra_id', mitraId)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: 'Booking not found' },
      { status: 404 }
    );
  }

  // Get mitra profile
  const { data: mitra } = await supabase
    .from('users')
    .select('id, full_name, phone')
    .eq('id', mitraId)
    .single();

  // TODO: Generate PDF with @react-pdf/renderer
  // For now, return mock PDF

  logger.info('Whitelabel invoice downloaded', {
    bookingId,
    mitraId,
    bookingCode: booking.booking_code,
  });

  // Return PDF blob
  const pdfContent = `
    INVOICE
    ========
    Invoice No: INV-${booking.booking_code}
    
    From: ${mitra?.full_name || 'Mitra'}
    To: ${booking.customer_name}
    
    Package: ${booking.package?.name}
    Trip Date: ${booking.trip_date}
    Pax: ${booking.adult_pax + booking.child_pax + booking.infant_pax}
    
    Total: Rp ${Number(booking.total_amount).toLocaleString('id-ID')}
    
    Status: ${booking.status}
  `;

  return new NextResponse(pdfContent, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${booking.booking_code}.pdf"`,
    },
  });
});
