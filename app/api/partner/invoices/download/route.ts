/**
 * API: Download Whitelabel Invoice
 * POST /api/partner/invoices/download
 * 
 * Generate whitelabel invoice PDF with partner branding
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { NextRequest, NextResponse } from 'next/server';
import React from 'react';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import type { InvoiceData } from '@/lib/pdf/invoice';
import { InvoicePDF } from '@/lib/pdf/invoice';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { bookingId } = body;

  if (!bookingId) {
    return NextResponse.json(
      { error: 'Booking ID required' },
      { status: 400 }
    );
  }

  const client = supabase as unknown as any;

  // Get booking data
  const { data: booking, error: bookingError } = (await client
    .from('bookings')
    .select(`
      id,
      booking_code,
      trip_date,
      adult_pax,
      child_pax,
      infant_pax,
      total_amount,
      nta_total,
      price_per_adult,
      price_per_child,
      status,
      customer_name,
      customer_phone,
      customer_email,
      created_at,
      package:packages(name, destination)
    `)
    .eq('id', bookingId)
    .eq('mitra_id', user.id)
    .single()) as {
    data: {
      id: string;
      booking_code: string;
      trip_date: string;
      adult_pax: number;
      child_pax: number;
      infant_pax: number;
      total_amount: number;
      nta_total: number | null;
      price_per_adult: number;
      price_per_child: number;
      status: string;
      customer_name: string | null;
      customer_phone: string | null;
      customer_email: string | null;
      created_at: string;
      package: { name: string | null; destination: string | null } | null;
    } | null;
    error: Error | null;
  };

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: 'Booking not found' },
      { status: 404 }
    );
  }

  // Get partner whitelabel settings (if exists)
  const { data: whitelabelSettings } = await client
    .from('partner_whitelabel_settings')
    .select('*')
    .eq('partner_id', user.id)
    .maybeSingle();

  // Get partner profile for fallback
  const { data: partnerProfile } = await client
    .from('users')
    .select('full_name, email, phone')
    .eq('id', user.id)
    .single();

  // Determine company info (from whitelabel or fallback)
  const companyName =
    whitelabelSettings?.company_name ||
    partnerProfile?.full_name ||
    'Partner';
  const companyAddress = whitelabelSettings?.company_address || '';
  const companyPhone =
    whitelabelSettings?.company_phone || partnerProfile?.phone || '';
  const companyEmail =
    whitelabelSettings?.company_email || partnerProfile?.email || '';
  const companyLogo = whitelabelSettings?.company_logo_url || undefined;

  // Calculate invoice number
  const invoiceNumber = `INV-${booking.booking_code}`;
  const invoiceDate = new Date(booking.created_at).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Prepare invoice items
  const totalPax = booking.adult_pax + booking.child_pax + booking.infant_pax;
  const packageName =
    booking.package?.name || 'Paket Wisata';
  const destination = booking.package?.destination || '';

  // Use NTA total for partner invoice (not publish price)
  const invoiceTotal = booking.nta_total || booking.total_amount;

  const invoiceItems = [
    {
      description: `${packageName}${destination ? ` - ${destination}` : ''}`,
      quantity: booking.adult_pax,
      unitPrice: Number(booking.price_per_adult),
      total: booking.adult_pax * Number(booking.price_per_adult),
    },
  ];

  if (booking.child_pax > 0) {
    invoiceItems.push({
      description: `Anak (50% dari harga dewasa)`,
      quantity: booking.child_pax,
      unitPrice: Number(booking.price_per_child),
      total: booking.child_pax * Number(booking.price_per_child),
    });
  }

  if (booking.infant_pax > 0) {
    invoiceItems.push({
      description: `Bayi (Gratis)`,
      quantity: booking.infant_pax,
      unitPrice: 0,
      total: 0,
    });
  }

  // Prepare invoice data
  const invoiceData: InvoiceData = {
    invoiceNumber,
    invoiceDate,
    companyName,
    companyAddress,
    companyPhone,
    companyEmail,
    companyLogo,
    customerName: booking.customer_name || 'Customer',
    customerPhone: booking.customer_phone || undefined,
    customerEmail: booking.customer_email || undefined,
    items: invoiceItems,
    subtotal: invoiceTotal,
    total: invoiceTotal,
    paymentMethod: booking.status === 'paid' ? 'Wallet' : 'Pending',
    paymentStatus: booking.status === 'paid' ? 'paid' : 'pending',
    notes: `Trip Date: ${new Date(booking.trip_date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
  };

  try {
    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDF, { data: invoiceData }) as any
    );

    logger.info('Partner invoice PDF generated', {
      bookingId,
      partnerId: user.id,
      bookingCode: booking.booking_code,
    });

    // Send invoice ready email (non-blocking)
    try {
      const { sendInvoiceReadyEmail } = await import('@/lib/partner/email-notifications');
      
      if (partnerProfile?.email) {
        sendInvoiceReadyEmail(
          partnerProfile.email,
          partnerProfile.full_name || 'Partner',
          booking.booking_code,
          invoiceNumber
        ).catch((emailError) => {
          logger.warn('Failed to send invoice ready email', {
            bookingId,
            error: emailError instanceof Error ? emailError.message : String(emailError),
          });
        });
      }
    } catch (emailError) {
      logger.warn('Email notification error (non-critical)', {
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });
    }

    // Return PDF
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${booking.booking_code}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Failed to generate invoice PDF', error, {
      bookingId,
      partnerId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
});
