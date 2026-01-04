/**
 * Customer Trip Live Tracking API
 * GET /api/user/trips/[id]/tracking - Get live tracking data for customer's trip
 *
 * Returns guide location, ETA, and breadcrumb trail for trips that are in progress
 * Security: Only customers with bookings in this trip can access
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ id: string }>;
};

type TrackingData = {
  guideLocation: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    lastUpdate: string;
  } | null;
  guideInfo: {
    name: string;
    phone: string;
  } | null;
  tripStatus: string;
  tripCode: string;
  meetingPoints: Array<{
    name: string;
    latitude: number;
    longitude: number;
    time: string;
  }>;
  breadcrumbTrail: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
  }>;
  eta: {
    minutes: number;
    distance: number;
  } | null;
  isLiveTrackingAvailable: boolean;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

/**
 * Estimate ETA based on distance (assuming average speed of 30 km/h in traffic)
 */
function estimateETA(distanceKm: number): number {
  const averageSpeedKmH = 30; // Conservative estimate for city traffic
  return Math.ceil((distanceKm / averageSpeedKmH) * 60); // Return minutes
}

export const GET = withErrorHandler(async (_request: NextRequest, context: RouteParams) => {
  const { id: tripId } = await context.params;

  logger.info('GET /api/user/trips/[id]/tracking', { tripId });

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // First, check if this is a booking ID (from my-trips) and get the trip
  // Verify ownership via customer_email OR created_by
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, trip_id, customer_email, trip_date, status')
    .eq('id', tripId)
    .or(`customer_email.eq.${user.email},created_by.eq.${user.id}`)
    .is('deleted_at', null)
    .single();

  let actualTripId = tripId;
  let isBookingId = false;

  if (booking) {
    // This is a booking ID
    isBookingId = true;
    if (booking.trip_id) {
      actualTripId = booking.trip_id;
    }
  }

  // Check if user has a booking for this trip
  const { data: tripBooking, error: bookingError } = await supabase
    .from('trip_bookings')
    .select(
      `
      id,
      trip_id,
      booking_id,
      trips (
        id,
        trip_code,
        trip_date,
        status,
        packages (
          id,
          meeting_points
        )
      ),
      bookings (
        id,
        customer_email
      )
    `
    )
    .eq(isBookingId ? 'booking_id' : 'trip_id', isBookingId ? tripId : actualTripId)
    .single();

  // If no trip_booking found but we have a valid booking, return limited data
  if (bookingError || !tripBooking) {
    // Check if trip exists via the booking
    if (booking && !booking.trip_id) {
      // Booking exists but no trip assigned yet
      return NextResponse.json({
        tracking: {
          guideLocation: null,
          guideInfo: null,
          tripStatus: booking.status,
          tripCode: '',
          meetingPoints: [],
          breadcrumbTrail: [],
          eta: null,
          isLiveTrackingAvailable: false,
        } as TrackingData,
      });
    }

    logger.warn('Trip booking not found', { tripId, userId: user.id });
    return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 });
  }

  const tripData = tripBooking.trips as {
    id: string;
    trip_code: string;
    trip_date: string;
    status: string;
    packages: {
      id: string;
      meeting_points: Array<{ name: string; address: string; time: string; lat?: number; lng?: number }>;
    } | null;
  } | null;

  if (!tripData) {
    return NextResponse.json({ error: 'Trip data not found' }, { status: 404 });
  }

  // Check if live tracking should be available
  // Available from H-1 hour before trip until trip is completed
  const tripDate = new Date(tripData.trip_date);
  const now = new Date();
  const oneHourBefore = new Date(tripDate.getTime() - 60 * 60 * 1000);
  const isTrackingWindow =
    now >= oneHourBefore &&
    tripData.status !== 'completed' &&
    tripData.status !== 'cancelled';

  // Get guide location for this trip
  const { data: guideLocation, error: locationError } = await supabase
    .from('guide_locations')
    .select(
      `
      latitude,
      longitude,
      accuracy_meters,
      last_seen_at,
      is_online,
      guide:users (
        full_name,
        phone
      )
    `
    )
    .eq('trip_id', tripData.id)
    .eq('is_online', true)
    .order('last_seen_at', { ascending: false })
    .limit(1)
    .single();

  if (locationError && locationError.code !== 'PGRST116') {
    logger.error('Failed to fetch guide location', locationError);
  }

  // Get breadcrumb trail (last 50 GPS pings)
  const { data: gpsPings } = await supabase
    .from('gps_pings')
    .select('latitude, longitude, recorded_at')
    .eq('trip_id', tripData.id)
    .order('recorded_at', { ascending: false })
    .limit(50);

  // Process meeting points with coordinates
  const meetingPoints = (tripData.packages?.meeting_points || [])
    .filter((mp) => mp.lat && mp.lng)
    .map((mp) => ({
      name: mp.name,
      latitude: mp.lat as number,
      longitude: mp.lng as number,
      time: mp.time,
    }));

  // Calculate ETA if we have guide location and meeting points
  let eta: { minutes: number; distance: number } | null = null;
  if (guideLocation && meetingPoints.length > 0) {
    const firstMeetingPoint = meetingPoints[0];
    if (firstMeetingPoint) {
      const distance = calculateDistance(
        guideLocation.latitude,
        guideLocation.longitude,
        firstMeetingPoint.latitude,
        firstMeetingPoint.longitude
      );
      eta = {
        minutes: estimateETA(distance),
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      };
    }
  }

  const guideData = guideLocation?.guide as { full_name: string | null; phone: string | null } | null;

  const trackingData: TrackingData = {
    guideLocation: guideLocation
      ? {
          latitude: guideLocation.latitude,
          longitude: guideLocation.longitude,
          accuracy: guideLocation.accuracy_meters,
          lastUpdate: guideLocation.last_seen_at,
        }
      : null,
    guideInfo: guideData
      ? {
          name: guideData.full_name || 'Guide',
          phone: guideData.phone || '',
        }
      : null,
    tripStatus: tripData.status,
    tripCode: tripData.trip_code,
    meetingPoints,
    breadcrumbTrail: (gpsPings || [])
      .reverse() // Oldest first for trail
      .map((ping) => ({
        latitude: ping.latitude,
        longitude: ping.longitude,
        timestamp: ping.recorded_at,
      })),
    eta,
    isLiveTrackingAvailable: isTrackingWindow && guideLocation !== null,
  };

  return NextResponse.json({ tracking: trackingData });
});

