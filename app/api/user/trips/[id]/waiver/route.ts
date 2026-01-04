/**
 * User Trip Waiver API
 * POST /api/user/trips/[id]/waiver - Sign liability waiver
 * GET /api/user/trips/[id]/waiver - Get waiver status
 * 
 * Note: Customer bookings are linked via customer_email (not user_id)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { uploadFile } from '@/lib/storage/supabase-storage';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/user/trips/[id]/waiver
 * Get waiver status for a trip
 */
export const GET = withErrorHandler(async (_request: NextRequest, context: RouteParams) => {
  const { id } = await context.params;

  logger.info('GET /api/user/trips/[id]/waiver', { id });

  const supabase = await createClient();

  // Get current user with email
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get booking waiver status - verify via customer_email OR created_by
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, waiver_signed_at, waiver_signature_url')
    .eq('id', id)
    .or(`customer_email.eq.${user.email},created_by.eq.${user.id}`)
    .is('deleted_at', null)
    .single();

  if (error || !booking) {
    logger.warn('Booking not found', { id, email: user.email });
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  return NextResponse.json({
    isSigned: !!booking.waiver_signed_at,
    signedAt: booking.waiver_signed_at,
    signatureUrl: booking.waiver_signature_url,
  });
});

/**
 * POST /api/user/trips/[id]/waiver
 * Sign liability waiver for a trip
 */
export const POST = withErrorHandler(async (request: NextRequest, context: RouteParams) => {
  const { id } = await context.params;

  logger.info('POST /api/user/trips/[id]/waiver', { id });

  const supabase = await createClient();

  // Get current user with email
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse request body
  const body = (await request.json()) as {
    signature: string; // base64 signature image
    agreedToTerms: boolean;
    gpsLocation?: {
      latitude: number;
      longitude: number;
    };
  };

  if (!body.signature || !body.agreedToTerms) {
    return NextResponse.json(
      { error: 'Signature and terms agreement are required' },
      { status: 400 }
    );
  }

  // Verify booking exists and belongs to user via customer_email OR created_by
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, waiver_signed_at, trip_date, status')
    .eq('id', id)
    .or(`customer_email.eq.${user.email},created_by.eq.${user.id}`)
    .is('deleted_at', null)
    .single();

  if (bookingError || !booking) {
    logger.warn('Booking not found', { id, email: user.email });
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Check if already signed
  if (booking.waiver_signed_at) {
    return NextResponse.json(
      { error: 'Waiver already signed', signedAt: booking.waiver_signed_at },
      { status: 400 }
    );
  }

  // Get client info for audit trail
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Upload signature to Supabase Storage
  let signatureUrl = '';
  try {
    // Convert base64 to buffer
    const base64Data = body.signature.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const filename = `waivers/${id}/${user.id}-${Date.now()}.png`;

    // Upload to storage
    signatureUrl = await uploadFile({
      bucket: 'documents',
      path: filename,
      file: buffer,
      contentType: 'image/png',
      upsert: true,
    });

    logger.info('Signature uploaded', { bookingId: id, filename });
  } catch (uploadError) {
    logger.error('Failed to upload signature', uploadError);
    return NextResponse.json({ error: 'Failed to upload signature' }, { status: 500 });
  }

  // Update booking with waiver info
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      waiver_signed_at: new Date().toISOString(),
      waiver_signature_url: signatureUrl,
      waiver_signer_ip: clientIp,
      waiver_signer_user_agent: userAgent,
    })
    .eq('id', id);

  if (updateError) {
    logger.error('Failed to update booking with waiver', updateError);
    return NextResponse.json({ error: 'Failed to save waiver' }, { status: 500 });
  }

  logger.info('Waiver signed successfully', {
    bookingId: id,
    userId: user.id,
    clientIp,
  });

  return NextResponse.json({
    success: true,
    message: 'Waiver signed successfully',
    signedAt: new Date().toISOString(),
    signatureUrl,
  });
});
