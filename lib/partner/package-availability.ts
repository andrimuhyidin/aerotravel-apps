/**
 * Package Availability Utility
 * Functions to check and summarize package availability
 */

export type AvailabilityStatus = 'available' | 'limited' | 'sold_out';

export type PackageAvailabilitySummary = {
  status: AvailabilityStatus;
  nextAvailableDate: string | null;
  availableDatesCount: number;
  totalDatesChecked: number;
};

/**
 * Determine availability status based on available dates count
 */
function determineAvailabilityStatus(
  availableDatesCount: number,
  totalDatesChecked: number
): AvailabilityStatus {
  if (availableDatesCount === 0) {
    return 'sold_out';
  }
  if (availableDatesCount < totalDatesChecked * 0.3) {
    // Less than 30% of dates available
    return 'limited';
  }
  return 'available';
}

/**
 * Get quick availability summary for a package (next 30 days)
 * Returns status, next available date, and count
 */
export async function getPackageAvailabilitySummary(
  client: any,
  packageId: string,
  days: number = 30
): Promise<PackageAvailabilitySummary> {
  try {
    // Get package info
    const { data: packageData, error: pkgError } = await client
      .from('packages')
      .select('id, name, max_capacity_per_date')
      .eq('id', packageId)
      .single();

    if (pkgError || !packageData) {
      return {
        status: 'sold_out',
        nextAvailableDate: null,
        availableDatesCount: 0,
        totalDatesChecked: days,
      };
    }

    // Calculate date range (next N days from today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    // Get existing bookings for this package in date range
    const { data: bookings, error: bookingsError } = await client
      .from('bookings')
      .select('trip_date, adult_pax, child_pax, infant_pax, status')
      .eq('package_id', packageId)
      .gte('trip_date', today.toISOString().split('T')[0])
      .lte('trip_date', endDate.toISOString().split('T')[0])
      .in('status', ['pending_payment', 'confirmed', 'paid', 'ongoing']);

    if (bookingsError) {
      return {
        status: 'sold_out',
        nextAvailableDate: null,
        availableDatesCount: 0,
        totalDatesChecked: days,
      };
    }

    // Get existing trips (open/confirmed) for this package
    const { data: trips, error: tripsError } = await client
      .from('trips')
      .select('id, start_date, max_pax, status')
      .eq('package_id', packageId)
      .gte('start_date', today.toISOString().split('T')[0])
      .lte('start_date', endDate.toISOString().split('T')[0])
      .in('status', ['open', 'confirmed']);

    if (tripsError) {
      return {
        status: 'sold_out',
        nextAvailableDate: null,
        availableDatesCount: 0,
        totalDatesChecked: days,
      };
    }

    // Calculate pax per date from bookings
    const paxPerDate = new Map<string, number>();
    const bookingsData = bookings || [];
    const tripsData = trips || [];

    for (const booking of bookingsData as Array<{
      trip_date: string;
      adult_pax: number;
      child_pax: number;
      infant_pax: number;
    }>) {
      const date = booking.trip_date;
      const totalPax =
        (booking.adult_pax || 0) +
        (booking.child_pax || 0) +
        (booking.infant_pax || 0);
      const currentPax = paxPerDate.get(date) || 0;
      paxPerDate.set(date, currentPax + totalPax);
    }

    // Calculate available slots per date from trips
    const availableSlotsPerDate = new Map<string, number>();
    for (const trip of tripsData) {
      const date = trip.start_date;
      const maxPax = trip.max_pax || packageData.max_capacity_per_date || 20;
      const currentPax = paxPerDate.get(date) || 0;
      const availableSlots = Math.max(0, maxPax - currentPax);
      availableSlotsPerDate.set(date, availableSlots);
    }

    const maxCapacity = packageData.max_capacity_per_date || 20;
    const minPax = 1; // Default minimum pax for availability check

    // Check availability for each date
    const availableDates: string[] = [];
    let nextAvailableDate: string | null = null;

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0]!;

      const currentPax = paxPerDate.get(dateStr) || 0;
      const openTripAvailableSlots = availableSlotsPerDate.get(dateStr) || 0;
      const hasOpenTrip = tripsData.some(
        (t: { start_date: string }) => t.start_date === dateStr
      );

      // Available if:
      // 1. Has open trip with available slots >= minPax, OR
      // 2. Current pax + minPax <= max capacity
      const canMergeIntoOpenTrip = hasOpenTrip && openTripAvailableSlots >= minPax;
      const canCreateNewTrip = currentPax + minPax <= maxCapacity;

      const isAvailable = canMergeIntoOpenTrip || canCreateNewTrip;

      if (isAvailable) {
        availableDates.push(dateStr);
        if (!nextAvailableDate) {
          nextAvailableDate = dateStr;
        }
      }
    }

    const status = determineAvailabilityStatus(availableDates.length, days);

    return {
      status,
      nextAvailableDate,
      availableDatesCount: availableDates.length,
      totalDatesChecked: days,
    };
  } catch (error) {
    // Return sold_out on error
    return {
      status: 'sold_out',
      nextAvailableDate: null,
      availableDatesCount: 0,
      totalDatesChecked: days,
    };
  }
}

/**
 * Get availability summary for multiple packages in batch
 * Returns a map of packageId -> PackageAvailabilitySummary
 */
export async function getPackageAvailabilityBatch(
  client: any,
  packageIds: string[],
  days: number = 30
): Promise<Record<string, PackageAvailabilitySummary>> {
  if (!packageIds || packageIds.length === 0) {
    return {};
  }

  const result: Record<string, PackageAvailabilitySummary> = {};

  // Process in parallel with Promise.all for better performance
  const promises = packageIds.map(async (packageId) => {
    const summary = await getPackageAvailabilitySummary(client, packageId, days);
    return { packageId, summary };
  });

  try {
    const results = await Promise.all(promises);
    results.forEach(({ packageId, summary }) => {
      result[packageId] = summary;
    });
  } catch (error) {
    // If batch fails, return empty map
    // Individual packages will show as sold_out
  }

  return result;
}

