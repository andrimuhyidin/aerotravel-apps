/**
 * Public Bookings API
 * POST /api/public/bookings - Create a new booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { checkRateLimit, getRequestIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/api/public-rate-limit';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { sanitizeInput } from '@/lib/utils/sanitize';

// Generate booking code
function generateBookingCode(): string {
  const prefix = 'AER';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

const createBookingSchema = z.object({
  packageId: z.string().uuid(),
  tripDate: z.string().datetime(),
  bookerName: z.string().min(3).max(100),
  bookerPhone: z.string().min(10).max(20),
  bookerEmail: z.string().email(),
  adultPax: z.number().min(1).max(50),
  childPax: z.number().min(0).max(50).default(0),
  infantPax: z.number().min(0).max(20).default(0),
  passengers: z.array(z.object({
    name: z.string().min(2),
    type: z.enum(['adult', 'child', 'infant']),
    identityNumber: z.string().optional(),
    phone: z.string().optional(),
  })).optional(),
  specialRequests: z.string().max(500).optional(),
  totalAmount: z.number().min(0),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting
  const identifier = getRequestIdentifier(request);
  const rateLimit = checkRateLimit(`booking:${identifier}`, RATE_LIMIT_CONFIGS.POST);
  
  if (!rateLimit.success) {
    logger.warn('Rate limit exceeded for booking', { identifier });
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
      { status: 429 }
    );
  }

  const body = await request.json();
  
  // Validate input
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn('Invalid booking data', { errors: parsed.error.errors });
    return NextResponse.json(
      { error: 'Invalid booking data', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  logger.info('POST /api/public/bookings', { 
    packageId: data.packageId,
    tripDate: data.tripDate,
    pax: data.adultPax + data.childPax + data.infantPax,
  });

  const supabase = await createClient();

  // Get current user (optional - guest checkout allowed)
  const { data: { user } } = await supabase.auth.getUser();

  // Verify package exists and is published
  const { data: pkg, error: pkgError } = await supabase
    .from('packages')
    .select('id, name, branch_id, max_pax')
    .eq('id', data.packageId)
    .eq('status', 'published')
    .single();

  if (pkgError || !pkg) {
    logger.warn('Package not found or not published', { packageId: data.packageId });
    return NextResponse.json(
      { error: 'Package not found or not available' },
      { status: 404 }
    );
  }

  // Check pax limits
  const totalPax = data.adultPax + data.childPax + data.infantPax;
  if (totalPax > pkg.max_pax) {
    return NextResponse.json(
      { error: `Maximum ${pkg.max_pax} passengers allowed for this package` },
      { status: 400 }
    );
  }

  // Generate booking code
  const bookingCode = generateBookingCode();

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      code: bookingCode,
      package_id: data.packageId,
      branch_id: pkg.branch_id,
      user_id: user?.id || null,
      customer_name: sanitizeInput(data.bookerName),
      customer_phone: sanitizeInput(data.bookerPhone),
      customer_email: data.bookerEmail.toLowerCase(),
      trip_date: data.tripDate,
      adult_pax: data.adultPax,
      child_pax: data.childPax,
      infant_pax: data.infantPax,
      total_amount: data.totalAmount,
      special_requests: data.specialRequests ? sanitizeInput(data.specialRequests) : null,
      status: 'pending',
      source: 'website',
      created_at: new Date().toISOString(),
    })
    .select('id, code')
    .single();

  if (bookingError) {
    logger.error('Failed to create booking', bookingError);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }

  // Store passengers if provided
  if (data.passengers && data.passengers.length > 0) {
    const passengers = data.passengers.map((p, index) => ({
      booking_id: booking.id,
      name: sanitizeInput(p.name),
      type: p.type,
      identity_number: p.identityNumber ? sanitizeInput(p.identityNumber) : null,
      phone: p.phone ? sanitizeInput(p.phone) : null,
      sequence: index + 1,
    }));

    await supabase.from('booking_passengers').insert(passengers);
  }

  logger.info('Booking created successfully', { 
    bookingId: booking.id, 
    code: booking.code,
  });

  return NextResponse.json({
    id: booking.id,
    code: booking.code,
    status: 'pending',
    message: 'Booking created successfully. Please proceed to payment.',
  }, { status: 201 });
});

