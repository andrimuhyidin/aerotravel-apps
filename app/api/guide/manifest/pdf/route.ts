/**
 * API: Download Manifest PDF
 * GET /api/guide/manifest/pdf?tripId=xxx - Download manifest as PDF
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { generateManifestPDF } from '@/lib/insurance/generate-manifest-file';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('tripId');

  if (!tripId) {
    return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify guide assignment
  const { data: assignment } = await client
    .from('trip_guides')
    .select('trip_id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!assignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch manifest data from existing endpoint logic
  const { data: trip } = await client
    .from('trips')
    .select('id, trip_code, trip_date, package:packages(name, destination)')
    .eq('id', tripId)
    .single();

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Get trip bookings
  const { data: tripBookings } = await client
    .from('trip_bookings')
    .select('booking_id')
    .eq('trip_id', tripId);

  const bookingIds = (tripBookings || []).map((tb: { booking_id: string }) => tb.booking_id);

  // Get passengers
  let passengers: Array<{
    name: string;
    phone?: string;
    idNumber?: string;
    emergencyContact?: string;
    notes?: string;
  }> = [];

  if (bookingIds.length > 0) {
    const { data: passengerRows } = await client
      .from('booking_passengers')
      .select('full_name, phone, id_number, emergency_contact, notes')
      .in('booking_id', bookingIds);

    passengers = (passengerRows || []).map((p: any) => ({
      name: p.full_name || '',
      phone: p.phone || undefined,
      idNumber: p.id_number || undefined,
      emergencyContact: p.emergency_contact || undefined,
      notes: p.notes || undefined,
    }));
  }

  // Generate PDF
  try {
    const pdfBuffer = await generateManifestPDF(
      passengers.map((p, idx) => ({
        no: idx + 1,
        name: p.name,
        idNumber: p.idNumber,
        phone: p.phone,
        emergencyContact: p.emergencyContact,
        notes: p.notes,
      })),
      trip.trip_date || '',
      {
        tripCode: trip.trip_code || undefined,
        tripName: (trip.package as { name?: string })?.name,
        destination: (trip.package as { destination?: string })?.destination,
      }
    );

    // Log manifest download
    try {
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await client.from('manifest_access_logs').insert({
        trip_id: tripId,
        guide_id: user.id,
        branch_id: branchContext.branchId,
        access_type: 'download',
        accessed_at: new Date().toISOString(),
        ip_address: clientIp !== 'unknown' ? clientIp : null,
        user_agent: userAgent,
        device_info: null,
        created_at: new Date().toISOString(),
      });
    } catch (auditError) {
      logger.warn('Failed to log manifest download', { error: auditError, tripId, guideId: user.id });
    }

    // Return PDF (convert Buffer to Uint8Array for NextResponse)
    const uint8Array = pdfBuffer instanceof Buffer ? new Uint8Array(pdfBuffer) : new Uint8Array(pdfBuffer);
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="manifest-${trip.trip_code || tripId}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Failed to generate manifest PDF', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
});

