/**
 * API: Partner Bulk Booking Import
 * POST /api/partner/bookings/bulk-import - Create single booking from bulk import
 * 
 * This endpoint handles individual booking creation from bulk import.
 * The client handles batching and progress tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// Validation schema
const bulkImportRowSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(10, 'Valid phone number required'),
  customerEmail: z.string().email().optional().nullable(),
  packageSlug: z.string().min(1, 'Package slug is required'),
  travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  paxCount: z.number().min(1, 'Pax count must be at least 1'),
  specialRequests: z.string().optional().nullable(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access using centralized helper
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'User is not a partner or team member' }, { status: 403 });
  }

  const body = await request.json();
  
  // Sanitize input
  const sanitizedBody = sanitizeRequestBody(body, {
    strings: ['customerName', 'packageSlug', 'specialRequests'],
    emails: ['customerEmail'],
    phones: ['customerPhone'],
  });

  // Validate input
  const validation = bulkImportRowSchema.safeParse(sanitizedBody);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  const {
    customerName,
    customerPhone,
    customerEmail,
    packageSlug,
    travelDate,
    paxCount,
    specialRequests,
  } = validation.data;

  try {

    // Find package by slug
    const { data: pkg, error: pkgError } = await client
      .from('packages')
      .select(`
        id,
        name,
        branch_id,
        prices:package_prices(
          min_pax,
          max_pax,
          price_publish,
          price_nta
        ),
        branch:branches(
          id,
          tax_inclusive,
          tax_rate
        )
      `)
      .eq('slug', packageSlug)
      .eq('status', 'published')
      .is('deleted_at', null)
      .maybeSingle();

    if (pkgError || !pkg) {
      return NextResponse.json(
        { error: `Package not found: ${packageSlug}` },
        { status: 404 }
      );
    }

    // Calculate pricing
    const prices = pkg.prices as Array<{
      min_pax: number;
      max_pax: number;
      price_publish: number;
      price_nta: number;
    }>;
    
    const priceTier = prices?.find(
      (p) => p.min_pax <= paxCount && p.max_pax >= paxCount
    ) || prices?.[0];

    if (!priceTier) {
      return NextResponse.json(
        { error: 'No pricing available for this pax count' },
        { status: 400 }
      );
    }

    const pricePerAdult = Number(priceTier.price_publish);
    const ntaPricePerAdult = Number(priceTier.price_nta);

    const subtotal = paxCount * pricePerAdult;
    const ntaTotal = paxCount * ntaPricePerAdult;

    // Tax calculation
    const branch = pkg.branch as { tax_inclusive: boolean; tax_rate: number } | null;
    const taxInclusive = branch?.tax_inclusive ?? false;
    const taxRate = Number(branch?.tax_rate ?? 0.11);

    let taxAmount = 0;
    let totalAmount = subtotal;

    if (!taxInclusive) {
      taxAmount = subtotal * taxRate;
      totalAmount = subtotal + taxAmount;
    } else {
      taxAmount = subtotal * (taxRate / (1 + taxRate));
    }

    // Check wallet balance
    const { data: walletData, error: walletError } = await client
      .from('mitra_wallets')
      .select('id, balance, credit_limit')
      .eq('mitra_id', partnerId)
      .single();

    if (walletError || !walletData) {
      return NextResponse.json(
        { error: 'Wallet tidak ditemukan. Silakan top-up wallet terlebih dahulu.' },
        { status: 400 }
      );
    }

    const availableBalance =
      Number(walletData.balance) + Number(walletData.credit_limit || 0);

    if (availableBalance < ntaTotal) {
      return NextResponse.json(
        {
          error: `Saldo tidak mencukupi. Diperlukan Rp ${ntaTotal.toLocaleString('id-ID')}, tersedia Rp ${availableBalance.toLocaleString('id-ID')}`,
        },
        { status: 400 }
      );
    }

    // Generate booking code
    const { data: bookingCodeData } = await supabase.rpc('generate_booking_code');
    const bookingCode = bookingCodeData || `BK-${Date.now()}`;

    // Create booking
    const { data: booking, error: bookingError } = await client
      .from('bookings')
      .insert({
        branch_id: pkg.branch_id,
        package_id: pkg.id,
        booking_code: bookingCode,
        trip_date: travelDate,
        source: 'mitra',
        mitra_id: partnerId,
        adult_pax: paxCount,
        child_pax: 0,
        infant_pax: 0,
        price_per_adult: pricePerAdult,
        price_per_child: 0,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        nta_price_per_adult: ntaPricePerAdult,
        nta_total: ntaTotal,
        status: 'confirmed',
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        special_requests: specialRequests || null,
        conversion_source: 'bulk_import',
      })
      .select('id, booking_code')
      .single();

    if (bookingError || !booking) {
      logger.error('Bulk import booking creation failed', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Debit wallet
    const balanceBefore = Number(walletData.balance);
    const newBalance = balanceBefore - ntaTotal;

    await client
      .from('mitra_wallet_transactions')
      .insert({
        wallet_id: walletData.id,
        transaction_type: 'booking_debit',
        amount: -ntaTotal,
        balance_before: balanceBefore,
        balance_after: newBalance,
        booking_id: booking.id,
        description: `Pembayaran booking ${booking.booking_code} (Bulk Import)`,
      });

    await client
      .from('mitra_wallets')
      .update({ balance: newBalance })
      .eq('id', walletData.id);

    // Create or find customer
    try {
      const conditions: string[] = [];
      if (customerEmail) {
        conditions.push(`email.eq.${customerEmail}`);
      }
      conditions.push(`phone.eq.${customerPhone}`);

      let existingCustomer: { id: string } | null = null;
      if (conditions.length > 0) {
        const { data } = await client
          .from('partner_customers')
          .select('id')
          .eq('partner_id', partnerId)
          .or(conditions.join(','))
          .is('deleted_at', null)
          .maybeSingle();
        existingCustomer = data || null;
      }

      if (!existingCustomer) {
        const { data: newCustomer } = await client
          .from('partner_customers')
          .insert({
            partner_id: partnerId,
            name: customerName,
            email: customerEmail || null,
            phone: customerPhone,
          })
          .select('id')
          .single();

        if (newCustomer) {
          await client
            .from('bookings')
            .update({ customer_id: newCustomer.id })
            .eq('id', booking.id);
        }
      } else {
        await client
          .from('bookings')
          .update({ customer_id: existingCustomer.id })
          .eq('id', booking.id);
      }
    } catch (customerError) {
      // Non-critical
      logger.warn('Failed to auto-create customer for bulk import', {
        error: customerError instanceof Error ? customerError.message : String(customerError),
      });
    }

    logger.info('Bulk import booking created', {
      partnerId,
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      packageSlug,
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      bookingCode: booking.booking_code,
    });
  } catch (error) {
    logger.error('Bulk import booking failed', error);
    return NextResponse.json(
      { error: 'Gagal membuat booking. Silakan coba lagi.' },
      { status: 500 }
    );
  }
});

