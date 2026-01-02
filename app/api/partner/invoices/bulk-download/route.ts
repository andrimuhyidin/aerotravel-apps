/**
 * API: Bulk Download Invoices
 * POST /api/partner/invoices/bulk-download
 * Download multiple invoices as ZIP file
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { NextRequest, NextResponse } from 'next/server';
import React from 'react';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
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

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const body = await request.json();
  const { bookingIds } = body;

  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    return NextResponse.json(
      { error: 'Booking IDs array required' },
      { status: 400 }
    );
  }

  if (bookingIds.length > 50) {
    return NextResponse.json(
      { error: 'Maximum 50 invoices per bulk download' },
      { status: 400 }
    );
  }

  const client = supabase as unknown as any;

  try {
    // Get all bookings
    const { data: bookings, error: bookingsError } = await client
      .from('bookings')
      .select(
        `
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
      `
      )
      .eq('mitra_id', partnerId)
      .in('id', bookingIds);

    if (bookingsError || !bookings || bookings.length === 0) {
      return NextResponse.json(
        { error: 'Bookings not found' },
        { status: 404 }
      );
    }

    // Get partner whitelabel settings
    const { data: whitelabelSettings } = await client
      .from('partner_whitelabel_settings')
      .select('*')
      .eq('partner_id', partnerId)
      .maybeSingle();

    // Get partner profile for fallback
    const { data: partnerProfile } = await client
      .from('users')
      .select('full_name, email, phone')
      .eq('id', partnerId)
      .single();

    // Determine company info
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

    // Import JSZip dynamically (available via exceljs dependency)
    const JSZip = (await import('jszip')).default;
    
    // Create ZIP
    const zip = new JSZip();

    // Generate PDF for each booking
    for (const booking of bookings) {
      const invoiceNumber = `INV-${booking.booking_code}`;
      const invoiceDate = new Date(booking.created_at).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const totalPax = booking.adult_pax + booking.child_pax + booking.infant_pax;
      const packageName = booking.package?.name || 'Paket Wisata';
      const destination = booking.package?.destination || '';
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

        // Add to ZIP
        zip.file(
          `invoice-${booking.booking_code}.pdf`,
          Buffer.from(pdfBuffer as unknown as ArrayBuffer)
        );
      } catch (error) {
        logger.error('Failed to generate PDF for booking', error, {
          bookingId: booking.id,
          bookingCode: booking.booking_code,
        });
        // Continue with other invoices
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    logger.info('Bulk invoice ZIP generated', {
      partnerId: user.id,
      invoiceCount: bookings.length,
    });

    // Return ZIP file
    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.zip"`,
      },
    });
  } catch (error) {
    logger.error('Failed to generate bulk invoice ZIP', error, {
      partnerId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to generate ZIP file' },
      { status: 500 }
    );
  }
});

