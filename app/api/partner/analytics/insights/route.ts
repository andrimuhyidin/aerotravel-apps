/**
 * API: Partner AI Sales Insights
 * GET /api/partner/analytics/insights
 * Returns AI-powered sales insights and predictions
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { generateSalesInsights, type SalesData } from '@/lib/ai/sales-insights';
import { aiChatRateLimit } from '@/lib/integrations/rate-limit';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  // Rate limiting
  const { success, limit, remaining } = await aiChatRateLimit.limit(user.id);
  if (!success) {
    return NextResponse.json(
      {
        error: 'Terlalu banyak request. Silakan tunggu sebentar.',
        limit,
        remaining,
      },
      { status: 429 }
    );
  }

  // Get query params
  const searchParams = sanitizeSearchParams(request);
  const period = searchParams.get('period') || 'month'; // week, month, quarter

  try {
    // Calculate date range
    const now = new Date();
    let dateFrom: Date;

    switch (period) {
      case 'week':
        dateFrom = new Date(now);
        dateFrom.setDate(now.getDate() - 7);
        break;
      case 'quarter':
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'month':
      default:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const dateFromStr = dateFrom.toISOString().split('T')[0];
    const dateToStr = now.toISOString().split('T')[0];

    // Fetch bookings for this partner
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_code,
        total_price,
        commission_amount,
        status,
        created_at,
        pax_count,
        customer_id,
        packages(id, name, destination)
      `)
      .eq('mitra_id', partnerId)
      .gte('created_at', dateFromStr)
      .lte('created_at', dateToStr)
      .in('status', ['confirmed', 'paid', 'completed']);

    if (bookingsError) {
      logger.error('Failed to fetch bookings for insights', bookingsError);
      throw bookingsError;
    }

    // Calculate summary
    const totalRevenue = (bookings || []).reduce((sum, b) => sum + Number(b.total_price || 0), 0);
    const totalCommission = (bookings || []).reduce((sum, b) => sum + Number(b.commission_amount || 0), 0);
    const totalBookings = bookings?.length || 0;
    const averageCommission = totalBookings > 0 ? totalCommission / totalBookings : 0;

    // Calculate repeat customers
    const customerIds = new Set((bookings || []).map((b) => b.customer_id).filter(Boolean));
    const totalCustomers = customerIds.size;

    // Get historical bookings for repeat calculation
    const { data: historicalBookings } = await supabase
      .from('bookings')
      .select('customer_id')
      .eq('mitra_id', partnerId)
      .lt('created_at', dateFromStr)
      .in('status', ['confirmed', 'paid', 'completed']);

    const historicalCustomerIds = new Set((historicalBookings || []).map((b) => b.customer_id).filter(Boolean));
    const repeatCustomers = Array.from(customerIds).filter((id) => historicalCustomerIds.has(id)).length;
    const repeatRate = totalCustomers > 0 ? repeatCustomers / totalCustomers : 0;

    // Calculate daily trends
    const dailyTrends: Array<{
      date: string;
      revenue: number;
      commission: number;
      bookings: number;
    }> = [];

    const dateMap = new Map<string, { revenue: number; commission: number; bookings: number }>();
    (bookings || []).forEach((booking) => {
      const date = booking.created_at?.split('T')[0] || '';
      const existing = dateMap.get(date) || { revenue: 0, commission: 0, bookings: 0 };
      dateMap.set(date, {
        revenue: existing.revenue + Number(booking.total_price || 0),
        commission: existing.commission + Number(booking.commission_amount || 0),
        bookings: existing.bookings + 1,
      });
    });

    // Fill in missing dates
    const currentDate = new Date(dateFrom);
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const data = dateMap.get(dateStr) || { revenue: 0, commission: 0, bookings: 0 };
      if (dateStr) {
        dailyTrends.push({
          date: dateStr,
          ...data,
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate top packages
    const packageStats = new Map<string, { name: string; bookings: number; revenue: number; commission: number }>();
    (bookings || []).forEach((booking) => {
      const pkg = booking.packages as { id: string; name: string } | null;
      if (pkg) {
        const existing = packageStats.get(pkg.id) || { name: pkg.name, bookings: 0, revenue: 0, commission: 0 };
        packageStats.set(pkg.id, {
          name: pkg.name,
          bookings: existing.bookings + 1,
          revenue: existing.revenue + Number(booking.total_price || 0),
          commission: existing.commission + Number(booking.commission_amount || 0),
        });
      }
    });

    const topByBookings = Array.from(packageStats.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)
      .map((p) => ({
        packageName: p.name,
        bookingCount: p.bookings,
        revenue: p.revenue,
        commission: p.commission,
      }));

    const topByRevenue = Array.from(packageStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({
        packageName: p.name,
        bookingCount: p.bookings,
        revenue: p.revenue,
        commission: p.commission,
      }));

    // Build sales data for AI
    const salesData: SalesData = {
      period: {
        from: dateFromStr,
        to: dateToStr,
      },
      summary: {
        totalRevenue,
        totalCommission,
        totalBookings,
        averageCommission,
        repeatRate,
        totalCustomers,
        repeatCustomers,
      },
      trends: {
        revenue: dailyTrends,
      },
      topPackages: {
        byBookings: topByBookings,
        byRevenue: topByRevenue,
      },
      customerInsights: {
        repeatRate,
        totalCustomers,
        repeatCustomers,
      },
    };

    // Generate AI insights
    const insights = await generateSalesInsights(salesData, user.id);

    logger.info('Sales insights generated', {
      userId: user.id,
      period,
      bookingCount: totalBookings,
      insightsCount: insights.insights.length,
    });

    return NextResponse.json({
      salesData,
      insights,
      remaining,
    });
  } catch (error) {
    logger.error('Sales insights error', error, { userId: user.id });
    throw error;
  }
});

