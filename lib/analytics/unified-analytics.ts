/**
 * Unified Analytics Service
 * Aggregate analytics metrics dari semua apps
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import type { AppType } from '@/lib/events/event-types';

export type BookingStatus =
  | 'draft'
  | 'pending_payment'
  | 'confirmed'
  | 'paid'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export type BookingTrend = {
  date: string;
  count: number;
  revenue: number;
};

export type RevenueTrend = {
  date: string;
  revenue: number;
  bookings: number;
};

export type UnifiedAnalytics = {
  bookings: {
    total: number;
    byApp: Record<AppType, number>;
    byStatus: Record<BookingStatus, number>;
    trends: BookingTrend[];
  };
  revenue: {
    total: number;
    byApp: Record<AppType, number>;
    trends: RevenueTrend[];
  };
  customers: {
    total: number;
    newCustomers: number;
    repeatCustomers: number;
  };
  packages: {
    popular: Array<{
      id: string;
      name: string;
      bookingCount: number;
      revenue: number;
    }>;
    availability: {
      totalPackages: number;
      availablePackages: number;
      soldOutPackages: number;
    };
  };
};

/**
 * Get unified analytics
 * Aggregates data dari semua apps
 */
export async function getUnifiedAnalytics(
  dateRange?: { start: string; end: string }
): Promise<UnifiedAnalytics> {
  const supabase = await createClient();

  try {
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = dateRange?.end || new Date().toISOString();

    // Get bookings
    const bookingsQuery = supabase
      .from('bookings')
      .select('id, source, status, total_amount, created_at, customer_id, package_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { data: bookings, error: bookingsError } = await bookingsQuery;

    if (bookingsError) {
      logger.error('[Unified Analytics] Failed to fetch bookings', bookingsError);
      throw bookingsError;
    }

    const bookingsData = bookings || [];

    // Calculate booking metrics
    const bookingsByApp: Record<AppType, number> = {
      customer: 0,
      partner: 0,
      guide: 0,
      admin: 0,
      corporate: 0,
    };

    const bookingsByStatus: Record<BookingStatus, number> = {
      draft: 0,
      pending_payment: 0,
      confirmed: 0,
      paid: 0,
      ongoing: 0,
      completed: 0,
      cancelled: 0,
    };

    bookingsData.forEach((booking: any) => {
      // Map source to app
      const app = booking.source === 'mitra' ? 'partner' : 'customer';
      bookingsByApp[app] = (bookingsByApp[app] || 0) + 1;

      // Count by status
      const status = booking.status as BookingStatus;
      if (status && bookingsByStatus[status] !== undefined) {
        bookingsByStatus[status] = (bookingsByStatus[status] || 0) + 1;
      }
    });

    // Calculate revenue
    const revenueByApp: Record<AppType, number> = {
      customer: 0,
      partner: 0,
      guide: 0,
      admin: 0,
      corporate: 0,
    };

    let totalRevenue = 0;
    bookingsData.forEach((booking: any) => {
      const amount = booking.total_amount || 0;
      totalRevenue += amount;
      const app = booking.source === 'mitra' ? 'partner' : 'customer';
      revenueByApp[app] = (revenueByApp[app] || 0) + amount;
    });

    // Calculate booking trends (daily)
    const trendsMap = new Map<string, { count: number; revenue: number }>();
    bookingsData.forEach((booking: any) => {
      const date = booking.created_at.split('T')[0]!;
      const existing = trendsMap.get(date) || { count: 0, revenue: 0 };
      trendsMap.set(date, {
        count: existing.count + 1,
        revenue: existing.revenue + (booking.total_amount || 0),
      });
    });

    const bookingTrends: BookingTrend[] = Array.from(trendsMap.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    const revenueTrends: RevenueTrend[] = bookingTrends.map((trend) => ({
      date: trend.date,
      revenue: trend.revenue,
      bookings: trend.count,
    }));

    // Get customer metrics
    const uniqueCustomers = new Set<string>();
    bookingsData.forEach((booking: any) => {
      if (booking.customer_id) {
        uniqueCustomers.add(booking.customer_id);
      }
    });

    // Get new customers (first booking in date range)
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('customer_id, created_at')
      .not('customer_id', 'is', null)
      .order('created_at', { ascending: true });

    const firstBookingMap = new Map<string, string>();
    allBookings?.forEach((booking: any) => {
      if (booking.customer_id && !firstBookingMap.has(booking.customer_id)) {
        firstBookingMap.set(booking.customer_id, booking.created_at);
      }
    });

    let newCustomers = 0;
    uniqueCustomers.forEach((customerId) => {
      const firstBookingDate = firstBookingMap.get(customerId);
      if (firstBookingDate && firstBookingDate >= startDate) {
        newCustomers++;
      }
    });

    // Get package metrics
    const packageBookingMap = new Map<string, { count: number; revenue: number }>();
    bookingsData.forEach((booking: any) => {
      if (booking.package_id) {
        const existing = packageBookingMap.get(booking.package_id) || { count: 0, revenue: 0 };
        packageBookingMap.set(booking.package_id, {
          count: existing.count + 1,
          revenue: existing.revenue + (booking.total_amount || 0),
        });
      }
    });

    // Get package names
    const packageIds = Array.from(packageBookingMap.keys());
    const { data: packages } = await supabase
      .from('packages')
      .select('id, name')
      .in('id', packageIds);

    const popularPackages = Array.from(packageBookingMap.entries())
      .map(([packageId, data]) => {
        const pkg = packages?.find((p: any) => p.id === packageId);
        return {
          id: packageId,
          name: pkg?.name || 'Unknown Package',
          bookingCount: data.count,
          revenue: data.revenue,
        };
      })
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 10);

    // Get package availability summary
    const { count: totalPackages } = await supabase
      .from('packages')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    return {
      bookings: {
        total: bookingsData.length,
        byApp: bookingsByApp,
        byStatus: bookingsByStatus,
        trends: bookingTrends,
      },
      revenue: {
        total: totalRevenue,
        byApp: revenueByApp,
        trends: revenueTrends,
      },
      customers: {
        total: uniqueCustomers.size,
        newCustomers,
        repeatCustomers: uniqueCustomers.size - newCustomers,
      },
      packages: {
        popular: popularPackages,
        availability: {
          totalPackages: totalPackages || 0,
          availablePackages: totalPackages || 0, // Simplified - should check actual availability
          soldOutPackages: 0, // Simplified
        },
      },
    };
  } catch (error) {
    logger.error('[Unified Analytics] Failed to get analytics', error, { dateRange });
    // Return empty analytics on error
    return {
      bookings: {
        total: 0,
        byApp: {
          customer: 0,
          partner: 0,
          guide: 0,
          admin: 0,
          corporate: 0,
        },
        byStatus: {
          draft: 0,
          pending_payment: 0,
          confirmed: 0,
          paid: 0,
          ongoing: 0,
          completed: 0,
          cancelled: 0,
        },
        trends: [],
      },
      revenue: {
        total: 0,
        byApp: {
          customer: 0,
          partner: 0,
          guide: 0,
          admin: 0,
          corporate: 0,
        },
        trends: [],
      },
      customers: {
        total: 0,
        newCustomers: 0,
        repeatCustomers: 0,
      },
      packages: {
        popular: [],
        availability: {
          totalPackages: 0,
          availablePackages: 0,
          soldOutPackages: 0,
        },
      },
    };
  }
}

