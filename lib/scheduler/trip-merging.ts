/**
 * Trip Merging Logic - Konsolidasi Open Trip
 * PRD 4.4.B - Trip Merging (Konsolidasi Open Trip)
 */

// Local type definitions for trip merging
// These match the database schema for trips and bookings tables

export type TripSchedule = {
  id: string;
  trip_code: string;
  package_id: string;
  branch_id?: string;
  trip_date: string;
  start_date?: string;
  end_date?: string;
  status: string;
  max_pax?: number;
  available_slots?: number;
  created_at?: string;
  updated_at?: string;
  packages?: {
    id: string;
    name: string;
    destination?: string;
  };
};

export type Booking = {
  id: string;
  booking_code?: string;
  code?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  package_id?: string;
  trip_id?: string;
  trip_date?: string;
  adult_pax?: number;
  child_pax?: number;
  infant_pax?: number;
  total_pax?: number;
  total_amount?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type MergeCandidate = {
  tripId: string;
  packageId: string;
  packageName: string;
  startDate: string;
  endDate: string;
  currentPax: number;
  maxPax: number;
  availableSlots: number;
  bookings: {
    id: string;
    code: string;
    paxCount: number;
    customerName: string;
  }[];
};

export type MergeResult = {
  success: boolean;
  targetTripId: string;
  mergedBookingIds: string[];
  totalPax: number;
  message: string;
};

export type MergeValidation = {
  canMerge: boolean;
  reason?: string;
  availableSlots: number;
  requestedPax: number;
};

/**
 * Find open trips that can accept more bookings
 */
export function findMergeCandidates(
  trips: TripSchedule[],
  bookings: Booking[],
  packageId: string,
  targetDate: string,
  flexDays: number = 3
): MergeCandidate[] {
  const targetDateObj = new Date(targetDate);
  const minDate = new Date(targetDateObj);
  minDate.setDate(minDate.getDate() - flexDays);
  const maxDate = new Date(targetDateObj);
  maxDate.setDate(maxDate.getDate() + flexDays);

  const candidates: MergeCandidate[] = [];

  for (const trip of trips) {
    // Must be same package
    if (trip.package_id !== packageId) continue;

    // Must be open trip status
    if (trip.status !== 'open' && trip.status !== 'confirmed') continue;

    // Check date range
    const tripStart = new Date(trip.start_date);
    if (tripStart < minDate || tripStart > maxDate) continue;

    // Calculate current pax
    const tripBookings = bookings.filter(
      (b) => b.trip_schedule_id === trip.id && b.status !== 'cancelled'
    );
    const currentPax = tripBookings.reduce(
      (sum, b) => sum + (b.pax_count || 0),
      0
    );
    const maxPax = trip.max_pax || 20;
    const availableSlots = maxPax - currentPax;

    if (availableSlots > 0) {
      candidates.push({
        tripId: trip.id,
        packageId: trip.package_id ?? '',
        packageName: '', // Will be filled by caller
        startDate: trip.start_date,
        endDate: trip.end_date,
        currentPax,
        maxPax,
        availableSlots,
        bookings: tripBookings.map((b) => ({
          id: b.id,
          code: b.booking_code,
          paxCount: b.pax_count || 0,
          customerName: '', // Will be filled by caller
        })),
      });
    }
  }

  // Sort by date (closest first), then by available slots (most first)
  return candidates.sort((a, b) => {
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    const targetTime = targetDateObj.getTime();

    const diffA = Math.abs(dateA - targetTime);
    const diffB = Math.abs(dateB - targetTime);

    if (diffA !== diffB) return diffA - diffB;
    return b.availableSlots - a.availableSlots;
  });
}

/**
 * Validate if booking can be merged into target trip
 */
export function validateMerge(
  targetTrip: MergeCandidate,
  bookingPax: number
): MergeValidation {
  if (targetTrip.availableSlots < bookingPax) {
    return {
      canMerge: false,
      reason: `Tidak cukup slot. Tersedia: ${targetTrip.availableSlots}, Dibutuhkan: ${bookingPax}`,
      availableSlots: targetTrip.availableSlots,
      requestedPax: bookingPax,
    };
  }

  return {
    canMerge: true,
    availableSlots: targetTrip.availableSlots,
    requestedPax: bookingPax,
  };
}

/**
 * Calculate optimal trip consolidation
 * Groups bookings by package and date to suggest merges
 */
export function suggestConsolidation(
  bookings: Booking[],
  trips: TripSchedule[],
  minPaxThreshold: number = 5
): {
  packageId: string;
  date: string;
  totalPax: number;
  bookingCount: number;
  suggestion: 'merge' | 'create_new' | 'wait';
  targetTripId?: string;
}[] {
  // Group pending bookings by package and date
  const pendingBookings = bookings.filter(
    (b) => b.status === 'pending' && !b.trip_schedule_id
  );

  const groups = new Map<
    string,
    { packageId: string; date: string; pax: number; count: number }
  >();

  for (const booking of pendingBookings) {
    const key = `${booking.package_id}-${booking.departure_date}`;
    const existing = groups.get(key);

    if (existing) {
      existing.pax += booking.pax_count || 0;
      existing.count += 1;
    } else {
      groups.set(key, {
        packageId: booking.package_id ?? '',
        date: booking.departure_date ?? '',
        pax: booking.pax_count || 0,
        count: 1,
      });
    }
  }

  const suggestions: ReturnType<typeof suggestConsolidation> = [];

  for (const group of groups.values()) {
    // Find existing open trips
    const candidates = findMergeCandidates(
      trips,
      bookings,
      group.packageId,
      group.date,
      0
    );

    if (candidates.length > 0 && candidates[0]!.availableSlots >= group.pax) {
      suggestions.push({
        packageId: group.packageId,
        date: group.date,
        totalPax: group.pax,
        bookingCount: group.count,
        suggestion: 'merge',
        targetTripId: candidates[0]!.tripId,
      });
    } else if (group.pax >= minPaxThreshold) {
      suggestions.push({
        packageId: group.packageId,
        date: group.date,
        totalPax: group.pax,
        bookingCount: group.count,
        suggestion: 'create_new',
      });
    } else {
      suggestions.push({
        packageId: group.packageId,
        date: group.date,
        totalPax: group.pax,
        bookingCount: group.count,
        suggestion: 'wait',
      });
    }
  }

  return suggestions;
}

/**
 * Calculate fill rate for trip
 */
export function calculateFillRate(currentPax: number, maxPax: number): number {
  if (maxPax <= 0) return 0;
  return Math.round((currentPax / maxPax) * 100);
}

/**
 * Check if trip should be auto-confirmed based on fill rate
 */
export function shouldAutoConfirm(
  currentPax: number,
  maxPax: number,
  minFillRate: number = 60
): boolean {
  return calculateFillRate(currentPax, maxPax) >= minFillRate;
}
