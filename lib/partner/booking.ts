/**
 * Partner Booking Service
 * Sesuai PRD 4.3.B - Partner Portal NTA Booking
 *
 * Features:
 * - Get packages with NTA pricing
 * - Create booking with wallet payment
 * - Booking history
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { debitWalletForBooking } from './wallet';

export type NTAPackage = {
  id: string;
  name: string;
  destination: string;
  duration: string;
  publishPrice: number;
  ntaPrice: number;
  margin: number; // Profit potential
  minPax: number;
  maxPax: number;
  availableDates: string[];
  thumbnailUrl?: string;
};

export type MitraBooking = {
  id: string;
  bookingCode: string;
  packageName: string;
  tripDate: string;
  totalPax: number;
  ntaTotal: number;
  publishTotal: number;
  margin: number;
  status: string;
  customerName: string;
  createdAt: string;
};

export type CreateBookingData = {
  mitraId: string;
  packageId: string;
  tripDate: string;
  adultPax: number;
  childPax: number;
  infantPax: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: 'wallet' | 'invoice';
  specialRequests?: string;
};

/**
 * Get package availability dates (client-side only)
 * Fetches available dates for a package (cached for 5 minutes)
 */
async function getPackageAvailability(
  packageId: string,
  days: number = 90
): Promise<string[]> {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    // Check cache first (5 minutes TTL)
    const cacheKey = `package_availability_${packageId}_${days}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        // 5 minutes = 300000 ms
        if (now - timestamp < 300000) {
          return data;
        }
      } catch (parseError) {
        // Invalid cache, remove it
        sessionStorage.removeItem(cacheKey);
      }
    }

    // Fetch from API
    const response = await fetch(
      `/api/partner/packages/${packageId}/availability?days=${days}`
    );

    if (!response.ok) {
      logger.warn('Failed to fetch availability', {
        packageId,
        status: response.status,
      });
      return [];
    }

    const result = await response.json();
    const availableDates =
      result.availability
        ?.filter((a: { isAvailable: boolean }) => a.isAvailable)
        .map((a: { date: string }) => a.date) || [];

    // Cache the result
    try {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({ data: availableDates, timestamp: Date.now() })
      );
    } catch (cacheError) {
      // SessionStorage might be full or unavailable, ignore
      logger.warn('Failed to cache availability', {
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }

    return availableDates;
  } catch (error) {
    logger.error('Failed to get package availability', error, { packageId });
    return [];
  }
}

/**
 * Get packages with NTA pricing for mitra
 */
export async function getNTAPackages(_mitraId: string): Promise<NTAPackage[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('packages')
    .select(
      `
      id,
      name,
      destination,
      duration_days,
      thumbnail_url,
      prices:package_prices(
        min_pax,
        max_pax,
        price_publish,
        price_nta
      )
    `
    )
    .eq('is_active', true)
    .eq('show_to_mitra', true);

  if (error) {
    logger.error('Failed to get NTA packages', error);
    return [];
  }

  // Fetch availability for all packages in parallel (with limit to avoid too many requests)
  const packagesWithAvailability = await Promise.all(
    data.map(async (pkg) => {
      // Get base price tier (2 pax default)
      const baseTier =
        pkg.prices?.find(
          (p: { min_pax: number; max_pax: number }) =>
            p.min_pax <= 2 && p.max_pax >= 2
        ) || pkg.prices?.[0];

      const publishPrice = Number(baseTier?.price_publish || 0);
      const ntaPrice = Number(baseTier?.price_nta || 0);

      // Fetch availability (non-blocking, will return empty array if fails)
      const availableDates = await getPackageAvailability(pkg.id, 90).catch(
        () => []
      );

      return {
        id: pkg.id,
        name: pkg.name,
        destination: pkg.destination,
        duration: `${pkg.duration_days} Hari`,
        publishPrice,
        ntaPrice,
        margin: publishPrice - ntaPrice,
        minPax: baseTier?.min_pax || 1,
        maxPax: baseTier?.max_pax || 50,
        availableDates,
        thumbnailUrl: pkg.thumbnail_url ?? undefined,
      };
    })
  );

  return packagesWithAvailability;
}

/**
 * Get mitra booking history
 */
export async function getMitraBookings(
  mitraId: string,
  limit: number = 20
): Promise<MitraBooking[]> {
  const supabase = createClient();

  const { data, error } = await supabase
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
      created_at,
      package:packages(name)
    `
    )
    .eq('mitra_id', mitraId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to get mitra bookings', error);
    return [];
  }

  return data.map((b) => ({
    id: b.id,
    bookingCode: b.booking_code,
    packageName: b.package?.name || '',
    tripDate: b.trip_date,
    totalPax: b.adult_pax + b.child_pax + b.infant_pax,
    ntaTotal: Number(b.nta_total),
    publishTotal: Number(b.total_amount),
    margin: Number(b.total_amount) - Number(b.nta_total),
    status: b.status,
    customerName: b.customer_name,
    createdAt: b.created_at || new Date().toISOString(),
  }));
}

/**
 * Create mitra booking
 */
export async function createMitraBooking(
  data: CreateBookingData
): Promise<{ success: boolean; bookingId?: string; message: string }> {
  const supabase = createClient();

  try {
    // Get package pricing
    const { data: pkg } = await supabase
      .from('packages')
      .select(
        `
        id,
        branch_id,
        prices:package_prices(
          min_pax,
          max_pax,
          price_publish,
          price_nta,
          price_child_percent
        )
      `
      )
      .eq('id', data.packageId)
      .single();

    if (!pkg) {
      return { success: false, message: 'Paket tidak ditemukan.' };
    }

    // Calculate pricing
    const totalAdult = data.adultPax;

    type PriceTier = {
      min_pax: number;
      max_pax: number;
      price_publish?: number;
      price_nta?: number;
    };

    const priceTier = (pkg.prices as unknown as PriceTier[])?.find(
      (p: PriceTier) =>
        p.min_pax <= totalAdult && p.max_pax >= totalAdult
    ) || (pkg.prices as unknown as PriceTier[])?.[0];

    if (!priceTier) {
      return {
        success: false,
        message: 'Harga tidak tersedia untuk jumlah pax ini.',
      };
    }

    const pricePerAdult = Number(priceTier.price_publish || 0);
    const ntaPricePerAdult = Number(priceTier.price_nta || 0);
    // Child discount - default 50%
    const childPercent = 0.5;

    const subtotal =
      data.adultPax * pricePerAdult +
      data.childPax * pricePerAdult * childPercent;
    const ntaTotal =
      data.adultPax * ntaPricePerAdult +
      data.childPax * ntaPricePerAdult * childPercent;

    // Generate booking code
    const { data: bookingCodeData } = await supabase.rpc(
      'generate_booking_code'
    );
    const bookingCode = bookingCodeData || `BK-${Date.now()}`;

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        branch_id: pkg.branch_id,
        package_id: data.packageId,
        booking_code: bookingCode,
        trip_date: data.tripDate,
        source: 'mitra',
        mitra_id: data.mitraId,
        adult_pax: data.adultPax,
        child_pax: data.childPax,
        infant_pax: data.infantPax,
        price_per_adult: pricePerAdult,
        price_per_child: pricePerAdult * childPercent,
        subtotal: subtotal,
        total_amount: subtotal,
        nta_price_per_adult: ntaPricePerAdult,
        nta_total: ntaTotal,
        status: data.paymentMethod === 'wallet' ? 'paid' : 'pending_payment',
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail,
        special_requests: data.specialRequests,
      })
      .select('id')
      .single();

    if (bookingError) {
      logger.error('Create booking failed', bookingError);
      return { success: false, message: 'Gagal membuat booking.' };
    }

    // Process wallet payment if selected
    if (data.paymentMethod === 'wallet') {
      const walletResult = await debitWalletForBooking(
        data.mitraId,
        booking.id,
        ntaTotal // Mitra pays NTA price
      );

      if (!walletResult.success) {
        // Rollback booking
        await supabase.from('bookings').delete().eq('id', booking.id);
        return { success: false, message: walletResult.message };
      }
    }

    return {
      success: true,
      bookingId: booking.id,
      message: 'Booking berhasil dibuat.',
    };
  } catch (error) {
    logger.error('Create mitra booking error', error);
    return { success: false, message: 'Terjadi kesalahan.' };
  }
}

/**
 * Get booking detail for mitra
 */
export async function getMitraBookingDetail(
  bookingId: string,
  mitraId: string
): Promise<MitraBooking | null> {
  const supabase = createClient();

  const { data, error } = await supabase
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
      created_at,
      package:packages(name)
    `
    )
    .eq('id', bookingId)
    .eq('mitra_id', mitraId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    bookingCode: data.booking_code,
    packageName: data.package?.name || '',
    tripDate: data.trip_date,
    totalPax: data.adult_pax + data.child_pax + data.infant_pax,
    ntaTotal: Number(data.nta_total),
    publishTotal: Number(data.total_amount),
    margin: Number(data.total_amount) - Number(data.nta_total),
    status: data.status,
    customerName: data.customer_name,
    createdAt: data.created_at || new Date().toISOString(),
  };
}
