/**
 * User Trip Itinerary Document API
 * GET /api/user/trips/[id]/documents/itinerary - Generate itinerary PDF
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
  
  logger.info('GET /api/user/trips/[id]/documents/itinerary', { id });

  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get booking with full package details
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      code,
      trip_date,
      adult_pax,
      child_pax,
      infant_pax,
      status,
      customer_name,
      packages (
        id,
        name,
        destination,
        duration_days,
        duration_nights,
        itinerary,
        inclusions,
        exclusions,
        meeting_points,
        important_notes
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !booking) {
    logger.warn('Booking not found for itinerary', { id, userId: user.id });
    return NextResponse.json(
      { error: 'Booking not found' },
      { status: 404 }
    );
  }

  // Check if booking is paid
  if (!['paid', 'confirmed', 'completed'].includes(booking.status)) {
    return NextResponse.json(
      { error: 'Itinerary only available for paid bookings' },
      { status: 400 }
    );
  }

  const pkg = booking.packages as {
    name: string;
    destination: string;
    duration_days: number;
    duration_nights: number;
    itinerary: { day: number; title: string; activities: string[] }[];
    inclusions: string[];
    exclusions: string[];
    meeting_points: { name: string; address: string; time: string }[];
    important_notes: string[];
  } | null;

  // Generate itinerary HTML
  const itineraryHtml = (pkg?.itinerary || []).map((day) => `
    <div class="day-section">
      <div class="day-header">Hari ${day.day}: ${day.title}</div>
      <ul class="activities">
        ${(day.activities || []).map((a) => `<li>${a}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  const inclusionsHtml = (pkg?.inclusions || []).map((i) => `<li>✓ ${i}</li>`).join('');
  const exclusionsHtml = (pkg?.exclusions || []).map((e) => `<li>✗ ${e}</li>`).join('');
  
  const meetingPointsHtml = (pkg?.meeting_points || []).map((mp) => `
    <div class="meeting-point">
      <strong>${mp.name}</strong><br>
      <span class="address">${mp.address}</span><br>
      <span class="time">⏰ ${mp.time}</span>
    </div>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Itinerary ${booking.code}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .title { font-size: 20px; margin: 15px 0; }
        .meta { color: #6b7280; font-size: 14px; }
        .section { margin: 25px 0; }
        .section-title { font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; }
        .day-section { margin: 15px 0; padding: 15px; background: #f9fafb; border-radius: 8px; }
        .day-header { font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        .activities { margin: 0; padding-left: 20px; }
        .activities li { margin: 5px 0; }
        .two-columns { display: flex; gap: 30px; }
        .column { flex: 1; }
        .column ul { padding-left: 5px; list-style: none; }
        .column li { margin: 5px 0; }
        .include { color: #059669; }
        .exclude { color: #dc2626; }
        .meeting-point { padding: 10px; background: #fef3c7; border-radius: 8px; margin: 10px 0; }
        .meeting-point .address { color: #6b7280; font-size: 13px; }
        .meeting-point .time { color: #d97706; font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        .important { background: #fee2e2; padding: 15px; border-radius: 8px; margin-top: 20px; }
        .important-title { color: #dc2626; font-weight: bold; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🏝️ AERO TRAVEL</div>
        <div class="title">${pkg?.name || 'Paket Wisata'}</div>
        <div class="meta">
          ${pkg?.destination || '-'} | ${pkg?.duration_days || 0}D${pkg?.duration_nights || 0}N<br>
          Booking: ${booking.code} | Tanggal: ${booking.trip_date}<br>
          Peserta: ${booking.customer_name} + ${(booking.adult_pax || 0) + (booking.child_pax || 0) + (booking.infant_pax || 0) - 1} orang
        </div>
      </div>
      
      ${meetingPointsHtml ? `
        <div class="section">
          <div class="section-title">📍 Titik Berkumpul</div>
          ${meetingPointsHtml}
        </div>
      ` : ''}
      
      <div class="section">
        <div class="section-title">📅 Jadwal Perjalanan</div>
        ${itineraryHtml || '<p>Detail itinerary akan diinformasikan oleh guide.</p>'}
      </div>
      
      <div class="section">
        <div class="section-title">📋 Yang Termasuk & Tidak Termasuk</div>
        <div class="two-columns">
          <div class="column">
            <strong class="include">Termasuk:</strong>
            <ul class="include">${inclusionsHtml || '<li>Lihat detail di aplikasi</li>'}</ul>
          </div>
          <div class="column">
            <strong class="exclude">Tidak Termasuk:</strong>
            <ul class="exclude">${exclusionsHtml || '<li>Pengeluaran pribadi</li>'}</ul>
          </div>
        </div>
      </div>
      
      <div class="important">
        <div class="important-title">⚠️ Catatan Penting</div>
        <ul>
          <li>Hadir di titik berkumpul 15 menit sebelum waktu yang ditentukan</li>
          <li>Bawa kartu identitas (KTP/SIM/Passport)</li>
          <li>Gunakan pakaian dan alas kaki yang nyaman</li>
          <li>Jangan lupa bawa obat-obatan pribadi jika diperlukan</li>
          <li>Informasi cuaca dan update jadwal akan dikirim via WhatsApp H-1</li>
        </ul>
      </div>
      
      <div class="footer">
        <p>Untuk pertanyaan, hubungi: 085157787800</p>
        <p>© 2024 Aero Travel. Have a great trip! 🌴</p>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="itinerary-${booking.code}.html"`,
    },
  });
});

