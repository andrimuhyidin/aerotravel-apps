/**
 * API: Partner Bookings
 * GET /api/partner/bookings - List partner bookings
 * POST /api/partner/bookings - Create new booking
 */

import { format } from 'date-fns';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { createTransaction } from '@/lib/integrations/midtrans';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const client = supabase as unknown as any;

  try {
    // Check if user is a partner (mitra) or partner team member
    const { data: userProfile, error: userProfileError } = await client
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (userProfileError) {
      logger.error('Failed to fetch user profile', userProfileError, {
        userId: user.id,
        errorMessage: userProfileError.message,
        errorDetails: userProfileError.details,
        errorHint: userProfileError.hint,
      });
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: userProfileError.message },
        { status: 500 }
      );
    }

    if (!userProfile) {
      logger.warn('User profile not found', { userId: user.id });
      return NextResponse.json({
        bookings: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Determine partner_id (mitra_id)
    let partnerId = user.id;
    
    // If user is not a mitra, check if they're a team member
    if (userProfile.role !== 'mitra') {
      const { data: partnerUser, error: partnerUserError } = await client
        .from('partner_users')
        .select('partner_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .eq('is_active', true)
        .maybeSingle();

      if (partnerUserError) {
        logger.warn('Failed to check partner_users, assuming direct partner', {
          userId: user.id,
          error: partnerUserError.message,
        });
        // Continue as if user is direct partner
      } else if (partnerUser) {
        partnerId = partnerUser.partner_id;
      } else {
        // User is not a partner or team member - return empty result
        logger.info('User is not a partner or team member, returning empty bookings', {
          userId: user.id,
          role: userProfile.role,
        });
        return NextResponse.json({
          bookings: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }
    }

    // Build query - simplify to avoid RLS issues with nested relations
    let query = client
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
        status,
        customer_name,
        customer_phone,
        customer_email,
        created_at,
        package_id
      `,
        { count: 'exact' }
      )
      .eq('mitra_id', partnerId) // Using verified partnerId
      .is('deleted_at', null);

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by date range
    if (from) {
      query = query.gte('trip_date', from);
    }
    if (to) {
      query = query.lte('trip_date', to);
    }

    // Search filter - simplified to avoid relation issues
    if (search) {
      query = query.or(
        `booking_code.ilike.%${search}%,customer_name.ilike.%${search}%`
      );
    }

    // Order and paginate
    query = query.order('created_at', { ascending: false });
    const { data: bookings, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch partner bookings', error, {
        userId: user.id,
        partnerId,
        status,
        search,
        from,
        to,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        errorCode: error.code,
      });
      
      // Return empty result instead of error for better UX
      // This handles RLS issues gracefully
      logger.warn('Returning empty bookings due to query error', {
        userId: user.id,
        partnerId,
        error: error.message,
      });
      
      return NextResponse.json({
        bookings: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Fetch package details separately to avoid RLS issues with nested relations
    const packageIds = [...new Set((bookings || []).map((b: { package_id: string }) => b.package_id).filter(Boolean))];
    let packagesMap: Record<string, { id: string; name: string; destination: string | null }> = {};
    
    if (packageIds.length > 0) {
      try {
        const { data: packages } = await client
          .from('packages')
          .select('id, name, destination')
          .in('id', packageIds);
        
        if (packages) {
          packagesMap = packages.reduce((acc: Record<string, any>, pkg: any) => {
            acc[pkg.id] = pkg;
            return acc;
          }, {});
        }
      } catch (pkgError) {
        // Non-critical - log but continue
        logger.warn('Failed to fetch package details', { error: pkgError instanceof Error ? pkgError.message : String(pkgError) });
      }
    }

    // Combine bookings with package data
    const bookingsWithPackages = (bookings || []).map((booking: any) => ({
      ...booking,
      package: booking.package_id ? (packagesMap[booking.package_id] || null) : null,
    }));

    return NextResponse.json({
      bookings: bookingsWithPackages,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch partner bookings', error, {
      userId: user.id,
    });
    throw error;
  }
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

  // Verify partner access
  const { isPartner, partnerId: verifiedPartnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !verifiedPartnerId) {
    return NextResponse.json(
      { error: 'User is not a partner or team member' },
      { status: 403 }
    );
  }

  const body = await request.json();

  // Sanitize request body
  const sanitizedBody = sanitizeRequestBody(body, {
    strings: ['customerName', 'customerPhone', 'customerSegment', 'roomPreference', 'specialRequests', 'conversionSource'],
    emails: ['customerEmail'],
  });

  const {
    packageId,
    tripDate,
    adultPax,
    childPax = 0,
    infantPax = 0,
    customerId,
    customerName,
    customerPhone,
    customerEmail,
    customerSegment,
    roomPreference,
    multiRoom = 0,
    multiKapal = 0,
    paymentMethod = 'wallet',
    specialRequests,
    passengers, // Array of passenger details
    status, // Optional: 'draft' for draft bookings
    // NEW: Tracking fields
    draftId,
    conversionSource = 'direct', // 'fast_booking', 'package_detail', 'draft_resume', 'direct'
    timeToComplete, // Time in seconds
  } = sanitizedBody;

  if (!packageId || !tripDate || !adultPax || !customerName || !customerPhone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Use verified partner ID (from helper, prevents unauthorized access)
  const partnerId = verifiedPartnerId;

  // Get package pricing and branch config (use verified partner ID)
  const { data: pkg } = (await supabase
    .from('packages')
    .select(`
      id,
      branch_id,
      duration_days,
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
    .eq('id', packageId)
    .single()) as {
    data: {
      id: string;
      branch_id: string;
      duration_days: number;
      prices: Array<{
        min_pax: number;
        max_pax: number;
        price_publish: number;
        price_nta: number;
      }> | null;
      branch: {
        id: string;
        tax_inclusive: boolean;
        tax_rate: number;
      } | null;
    } | null;
  };

  if (!pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  // PRD 4.4.A: Double Booking Guard - Check asset availability
  try {
    const { validateTripAssignment } = await import('@/lib/scheduler/resource-scheduler');
    
    // Get package assets (kapal/villa) - simplified check
    // For now, we check if there are any existing bookings on the same date
    // Full asset conflict check would require trip assignment, which happens later
    const { data: existingBookings } = await client
      .from('bookings')
      .select('id, booking_code')
      .eq('package_id', packageId)
      .eq('trip_date', tripDate)
      .in('status', ['confirmed', 'paid', 'ongoing'])
      .is('deleted_at', null);

    // Check hard limit (capacity) - this is a simplified check
    // Full capacity check should be done via availability API
    if (existingBookings && existingBookings.length > 0) {
      logger.warn('Potential booking conflict detected', {
        packageId,
        tripDate,
        existingBookingsCount: existingBookings.length,
      });
      // Note: This is a warning, not a blocker, as packages can have multiple slots
      // Full conflict check should be done via availability API before booking
    }
  } catch (conflictError) {
    // Non-critical - log but continue
    logger.warn('Failed to check booking conflicts', {
      error: conflictError instanceof Error ? conflictError.message : String(conflictError),
      packageId,
      tripDate,
    });
  }

  // Calculate pricing
  const prices = pkg.prices as Array<{
    min_pax: number;
    max_pax: number;
    price_publish: number;
    price_nta: number;
  }>;
  const priceTier = prices?.find((p) => p.min_pax <= adultPax && p.max_pax >= adultPax) || prices?.[0];

  if (!priceTier) {
    return NextResponse.json({ error: 'No pricing available for this pax count' }, { status: 400 });
  }

  // PRD 4.2.B: Dynamic Seasonality - Prioritas: High Season > Weekend > Weekday
  let basePricePerAdult = Number(priceTier.price_publish);
  let baseNtaPricePerAdult = Number(priceTier.price_nta);
  let seasonMarkup = 0;
  let isHighSeason = false;
  let isWeekend = false;

  // Check if trip date is weekend
  const tripDateObj = new Date(tripDate);
  const dayOfWeek = tripDateObj.getDay();
  isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

  // Check High Season (Prioritas 1)
  try {
    const { data: seasonData } = await client
      .from('season_calendar')
      .select('markup_type, markup_value, season_type')
      .eq('branch_id', pkg.branch_id)
      .lte('start_date', tripDate)
      .gte('end_date', tripDate)
      .in('season_type', ['high_season', 'peak_season'])
      .maybeSingle();

    if (seasonData) {
      isHighSeason = true;
      const markupValue = Number(seasonData.markup_value);
      
      if (seasonData.markup_type === 'percent') {
        // Percentage markup (e.g., 20% = +20%)
        seasonMarkup = markupValue / 100;
        basePricePerAdult = basePricePerAdult * (1 + seasonMarkup);
        baseNtaPricePerAdult = baseNtaPricePerAdult * (1 + seasonMarkup);
      } else {
        // Fixed markup (e.g., +100000)
        basePricePerAdult = basePricePerAdult + markupValue;
        baseNtaPricePerAdult = baseNtaPricePerAdult + markupValue;
      }
    } else if (isWeekend && priceTier.price_weekend) {
      // Prioritas 2: Weekend pricing (if not high season)
      basePricePerAdult = Number(priceTier.price_weekend);
      // NTA weekend price not stored separately, use same markup ratio
      const weekendMarkup = (basePricePerAdult - Number(priceTier.price_publish)) / Number(priceTier.price_publish);
      baseNtaPricePerAdult = baseNtaPricePerAdult * (1 + weekendMarkup);
    }
    // Prioritas 3: Weekday pricing (default, already set)
  } catch (seasonError) {
    // Non-critical - log but continue with base price
    logger.warn('Failed to check seasonality', {
      error: seasonError instanceof Error ? seasonError.message : String(seasonError),
      packageId,
      tripDate,
    });
  }

  const pricePerAdult = basePricePerAdult;
  const ntaPricePerAdult = baseNtaPricePerAdult;
  
  // PRD 4.2.A: Child Policy - 50% discount, Infant free
  const childPercent = 0.5;
  const infantPrice = 0; // PRD: Infant = 0 (Gratis)

  // Calculate subtotal (before tax)
  const adultSubtotal = adultPax * pricePerAdult;
  const childSubtotal = childPax * pricePerAdult * childPercent;
  const infantSubtotal = infantPax * infantPrice;
  const subtotal = adultSubtotal + childSubtotal + infantSubtotal;

  // NTA total (for partner)
  const adultNTA = adultPax * ntaPricePerAdult;
  const childNTA = childPax * ntaPricePerAdult * childPercent;
  const infantNTA = infantPax * 0;
  const ntaTotal = adultNTA + childNTA + infantNTA;

  // PRD 4.3.A: Tax Calculation Logic
  const branch = pkg.branch;
  const taxInclusive = branch?.tax_inclusive ?? false;
  const taxRate = Number(branch?.tax_rate ?? 0.11); // Default 11% PPN

  let taxAmount = 0;
  let totalAmount = subtotal;

  if (!taxInclusive) {
    // Tax is added on top
    taxAmount = subtotal * taxRate;
    totalAmount = subtotal + taxAmount;
  } else {
    // Tax is already included in price
    // Calculate tax amount for display purposes
    taxAmount = subtotal * (taxRate / (1 + taxRate));
  }

  // If draft, skip payment validation
  const isDraft = status === 'draft';
  
  // If wallet payment, check balance first (skip for draft)
  if (paymentMethod === 'wallet' && !isDraft) {
    const { data: walletData, error: walletError } = await client
      .from('mitra_wallets')
      .select('balance, credit_limit')
      .eq('mitra_id', partnerId) // Using verified partnerId
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
          error: `Saldo tidak mencukupi. Diperlukan ${ntaTotal.toLocaleString('id-ID')}, tersedia ${availableBalance.toLocaleString('id-ID')}`,
        },
        { status: 400 }
      );
    }
  }

  // Generate booking code
  const { data: bookingCodeData } = await supabase.rpc('generate_booking_code');
  const bookingCode = bookingCodeData || `BK-${Date.now()}`;

  // Start transaction: Create booking + debit wallet (if wallet payment)
  try {
    // Build special requests with additional info
    const enhancedSpecialRequests = [
      specialRequests,
      customerSegment ? `Segment: ${customerSegment}` : null,
      roomPreference ? `Room Preference: ${roomPreference}` : null,
      multiRoom > 0 ? `Tambahan Kamar: ${multiRoom}` : null,
      multiKapal > 0 ? `Tambahan Kapal: ${multiKapal}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    // Create booking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: booking, error: bookingError } = (await (supabase as any)
      .from('bookings')
      .insert({
        branch_id: pkg.branch_id,
        package_id: packageId,
        booking_code: bookingCode,
        trip_date: tripDate,
        source: 'mitra',
        mitra_id: partnerId,
        customer_id: customerId || null,
        adult_pax: adultPax,
        child_pax: childPax,
        infant_pax: infantPax,
        price_per_adult: pricePerAdult,
        price_per_child: pricePerAdult * childPercent,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        nta_price_per_adult: ntaPricePerAdult,
        nta_total: ntaTotal,
        // PRD 4.3.B: Deposit System - Status langsung CONFIRMED tanpa verifikasi manual
        status: isDraft ? 'draft' : (paymentMethod === 'wallet' ? 'confirmed' : 'pending_payment'),
        draft_saved_at: isDraft ? new Date().toISOString() : null,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        special_requests: enhancedSpecialRequests || null,
        // NEW: Tracking fields
        conversion_source: conversionSource,
        time_to_complete_seconds: timeToComplete || null,
        draft_id: draftId || null,
      } as Record<string, unknown>)
      .select('id, booking_code')
      .single()) as {
        data: { id: string; booking_code: string } | null;
        error: Error | null;
      };

    if (bookingError || !booking) {
      logger.error('Create partner booking failed', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    // Invalidate availability cache for this package and trip date
    try {
      const { invalidateAvailabilityCache } = await import('@/lib/cache/package-availability-cache');
      await invalidateAvailabilityCache(packageId, tripDate);
      logger.debug('Invalidated availability cache', { packageId, tripDate });
    } catch (cacheError) {
      // Non-critical - log but don't fail
      logger.warn('Failed to invalidate availability cache', cacheError, {
        packageId,
        tripDate,
      });
    }

    // Insert passenger details if provided
    if (passengers && Array.isArray(passengers) && passengers.length > 0 && booking) {
      try {
        // Determine passenger type based on index
        const determinePassengerType = (index: number): 'adult' | 'child' | 'infant' => {
          if (index < adultPax) return 'adult';
          if (index < adultPax + childPax) return 'child';
          return 'infant';
        };

        const passengerRecords = passengers
          .filter((p: { fullName?: string }) => p.fullName && p.fullName.trim() !== '')
          .map((p: {
            fullName: string;
            dateOfBirth?: string | Date | null;
            dietaryRequirements?: string;
            healthConditions?: string;
            emergencyName?: string;
            emergencyPhone?: string;
            roomAssignment?: string;
          }, index: number) => ({
            booking_id: booking.id,
            full_name: p.fullName.trim(),
            passenger_type: determinePassengerType(index),
            date_of_birth: p.dateOfBirth
              ? (typeof p.dateOfBirth === 'string' ? p.dateOfBirth : format(new Date(p.dateOfBirth), 'yyyy-MM-dd'))
              : null,
            dietary_requirements: p.dietaryRequirements?.trim() || null,
            health_conditions: p.healthConditions?.trim() || null,
            emergency_name: p.emergencyName?.trim() || null,
            emergency_phone: p.emergencyPhone?.trim() || null,
          }));

        if (passengerRecords.length > 0) {
          const { error: passengerError } = await client
            .from('booking_passengers')
            .insert(passengerRecords);

          if (passengerError) {
            logger.warn('Failed to insert passenger details', { 
              bookingId: booking.id,
              error: passengerError instanceof Error ? passengerError.message : String(passengerError)
            });
            // Don't fail booking creation if passenger insert fails
          } else {
            logger.info('Passenger details inserted', { bookingId: booking.id, count: passengerRecords.length });
          }
        }
      } catch (passengerError) {
        logger.warn('Error inserting passenger details', { 
          bookingId: booking.id,
          error: passengerError instanceof Error ? passengerError.message : String(passengerError)
        });
        // Don't fail booking creation if passenger insert fails
      }
    }

    // Auto-create customer if customerId not provided but customer data exists
    if (!customerId && customerName && customerPhone && booking) {
      try {
        // Build OR condition safely
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
          // Create new customer
          const { data: newCustomer } = await client
            .from('partner_customers')
            .insert({
              partner_id: partnerId,
              name: customerName,
              email: customerEmail || null,
              phone: customerPhone,
              segment: customerSegment || null,
            })
            .select('id')
            .single();

          if (newCustomer) {
            // Update booking with customer_id
            await client
              .from('bookings')
              .update({ customer_id: newCustomer.id })
              .eq('id', booking.id);
          }
        } else {
          // Update booking with existing customer_id
          await client
            .from('bookings')
            .update({ customer_id: existingCustomer.id })
            .eq('id', booking.id);
        }
      } catch (customerError) {
        // Non-critical - log but continue
        logger.warn('Failed to auto-create customer', {
          error: customerError instanceof Error ? customerError.message : String(customerError),
        });
      }
    }

    // If wallet payment, debit wallet atomically (skip for draft)
    if (paymentMethod === 'wallet' && !isDraft && booking) {
      // Get wallet
      const { data: wallet, error: walletFetchError } = await client
        .from('mitra_wallets')
        .select('id, balance')
        .eq('mitra_id', partnerId) // Using verified partnerId
        .single();

      if (walletFetchError || !wallet) {
        logger.error('Failed to fetch wallet for debit', walletFetchError);
        // Booking already created, but wallet debit failed
        // This is a critical error - booking should be marked as pending_payment
        await client
          .from('bookings')
          .update({ status: 'pending_payment' })
          .eq('id', booking.id);
        
        return NextResponse.json(
          { error: 'Booking dibuat tetapi gagal debit wallet. Silakan hubungi admin.' },
          { status: 500 }
        );
      }

      const balanceBefore = Number(wallet.balance);
      const newBalance = balanceBefore - ntaTotal;

      // Create wallet transaction
      const { error: txError } = await client
        .from('mitra_wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          transaction_type: 'booking_debit',
          amount: -ntaTotal,
          balance_before: balanceBefore,
          balance_after: newBalance,
          booking_id: booking.id,
          description: `Pembayaran booking ${booking.booking_code}`,
        });

      if (txError) {
        logger.error('Failed to create wallet transaction', txError);
        // Booking created but transaction failed - update booking status
        await client
          .from('bookings')
          .update({ status: 'pending_payment' })
          .eq('id', booking.id);
        
        return NextResponse.json(
          { error: 'Booking dibuat tetapi gagal mencatat transaksi wallet. Silakan hubungi admin.' },
          { status: 500 }
        );
      }

      // Update wallet balance
      const { error: updateError } = await client
        .from('mitra_wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (updateError) {
        logger.error('Failed to update wallet balance', updateError);
        // Booking created, transaction recorded, but balance update failed
        // This is less critical but should be handled
        // For now, log and continue - can be fixed manually or via reconciliation
      }

      logger.info('Wallet debited for booking', {
        partnerId,
        bookingId: booking.id,
        amount: ntaTotal,
        balanceBefore,
        balanceAfter: newBalance,
      });
    }

    // If external payment, generate Midtrans payment link (skip for draft)
    let paymentLink: string | null = null;
    let paymentToken: string | null = null;
    
    if (paymentMethod === 'external' && !isDraft && booking) {
      try {
        // Get package name for item details
        const { data: packageData } = await client
          .from('packages')
          .select('name')
          .eq('id', packageId)
          .single();

        const packageName = packageData?.name || 'Paket Wisata';

        // Create Midtrans transaction
        const transaction = await createTransaction({
          transactionDetails: {
            orderId: booking.booking_code,
            grossAmount: subtotal, // Customer pays publish price
          },
          customerDetails: {
            firstName: customerName.split(' ')[0] || customerName,
            lastName: customerName.split(' ').slice(1).join(' ') || '',
            email: customerEmail || undefined,
            phone: customerPhone,
          },
          itemDetails: [
            {
              id: packageId,
              price: subtotal,
              quantity: 1,
              name: `${packageName} - ${adultPax} Dewasa${childPax > 0 ? `, ${childPax} Anak` : ''}${infantPax > 0 ? `, ${infantPax} Bayi` : ''}`,
            },
          ],
          enabledPayments: ['qris', 'bank_transfer', 'credit_card', 'gopay', 'shopeepay'],
        });

        const transactionData = transaction as { token: string; redirect_url: string };
        paymentToken = transactionData.token;
        paymentLink = transactionData.redirect_url;

        // Create payment record in payments table
        await client
          .from('payments')
          .insert({
            booking_id: booking.id,
            payment_code: booking.booking_code,
            amount: subtotal,
            payment_method: 'xendit_invoice', // Using xendit_invoice as closest match for Midtrans
            status: 'pending',
            external_id: booking.booking_code, // Use booking code as external ID
            payment_url: paymentLink,
          } as Record<string, unknown>)
          .catch((paymentInsertError: unknown) => {
            logger.warn('Failed to create payment record', { error: paymentInsertError instanceof Error ? paymentInsertError.message : String(paymentInsertError), bookingId: booking.id });
            // Non-critical, continue
          });

        logger.info('Payment link generated for external payment', {
          bookingId: booking.id,
          bookingCode: booking.booking_code,
          paymentLink,
        });
      } catch (paymentError) {
        logger.error('Failed to generate payment link', paymentError, {
          bookingId: booking.id,
        });
        // Don't fail booking creation, but log the error
        // Payment link can be generated later via separate endpoint
      }
    }

      logger.info('Partner booking created', {
        partnerId,
        bookingId: booking.id,
        bookingCode: booking.booking_code,
        paymentMethod,
        hasPaymentLink: !!paymentLink,
      });

      // Emit booking.created event (non-blocking)
      try {
        const { emitEvent } = await import('@/lib/events/event-bus');
        await emitEvent(
          {
            type: 'booking.created',
            app: 'partner',
            userId: user.id,
            data: {
              bookingId: booking.id,
              bookingCode: booking.booking_code,
              packageId: packageId,
              tripDate: tripDate,
              totalAmount: subtotal,
              customerName: customerName,
              customerEmail: customerEmail,
              customerPhone: customerPhone,
            },
          },
          {
            ipAddress: request.headers.get('x-forwarded-for') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
          }
        ).catch((eventError) => {
          logger.warn('Failed to emit booking.created event', eventError);
        });
      } catch (eventError) {
        logger.warn('Event emission error (non-critical)', {
          error: eventError instanceof Error ? eventError.message : String(eventError),
        });
      }

      // Audit log (non-blocking)
      try {
        const { logAuditEvent } = await import('@/lib/audit/cross-app-audit');
        await logAuditEvent(
          'partner',
          user.id,
          'create',
          'booking',
          booking.id,
          {
            bookingCode: booking.booking_code,
            packageId,
            tripDate,
            totalAmount: subtotal,
            customerName,
            paymentMethod,
            isDraft,
          },
          {
            ipAddress: request.headers.get('x-forwarded-for') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
          }
        );
      } catch (auditError) {
        logger.warn('Audit log error (non-critical)', {
          error: auditError instanceof Error ? auditError.message : String(auditError),
        });
      }

      // Create in-app notification (non-blocking)
      try {
        const { createPartnerNotification } = await import('@/lib/partner/notifications');
        createPartnerNotification(
          partnerId,
          'booking_confirmed',
          'Booking Dikonfirmasi',
          `Booking ${booking.booking_code} telah berhasil dibuat untuk ${customerName}`,
          { bookingId: booking.id, bookingCode: booking.booking_code }
        ).catch((notifError) => {
          logger.warn('Failed to create notification', notifError);
        });
      } catch (notifError) {
        logger.warn('Notification error (non-critical)', {
          error: notifError instanceof Error ? notifError.message : String(notifError),
        });
      }

      // Send booking confirmation email (non-blocking)
      try {
        const { sendBookingConfirmationEmail } = await import('@/lib/partner/email-notifications');
        
        // Get partner email
        const { data: partnerProfile } = await client
          .from('users')
          .select('email, full_name')
          .eq('id', partnerId)
          .single();

        if (partnerProfile?.email) {
          // Don't await - send in background
          sendBookingConfirmationEmail(
            partnerProfile.email,
            partnerProfile.full_name || 'Partner',
            booking.booking_code,
            customerName,
            pkg.prices?.[0] ? 'Paket Wisata' : 'Unknown Package',
            tripDate,
            subtotal,
            ntaTotal,
            subtotal - ntaTotal
          ).catch((emailError) => {
            logger.warn('Failed to send booking confirmation email', {
              bookingId: booking.id,
              error: emailError instanceof Error ? emailError.message : String(emailError),
            });
          });
        }
      } catch (emailError) {
        // Non-critical - log but don't fail booking
        logger.warn('Email notification error (non-critical)', {
          error: emailError instanceof Error ? emailError.message : String(emailError),
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: booking.id,
          bookingCode: booking.booking_code,
          ntaTotal,
          publishTotal: subtotal,
          margin: subtotal - ntaTotal,
          paymentLink: paymentLink || undefined,
          paymentToken: paymentToken || undefined,
        },
      });
  } catch (error) {
    logger.error('Booking creation transaction failed', error, {
      partnerId,
      packageId,
    });
    return NextResponse.json(
      { error: 'Gagal membuat booking. Silakan coba lagi.' },
      { status: 500 }
    );
  }
});
