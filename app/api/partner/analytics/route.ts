/**
 * API: Partner Analytics Dashboard
 * GET /api/partner/analytics
 * 
 * Returns analytics data for partner dashboard
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30'; // '7', '30', '90', 'custom'
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const client = supabase as unknown as any;

  try {
    // Calculate date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate: Date;
    if (period === 'custom' && from && to) {
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
    } else {
      const days = parseInt(period) || 30;
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - days);
    }

    const endDate = period === 'custom' && to ? new Date(to) : today;
    endDate.setHours(23, 59, 59, 999);

    // Check if user is a partner (mitra) or partner team member
    const { data: userProfile, error: userProfileError } = await client
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (userProfileError) {
      logger.error('Failed to fetch user profile', userProfileError, {
        userId: user.id,
        errorMessage: userProfileError.message,
        errorDetails: userProfileError.details,
        errorHint: userProfileError.hint,
      });
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: userProfileError.message },
        { status: 500 }
      );
    }

    if (!userProfile) {
      logger.warn('User profile not found', { userId: user.id });
      // Return empty analytics instead of error
      return NextResponse.json({
        summary: {
          totalBookings: 0,
          totalRevenue: 0,
          totalCommission: 0,
          averageCommission: 0,
        },
        revenueTrend: [],
        topPackages: [],
        statusBreakdown: {},
      });
    }

    // Determine partner_id (mitra_id)
    let partnerId = user.id;
    
    // If user is not a mitra, check if they're a team member
    if (userProfile.role !== 'mitra') {
      const { data: partnerUser } = await client
        .from('partner_users')
        .select('partner_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .eq('is_active', true)
        .maybeSingle();

      if (partnerUser) {
        partnerId = partnerUser.partner_id;
      } else {
        // User is not a partner or team member - return empty analytics
        return NextResponse.json({
          summary: {
            totalBookings: 0,
            totalRevenue: 0,
            totalCommission: 0,
            averageCommission: 0,
          },
          revenueTrend: [],
          topPackages: [],
          statusBreakdown: {},
        });
      }
    }

    // Get bookings with commission data
    const { data: bookings, error: bookingsError } = await client
      .from('bookings')
      .select(`
        id,
        booking_code,
        trip_date,
        created_at,
        total_amount,
        nta_total,
        status,
        package_id
      `)
      .eq('mitra_id', partnerId)
      .is('deleted_at', null)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('status', ['paid', 'confirmed', 'ongoing', 'completed']);

    if (bookingsError) {
      logger.error('Failed to fetch bookings for analytics', bookingsError, {
        userId: user.id,
        partnerId,
        errorMessage: bookingsError.message,
        errorDetails: bookingsError.details,
        errorHint: bookingsError.hint,
      });
      // Return empty analytics instead of throwing error
      return NextResponse.json({
        summary: {
          totalBookings: 0,
          totalRevenue: 0,
          totalCommission: 0,
          averageCommission: 0,
        },
        revenueTrend: [],
        topPackages: [],
        statusBreakdown: {},
      });
    }

    const bookingsData = bookings || [];

    // Calculate metrics
    const totalRevenue = bookingsData.reduce(
      (sum: number, b: any) => sum + Number(b.total_amount || 0),
      0
    );
    const totalCommission = bookingsData.reduce(
      (sum: number, b: any) => sum + (Number(b.total_amount || 0) - Number(b.nta_total || 0)),
      0
    );
    const totalBookings = bookingsData.length;
    const averageCommission = totalBookings > 0 ? totalCommission / totalBookings : 0;

    // Revenue trend (daily) - current period
    const revenueTrend: Record<string, { date: string; revenue: number; commission: number; bookings: number }> = {};
    bookingsData.forEach((booking: any) => {
      const date = new Date(booking.created_at).toISOString().split('T')[0]!;
      if (!revenueTrend[date]) {
        revenueTrend[date] = { date, revenue: 0, commission: 0, bookings: 0 };
      }
      revenueTrend[date]!.revenue += Number(booking.total_amount || 0);
      revenueTrend[date]!.commission += (Number(booking.total_amount || 0) - Number(booking.nta_total || 0));
      revenueTrend[date]!.bookings += 1;
    });

    const revenueTrendArray = Object.values(revenueTrend).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    // Calculate previous period for comparison
    const previousPeriodDays = period === 'custom' && from && to
      ? Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24))
      : parseInt(period) || 30;
    
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - previousPeriodDays);
    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);
    previousEndDate.setHours(23, 59, 59, 999);

    // Get previous period bookings for comparison
    const { data: previousBookings } = await client
      .from('bookings')
      .select(`
        id,
        created_at,
        total_amount,
        nta_total,
        status
      `)
      .eq('mitra_id', partnerId)
      .is('deleted_at', null)
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', previousEndDate.toISOString())
      .in('status', ['paid', 'confirmed', 'ongoing', 'completed']);

    const previousBookingsData = previousBookings || [];
    const previousTotalRevenue = previousBookingsData.reduce(
      (sum: number, b: any) => sum + Number(b.total_amount || 0),
      0
    );
    const previousTotalCommission = previousBookingsData.reduce(
      (sum: number, b: any) => sum + (Number(b.total_amount || 0) - Number(b.nta_total || 0)),
      0
    );
    const previousTotalBookings = previousBookingsData.length;

    // Calculate percentage change
    const revenueChange = previousTotalRevenue > 0
      ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100
      : 0;
    const commissionChange = previousTotalCommission > 0
      ? ((totalCommission - previousTotalCommission) / previousTotalCommission) * 100
      : 0;
    const bookingsChange = previousTotalBookings > 0
      ? ((totalBookings - previousTotalBookings) / previousTotalBookings) * 100
      : 0;

    // Fetch package details separately
    const packageIds = [...new Set(bookingsData.map((b: any) => b.package_id).filter(Boolean))];
    let packagesMap: Record<string, { id: string; name: string; destination: string | null }> = {};
    
    if (packageIds.length > 0) {
      try {
        const { data: packages } = await client
          .from('packages')
          .select('id, name, destination')
          .in('id', packageIds);
        
        if (packages) {
          packagesMap = packages.reduce((acc: Record<string, any>, pkg: any) => {
            acc[pkg.id] = pkg;
            return acc;
          }, {});
        }
      } catch (packageError) {
        logger.warn('Failed to fetch package details for analytics', {
          packageIds: packageIds.length,
          error: packageError instanceof Error ? packageError.message : String(packageError),
        });
        // Continue without package names
      }
    }

    // Top packages by bookings
    const packageStats: Record<string, {
      packageName: string;
      bookingCount: number;
      revenue: number;
      commission: number;
    }> = {};

    bookingsData.forEach((booking: any) => {
      const packageInfo = packagesMap[booking.package_id];
      const packageName = packageInfo?.name || 'Unknown';
      if (!packageStats[packageName]) {
        packageStats[packageName] = {
          packageName,
          bookingCount: 0,
          revenue: 0,
          commission: 0,
        };
      }
      packageStats[packageName]!.bookingCount += 1;
      packageStats[packageName]!.revenue += Number(booking.total_amount || 0);
      packageStats[packageName]!.commission += (Number(booking.total_amount || 0) - Number(booking.nta_total || 0));
    });

    const topPackages = Object.values(packageStats)
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 10);

    // Top packages by revenue
    const topPackagesByRevenue = Object.values(packageStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Customer insights (repeat customers)
    const customerBookings: Record<string, number> = {};
    bookingsData.forEach((booking: any) => {
      const customerName = booking.customer_name || 'Unknown';
      customerBookings[customerName] = (customerBookings[customerName] || 0) + 1;
    });

    const repeatCustomers = Object.values(customerBookings).filter(count => count > 1).length;
    const totalCustomers = Object.keys(customerBookings).length;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // Booking conversion rate (simplified - would need more data for actual conversion)
    // For now, we'll use booking status distribution
    const statusDistribution = bookingsData.reduce((acc: Record<string, number>, b: any) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    // Simple revenue forecasting (linear regression for next 7 days)
    const forecastDays = 7;
    const recentDays = revenueTrendArray.slice(-7);
    if (recentDays.length > 1) {
      const avgDailyRevenue = recentDays.reduce((sum, d) => sum + d.revenue, 0) / recentDays.length;
      const forecast = Array.from({ length: forecastDays }, (_, i) => ({
        date: new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
        revenue: avgDailyRevenue,
        commission: avgDailyRevenue * (averageCommission / (totalRevenue || 1)),
        bookings: Math.round(avgDailyRevenue / (totalRevenue / totalBookings || 1)),
      }));
    }

    return NextResponse.json({
      period: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
      },
      summary: {
        totalRevenue,
        totalCommission,
        totalBookings,
        averageCommission,
        repeatRate,
        totalCustomers,
        repeatCustomers,
        // Previous period comparison
        previousPeriod: {
          totalRevenue: previousTotalRevenue,
          totalCommission: previousTotalCommission,
          totalBookings: previousTotalBookings,
        },
        changes: {
          revenue: revenueChange,
          commission: commissionChange,
          bookings: bookingsChange,
        },
      },
      trends: {
        revenue: revenueTrendArray,
      },
      topPackages: {
        byBookings: topPackages,
        byRevenue: topPackagesByRevenue,
      },
      customerInsights: {
        repeatRate,
        totalCustomers,
        repeatCustomers,
      },
      statusDistribution,
    });
  } catch (error) {
    logger.error('Failed to generate analytics', error, {
      userId: user.id,
    });
    throw error;
  }
});

