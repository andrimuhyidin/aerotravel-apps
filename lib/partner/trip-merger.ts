/**
 * Trip Merger Logic
 * Merge multiple bookings into one
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type BookingMergeRequest = {
  bookingIds: string[];
  mergeInto: string; // ID of booking to merge into
};

export type MergedBooking = {
  id: string;
  bookingCode: string;
  totalPax: number;
  totalAmount: number;
  mergedFrom: string[]; // IDs of merged bookings
};

/**
 * Validate bookings can be merged
 */
export async function validateBookingMerge(
  bookingIds: string[],
  userId: string
): Promise<{
  canMerge: boolean;
  reason?: string;
  bookings?: Array<{
    id: string;
    bookingCode: string;
    packageId: string;
    tripDate: string;
    status: string;
    adultPax: number;
    childPax: number;
    infantPax: number;
    totalAmount: number;
  }>;
}> {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    if (bookingIds.length < 2) {
      return { canMerge: false, reason: 'Minimal 2 bookings untuk merge' };
    }

    // Get all bookings
    const { data: bookings, error } = await client
      .from('bookings')
      .select(`
        id,
        booking_code,
        package_id,
        trip_date,
        status,
        adult_pax,
        child_pax,
        infant_pax,
        total_amount,
        mitra_id
      `)
      .in('id', bookingIds)
      .is('deleted_at', null);

    if (error || !bookings || bookings.length !== bookingIds.length) {
      return { canMerge: false, reason: 'Beberapa bookings tidak ditemukan' };
    }

    // Verify all bookings belong to user
    const allBelongToUser = bookings.every((b: unknown) => {
      const booking = b as { mitra_id: string };
      return booking.mitra_id === userId;
    });

    if (!allBelongToUser) {
      return { canMerge: false, reason: 'Tidak semua bookings milik Anda' };
    }

    // Check status - only draft, pending_payment, confirmed can be merged
    const validStatuses = ['draft', 'pending_payment', 'confirmed'];
    const invalidBookings = bookings.filter((b: unknown) => {
      const booking = b as { status: string };
      return !validStatuses.includes(booking.status);
    });

    if (invalidBookings.length > 0) {
      return {
        canMerge: false,
        reason: 'Beberapa bookings memiliki status yang tidak bisa di-merge (hanya draft, pending_payment, atau confirmed)',
      };
    }

    // Check same package and trip date
    const firstBooking = bookings[0] as {
      package_id: string;
      trip_date: string;
    };
    const samePackage = bookings.every((b: unknown) => {
      const booking = b as { package_id: string };
      return booking.package_id === firstBooking.package_id;
    });

    if (!samePackage) {
      return { canMerge: false, reason: 'Semua bookings harus untuk package yang sama' };
    }

    const sameDate = bookings.every((b: unknown) => {
      const booking = b as { trip_date: string };
      return booking.trip_date === firstBooking.trip_date;
    });

    if (!sameDate) {
      return { canMerge: false, reason: 'Semua bookings harus untuk tanggal trip yang sama' };
    }

    return {
      canMerge: true,
      bookings: bookings.map((b: unknown) => {
        const booking = b as {
          id: string;
          booking_code: string;
          package_id: string;
          trip_date: string;
          status: string;
          adult_pax: number;
          child_pax: number;
          infant_pax: number;
          total_amount: number;
        };
        return {
          id: booking.id,
          bookingCode: booking.booking_code,
          packageId: booking.package_id,
          tripDate: booking.trip_date,
          status: booking.status,
          adultPax: booking.adult_pax,
          childPax: booking.child_pax,
          infantPax: booking.infant_pax,
          totalAmount: Number(booking.total_amount),
        };
      }),
    };
  } catch (error) {
    logger.error('Failed to validate booking merge', error);
    return { canMerge: false, reason: 'Error saat validasi merge' };
  }
}

/**
 * Merge bookings
 */
export async function mergeBookings(
  bookingIds: string[],
  mergeIntoId: string,
  userId: string
): Promise<{
  success: boolean;
  mergedBookingId?: string;
  message: string;
}> {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    // Validate merge
    const validation = await validateBookingMerge(bookingIds, userId);
    if (!validation.canMerge || !validation.bookings) {
      return { success: false, message: validation.reason || 'Tidak bisa merge bookings' };
    }

    // Ensure mergeIntoId is in bookingIds
    if (!bookingIds.includes(mergeIntoId)) {
      return { success: false, message: 'Booking target merge tidak ada dalam list' };
    }

    // Get target booking
    const targetBooking = validation.bookings.find((b) => b.id === mergeIntoId);
    if (!targetBooking) {
      return { success: false, message: 'Booking target tidak ditemukan' };
    }

    // Calculate merged totals
    const totalAdultPax = validation.bookings.reduce((sum, b) => sum + b.adultPax, 0);
    const totalChildPax = validation.bookings.reduce((sum, b) => sum + b.childPax, 0);
    const totalInfantPax = validation.bookings.reduce((sum, b) => sum + b.infantPax, 0);
    const totalAmount = validation.bookings.reduce((sum, b) => sum + b.totalAmount, 0);

    // Get other bookings to merge (exclude target)
    const otherBookingIds = bookingIds.filter((id) => id !== mergeIntoId);

    // Update target booking dengan merged totals
    const { error: updateError } = await client
      .from('bookings')
      .update({
        adult_pax: totalAdultPax,
        child_pax: totalChildPax,
        infant_pax: totalInfantPax,
        total_amount: totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mergeIntoId);

    if (updateError) {
      logger.error('Failed to update target booking', updateError);
      return { success: false, message: 'Gagal update booking target' };
    }

    // Mark other bookings as merged (soft delete atau status merged)
    // Option 1: Soft delete
    const { error: deleteError } = await client
      .from('bookings')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'merged',
        updated_at: new Date().toISOString(),
      })
      .in('id', otherBookingIds);

    if (deleteError) {
      logger.error('Failed to mark bookings as merged', deleteError);
      // Rollback target booking update? Or continue?
      return { success: false, message: 'Gagal mark bookings sebagai merged' };
    }

    // Create merge record (optional - untuk tracking)
    // We could create a merge_history table, but for now we'll just use deleted_at

    logger.info('Bookings merged', {
      mergeIntoId,
      mergedBookingIds: otherBookingIds,
      userId,
    });

    return {
      success: true,
      mergedBookingId: mergeIntoId,
      message: `Berhasil merge ${otherBookingIds.length} bookings ke ${targetBooking.bookingCode}`,
    };
  } catch (error) {
    logger.error('Failed to merge bookings', error);
    return { success: false, message: 'Gagal merge bookings' };
  }
}

