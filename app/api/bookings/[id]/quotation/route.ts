/**
 * Generate Quotation PDF
 * GET /api/bookings/[id]/quotation
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  generateQuotationHTML,
  QuotationData,
} from '@/lib/pdf/quotation-template';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    type BookingWithPackage = {
      booking_code: string;
      created_at: string;
      trip_date: string;
      status: string;
      customer_name: string;
      customer_email: string | null;
      customer_phone: string;
      adult_pax: number;
      child_pax: number;
      price_per_adult: number;
      price_per_child: number;
      subtotal: number;
      discount_amount: number | null;
      tax_amount: number | null;
      total_amount: number;
      special_requests: string | null;
      packages: {
        name: string;
        destination: string;
        duration_days: number;
        duration_nights: number;
        inclusions: string[] | null;
      } | null;
    };

    // Get booking with package info
    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        packages (
          name,
          destination,
          duration_days,
          duration_nights,
          inclusions
        )
      `
      )
      .eq('id', id)
      .single();

    const booking = data as BookingWithPackage | null;

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const pkg = booking.packages as {
      name: string;
      destination: string;
      duration_days: number;
      duration_nights: number;
      inclusions: string[] | null;
    } | null;

    const quotationData: QuotationData = {
      booking: {
        code: booking.booking_code,
        date: booking.created_at,
        tripDate: booking.trip_date,
        status: booking.status,
      },
      customer: {
        name: booking.customer_name,
        email: booking.customer_email || undefined,
        phone: booking.customer_phone,
      },
      package: {
        name: pkg?.name || 'Package',
        destination: pkg?.destination || '-',
        duration: `${pkg?.duration_days || 0} Hari ${pkg?.duration_nights || 0} Malam`,
        inclusions: pkg?.inclusions || [],
      },
      pricing: {
        adultPax: booking.adult_pax,
        childPax: booking.child_pax,
        pricePerAdult: booking.price_per_adult,
        pricePerChild: booking.price_per_child,
        subtotal: booking.subtotal,
        discount: booking.discount_amount || 0,
        tax: booking.tax_amount || 0,
        total: booking.total_amount,
      },
      company: {
        name: 'Aero Travel',
        address: 'Bandar Lampung, Lampung',
        phone: '+62 812 3456 7890',
        email: 'info@aerotravel.co.id',
      },
      notes: booking.special_requests || undefined,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    const html = generateQuotationHTML(quotationData);

    // Return HTML (can be converted to PDF client-side or via puppeteer)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    logger.error('Failed to generate quotation', error);
    return NextResponse.json(
      { error: 'Failed to generate quotation' },
      { status: 500 }
    );
  }
}
