/**
 * User Trip Voucher Document API
 * GET /api/user/trips/[id]/documents/voucher - Generate booking voucher PDF
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (_request: NextRequest, context: RouteParams) => {
  const { id } = await context.params;
  
  logger.info('GET /api/user/trips/[id]/documents/voucher', { id });

  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      code,
      trip_date,
      adult_pax,
      child_pax,
      infant_pax,
      total_amount,
      status,
      customer_name,
      customer_phone,
      customer_email,
      paid_at,
      packages (
        id,
        name,
        destination,
        duration_days,
        duration_nights
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !booking) {
    logger.warn('Booking not found for voucher', { id, userId: user.id });
    return NextResponse.json(
      { error: 'Booking not found' },
      { status: 404 }
    );
  }

  // Check if booking is paid
  if (!['paid', 'confirmed', 'completed'].includes(booking.status)) {
    return NextResponse.json(
      { error: 'Voucher only available for paid bookings' },
      { status: 400 }
    );
  }

  // Generate simple HTML voucher (in production, use proper PDF generation)
  const pkg = booking.packages as { name: string; destination: string } | null;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>E-Voucher ${booking.code}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .voucher-code { font-size: 28px; font-weight: bold; margin: 20px 0; padding: 15px; background: #f3f4f6; text-align: center; border-radius: 8px; }
        .section { margin: 20px 0; }
        .section-title { font-weight: bold; color: #374151; margin-bottom: 10px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .info-label { color: #6b7280; }
        .info-value { font-weight: 500; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
        .status { display: inline-block; padding: 5px 15px; background: #10b981; color: white; border-radius: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🏝️ AERO TRAVEL</div>
        <p>E-Voucher Trip</p>
      </div>
      
      <div class="voucher-code">${booking.code}</div>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <span class="status">✓ ${booking.status.toUpperCase()}</span>
      </div>
      
      <div class="section">
        <div class="section-title">Detail Paket</div>
        <div class="info-row">
          <span class="info-label">Paket</span>
          <span class="info-value">${pkg?.name || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Destinasi</span>
          <span class="info-value">${pkg?.destination || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal</span>
          <span class="info-value">${booking.trip_date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Peserta</span>
          <span class="info-value">${(booking.adult_pax || 0) + (booking.child_pax || 0) + (booking.infant_pax || 0)} orang</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Data Pemesan</div>
        <div class="info-row">
          <span class="info-label">Nama</span>
          <span class="info-value">${booking.customer_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Telepon</span>
          <span class="info-value">${booking.customer_phone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${booking.customer_email}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Pembayaran</div>
        <div class="info-row">
          <span class="info-label">Total</span>
          <span class="info-value" style="font-size: 18px; color: #2563eb;">Rp ${booking.total_amount.toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      <div class="footer">
        <p>Tunjukkan voucher ini kepada guide saat keberangkatan</p>
        <p>© 2024 Aero Travel. All rights reserved.</p>
        <p>Contact: 085157787800 | aerotravel.co.id</p>
      </div>
    </body>
    </html>
  `;

  // Return as HTML (in production, convert to PDF using puppeteer or similar)
  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="voucher-${booking.code}.html"`,
    },
  });
});

