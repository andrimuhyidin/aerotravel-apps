/**
 * Real-time Package Availability Checker
 * Checks availability based on bookings, capacity, and date ranges
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export interface AvailabilityCheck {
  packageId: string;
  date: Date;
  paxCount?: {
    adult?: number;
    child?: number;
    infant?: number;
  };
}

export interface AvailabilityResult {
  available: boolean;
  remainingSlots: number;
  maxCapacity: number;
  bookedSlots: number;
  waitlistAvailable: boolean;
  nextAvailableDate: Date | null;
  priceInfo?: {
    basePrice: number;
    surcharge?: number;
    discount?: number;
    finalPrice: number;
  };
  restrictions?: string[];
  blackoutDates?: Date[];
}

/**
 * Check if a package is available for booking on a specific date
 */
export async function checkPackageAvailability(
  check: AvailabilityCheck
): Promise<AvailabilityResult> {
  try {
    const supabase = await createClient();

    // 1. Get package details
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select(`
        *,
        package_prices (
          tier,
          min_pax,
          max_pax,
          price_nta,
          price_publish
        )
      `)
      .eq('id', check.packageId)
      .eq('status', 'published')
      .single();

    if (packageError || !packageData) {
      logger.error('Package not found', packageError);
      return createUnavailableResult('Package not found or inactive');
    }

    const totalPax =
      (check.paxCount?.adult || 0) +
      (check.paxCount?.child || 0) +
      (check.paxCount?.infant || 0);

    // 2. Check date validity
    const targetDate = new Date(check.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      return createUnavailableResult('Date has passed', {
        nextAvailableDate: today,
      });
    }

    // Check package date range
    if (packageData.start_date) {
      const startDate = new Date(packageData.start_date);
      if (targetDate < startDate) {
        return createUnavailableResult('Package not yet available', {
          nextAvailableDate: startDate,
        });
      }
    }

    if (packageData.end_date) {
      const endDate = new Date(packageData.end_date);
      if (targetDate > endDate) {
        return createUnavailableResult('Package no longer available');
      }
    }

    // 3. Check blackout dates
    const blackoutDates = packageData.blackout_dates || [];
    const isBlackout = blackoutDates.some((date: string) => {
      const blackoutDate = new Date(date);
      return (
        blackoutDate.getFullYear() === targetDate.getFullYear() &&
        blackoutDate.getMonth() === targetDate.getMonth() &&
        blackoutDate.getDate() === targetDate.getDate()
      );
    });

    if (isBlackout) {
      const nextAvailable = findNextAvailableDate(targetDate, blackoutDates);
      return createUnavailableResult('Date is in blackout period', {
        nextAvailableDate: nextAvailable,
      });
    }

    // 4. Check capacity (if package has max capacity)
    const maxCapacity = packageData.max_capacity || 999; // Default to unlimited

    // Count confirmed bookings on this date
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('adult_pax, child_pax, infant_pax')
      .eq('package_id', check.packageId)
      .lte('departure_date', targetDate.toISOString())
      .gte('return_date', targetDate.toISOString())
      .in('status', ['pending', 'paid', 'confirmed', 'ongoing']);

    if (bookingsError) {
      logger.error('Error checking bookings', bookingsError);
    }

    const bookedSlots = (bookings || []).reduce(
      (total, booking) =>
        total +
        (booking.adult_pax || 0) +
        (booking.child_pax || 0) +
        (booking.infant_pax || 0),
      0
    );

    const remainingSlots = maxCapacity - bookedSlots;
    const available = remainingSlots >= totalPax;

    // 5. Calculate pricing
    const prices = packageData.package_prices || [];
    const applicablePrice = findApplicablePricing(prices, totalPax);

    const priceInfo = applicablePrice
      ? {
          basePrice: applicablePrice.price_publish,
          surcharge: 0,
          discount: 0,
          finalPrice: applicablePrice.price_publish * totalPax,
        }
      : undefined;

    // 6. Check for dynamic pricing (weekend/holiday surcharge)
    const restrictions: string[] = [];
    if (packageData.min_booking_days && packageData.min_booking_days > 0) {
      const daysDiff = Math.ceil(
        (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff < packageData.min_booking_days) {
        restrictions.push(
          `Minimum booking ${packageData.min_booking_days} hari sebelum keberangkatan`
        );
      }
    }

    if (packageData.max_booking_days && packageData.max_booking_days > 0) {
      const daysDiff = Math.ceil(
        (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff > packageData.max_booking_days) {
        restrictions.push(
          `Maksimum booking ${packageData.max_booking_days} hari sebelumnya`
        );
      }
    }

    return {
      available,
      remainingSlots,
      maxCapacity,
      bookedSlots,
      waitlistAvailable: !available && remainingSlots > -10, // Allow waitlist if not too overbooked
      nextAvailableDate: available ? null : findNextAvailableDate(targetDate, blackoutDates),
      priceInfo,
      restrictions: restrictions.length > 0 ? restrictions : undefined,
      blackoutDates: blackoutDates.map((d: string) => new Date(d)),
    };
  } catch (error) {
    logger.error('Error checking availability', error, { check });
    return createUnavailableResult('System error');
  }
}

/**
 * Check availability for multiple dates (for calendar view)
 */
export async function checkMultipleDatesAvailability(
  packageId: string,
  startDate: Date,
  endDate: Date
): Promise<Map<string, AvailabilityResult>> {
  const results = new Map<string, AvailabilityResult>();
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const result = await checkPackageAvailability({
      packageId,
      date: new Date(currentDate),
      paxCount: { adult: 1 }, // Default check for 1 adult
    });

    results.set(dateKey || '', result);

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return results;
}

/**
 * Get next N available dates for a package
 */
export async function getNextAvailableDates(
  packageId: string,
  count: number = 5
): Promise<Date[]> {
  const availableDates: Date[] = [];
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  let attempts = 0;
  const maxAttempts = 90; // Check up to 90 days ahead

  while (availableDates.length < count && attempts < maxAttempts) {
    const result = await checkPackageAvailability({
      packageId,
      date: new Date(currentDate),
      paxCount: { adult: 1 },
    });

    if (result.available) {
      availableDates.push(new Date(currentDate));
    }

    currentDate.setDate(currentDate.getDate() + 1);
    attempts++;
  }

  return availableDates;
}

// =====================================================
// Helper Functions
// =====================================================

function createUnavailableResult(
  reason: string,
  overrides: Partial<AvailabilityResult> = {}
): AvailabilityResult {
  return {
    available: false,
    remainingSlots: 0,
    maxCapacity: 0,
    bookedSlots: 0,
    waitlistAvailable: false,
    nextAvailableDate: null,
    restrictions: [reason],
    ...overrides,
  };
}

function findApplicablePricing(
  prices: Array<{
    tier: string;
    min_pax: number;
    max_pax: number;
    price_nta: number;
    price_publish: number;
  }>,
  paxCount: number
) {
  // Sort by min_pax descending to find best tier
  const sorted = [...prices].sort((a, b) => b.min_pax - a.min_pax);

  for (const price of sorted) {
    if (paxCount >= price.min_pax && paxCount <= price.max_pax) {
      return price;
    }
  }

  // Fallback to first tier if no match
  return sorted[sorted.length - 1] || null;
}

function findNextAvailableDate(currentDate: Date, blackoutDates: string[]): Date | null {
  const next = new Date(currentDate);
  next.setDate(next.getDate() + 1);

  // Check next 30 days
  for (let i = 0; i < 30; i++) {
    const isBlackout = blackoutDates.some((date) => {
      const blackoutDate = new Date(date);
      return (
        blackoutDate.getFullYear() === next.getFullYear() &&
        blackoutDate.getMonth() === next.getMonth() &&
        blackoutDate.getDate() === next.getDate()
      );
    });

    if (!isBlackout) {
      return next;
    }

    next.setDate(next.getDate() + 1);
  }

  return null;
}

/**
 * Check if a date is weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Indonesian National Holidays
 * Includes fixed holidays and major religious holidays (dates may vary by year)
 * Format: 'YYYY-MM-DD'
 */
const INDONESIAN_HOLIDAYS: Record<number, string[]> = {
  2025: [
    '2025-01-01', // Tahun Baru Masehi
    '2025-01-29', // Tahun Baru Imlek 2576
    '2025-03-29', // Hari Raya Nyepi
    '2025-03-30', // Hari Raya Idul Fitri 1446 H (cuti bersama)
    '2025-03-31', // Hari Raya Idul Fitri 1446 H
    '2025-04-01', // Hari Raya Idul Fitri 1446 H
    '2025-04-18', // Wafat Isa Almasih
    '2025-05-01', // Hari Buruh Internasional
    '2025-05-12', // Hari Raya Waisak 2569
    '2025-05-29', // Kenaikan Isa Almasih
    '2025-06-01', // Hari Lahir Pancasila
    '2025-06-06', // Hari Raya Idul Adha 1446 H
    '2025-06-27', // Tahun Baru Islam 1447 H
    '2025-08-17', // Hari Kemerdekaan RI
    '2025-09-05', // Maulid Nabi Muhammad SAW
    '2025-12-25', // Hari Raya Natal
  ],
  2026: [
    '2026-01-01', // Tahun Baru Masehi
    '2026-02-17', // Tahun Baru Imlek 2577
    '2026-03-19', // Hari Raya Nyepi
    '2026-03-20', // Hari Raya Idul Fitri 1447 H (cuti bersama)
    '2026-03-21', // Hari Raya Idul Fitri 1447 H
    '2026-03-22', // Hari Raya Idul Fitri 1447 H
    '2026-04-03', // Wafat Isa Almasih
    '2026-05-01', // Hari Buruh Internasional
    '2026-05-13', // Kenaikan Isa Almasih
    '2026-05-31', // Hari Raya Waisak 2570
    '2026-05-27', // Hari Raya Idul Adha 1447 H
    '2026-06-01', // Hari Lahir Pancasila
    '2026-06-16', // Tahun Baru Islam 1448 H
    '2026-08-17', // Hari Kemerdekaan RI
    '2026-08-26', // Maulid Nabi Muhammad SAW
    '2026-12-25', // Hari Raya Natal
  ],
  2027: [
    '2027-01-01', // Tahun Baru Masehi
    '2027-02-06', // Tahun Baru Imlek 2578
    '2027-03-09', // Hari Raya Nyepi
    '2027-03-10', // Hari Raya Idul Fitri 1448 H
    '2027-03-11', // Hari Raya Idul Fitri 1448 H
    '2027-03-26', // Wafat Isa Almasih
    '2027-05-01', // Hari Buruh Internasional
    '2027-05-06', // Kenaikan Isa Almasih
    '2027-05-16', // Hari Raya Idul Adha 1448 H
    '2027-05-20', // Hari Raya Waisak 2571
    '2027-06-01', // Hari Lahir Pancasila
    '2027-06-06', // Tahun Baru Islam 1449 H
    '2027-08-15', // Maulid Nabi Muhammad SAW
    '2027-08-17', // Hari Kemerdekaan RI
    '2027-12-25', // Hari Raya Natal
  ],
};

/**
 * Check if a date is Indonesian holiday
 * Checks against a predefined list of national holidays
 */
export function isHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const dateStr = date.toISOString().split('T')[0];
  
  // Check if we have holidays for this year
  const yearHolidays = INDONESIAN_HOLIDAYS[year];
  if (!yearHolidays) {
    // For years not in our list, only check fixed holidays
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Fixed holidays (same date every year)
    if (month === 1 && day === 1) return true;  // Tahun Baru
    if (month === 5 && day === 1) return true;  // Hari Buruh
    if (month === 6 && day === 1) return true;  // Hari Lahir Pancasila
    if (month === 8 && day === 17) return true; // Kemerdekaan RI
    if (month === 12 && day === 25) return true; // Natal
    
    return false;
  }
  
  return yearHolidays.includes(dateStr || '');
}

/**
 * Calculate surcharge based on date
 */
export function calculateDateSurcharge(date: Date, baseSurcharge: number = 0): number {
  let surcharge = baseSurcharge;

  if (isWeekend(date)) {
    surcharge += 0.15; // 15% weekend surcharge
  }

  if (isHoliday(date)) {
    surcharge += 0.25; // 25% holiday surcharge
  }

  return surcharge;
}

