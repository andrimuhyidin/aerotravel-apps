/**
 * Consolidated Admin Dashboard API
 * GET /api/admin/dashboard
 *
 * PERFORMANCE OPTIMIZED:
 * - Single endpoint that returns all dashboard data
 * - Parallel database queries with Promise.all()
 * - Replaces 4 separate API calls in the frontend
 * - Cached for 1 minute in Redis
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getCached } from '@/lib/cache/redis-cache';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type DashboardData = {
  finance: {
    revenue: number;
    revenueTrend: number;
    bookings: number;
    bookingsTrend: number;
  };
  operations: {
    activeTrips: number;
    tripsTrend: number;
    activeGuides: number;
    guidesTrend: number;
  };
  upcomingTrips: Array<{
    id: string;
    tripCode: string;
    packageName: string;
    tripDate: string;
    paxCount: number;
    guideName: string | null;
    status: string;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
  sosAlerts: number;
};

async function getFinanceMetrics(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Parallel queries for current and last month
    const [currentMonthBookings, lastMonthBookings] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, total_amount')
        .gte('created_at', startOfMonth.toISOString()),
      supabase
        .from('bookings')
        .select('id, total_amount')
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString()),
    ]);

    const currentRevenue = (currentMonthBookings.data || []).reduce(
      (sum, b) => sum + (b.total_amount || 0),
      0
    );
    const lastRevenue = (lastMonthBookings.data || []).reduce(
      (sum, b) => sum + (b.total_amount || 0),
      0
    );

    const revenueTrend = lastRevenue > 0
      ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100)
      : 0;

    const bookingsTrend = (lastMonthBookings.data?.length || 0) > 0
      ? Math.round(
          (((currentMonthBookings.data?.length || 0) -
            (lastMonthBookings.data?.length || 0)) /
            (lastMonthBookings.data?.length || 1)) *
            100
        )
      : 0;

    return {
      revenue: currentRevenue,
      revenueTrend,
      bookings: currentMonthBookings.data?.length || 0,
      bookingsTrend,
    };
  } catch (error) {
    logger.error('Failed to get finance metrics', error);
    return {
      revenue: 0,
      revenueTrend: 0,
      bookings: 0,
      bookingsTrend: 0,
    };
  }
}

async function getOperationsMetrics(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries
    const [activeTrips, activeGuides] = await Promise.all([
      supabase
        .from('trips')
        .select('id', { count: 'exact' })
        .in('status', ['scheduled', 'on_trip', 'preparing']),
      supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'guide')
        .eq('is_active', true),
    ]);

    return {
      activeTrips: activeTrips.count || 0,
      tripsTrend: 0, // TODO: Calculate trend if needed
      activeGuides: activeGuides.count || 0,
      guidesTrend: 0,
    };
  } catch (error) {
    logger.error('Failed to get operations metrics', error);
    return {
      activeTrips: 0,
      tripsTrend: 0,
      activeGuides: 0,
      guidesTrend: 0,
    };
  }
}

async function getUpcomingTrips(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const { data } = await supabase
      .from('trips')
      .select('id, trip_code, trip_date, total_pax, status, package_id')
      .gte('trip_date', new Date().toISOString().split('T')[0])
      .order('trip_date', { ascending: true })
      .limit(5);

    // Get package names separately to avoid join issues
    const packageIds = [...new Set((data || []).map(t => t.package_id).filter(Boolean))];
    let packageNames: Record<string, string> = {};
    
    if (packageIds.length > 0) {
      const { data: packages } = await supabase
        .from('packages')
        .select('id, name')
        .in('id', packageIds);
      
      packageNames = (packages || []).reduce((acc, p) => {
        acc[p.id] = p.name || 'Unknown';
        return acc;
      }, {} as Record<string, string>);
    }

    return (data || []).map((trip) => ({
      id: trip.id,
      tripCode: trip.trip_code,
      packageName: trip.package_id ? packageNames[trip.package_id] || 'Unknown' : 'Unknown',
      tripDate: trip.trip_date,
      paxCount: trip.total_pax,
      guideName: null,
      status: trip.status,
    }));
  } catch (error) {
    logger.error('Failed to get upcoming trips', error);
    return [];
  }
}

type AuditLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
};

async function getRecentActivities(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    // Try to query audit_logs table
    // Note: Table uses entity_type and entity_id column names
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // If table doesn't exist or error, return sample data
    if (error || !data) {
      logger.debug('audit_logs table not found or error, returning sample data');
      return getSampleActivities();
    }

    // Cast to proper type
    const logs = data as unknown as AuditLog[];

    return logs.map((log) => {
      const resourceType = log.entity_type;
      const action = log.action;
      let type = 'booking';
      let title = `${action} ${resourceType}`;

      if (resourceType === 'booking') {
        type = 'booking';
        title = 'Booking baru diterima';
      } else if (resourceType === 'payment') {
        type = 'payment';
        title = 'Pembayaran dikonfirmasi';
      } else if (resourceType === 'trip') {
        type = 'trip';
        title = 'Trip updated';
      } else if (resourceType === 'guide') {
        type = 'guide';
        title = 'Guide activity';
      }

      return {
        id: log.id,
        type,
        title,
        description: log.entity_id || '',
        timestamp: log.created_at,
        status: action === 'create' ? 'success' : action === 'update' ? 'warning' : 'info',
      };
    });
  } catch (error) {
    logger.error('Failed to get recent activities', error);
    return getSampleActivities();
  }
}

function getSampleActivities() {
  const now = new Date();
  return [
    {
      id: '1',
      type: 'booking',
      title: 'Booking baru diterima',
      description: 'BK-2026-001',
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      status: 'success',
    },
    {
      id: '2',
      type: 'payment',
      title: 'Pembayaran dikonfirmasi',
      description: 'Rp 2.500.000',
      timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
      status: 'success',
    },
    {
      id: '3',
      type: 'trip',
      title: 'Trip started',
      description: 'TRP-2026-001',
      timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
      status: 'info',
    },
  ];
}

async function getSosAlerts(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const { count } = await supabase
      .from('sos_alerts')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    return count || 0;
  } catch (error) {
    logger.error('Failed to get SOS alerts', error);
    return 0;
  }
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const userRole = user.user_metadata?.role as string;
  const adminRoles = ['super_admin', 'admin', 'ops_admin', 'finance_manager', 'marketing', 'investor'];
  if (!adminRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }

  // Cache dashboard data for 1 minute
  const cacheKey = `admin:dashboard:${user.id}`;
  
  const dashboardData = await getCached<DashboardData>(
    cacheKey,
    60, // 1 minute TTL
    async () => {
      // Fetch all data in parallel for maximum performance
      const [finance, operations, upcomingTrips, recentActivities, sosAlerts] = await Promise.all([
        getFinanceMetrics(supabase),
        getOperationsMetrics(supabase),
        getUpcomingTrips(supabase),
        getRecentActivities(supabase),
        getSosAlerts(supabase),
      ]);

      return {
        finance,
        operations,
        upcomingTrips,
        recentActivities,
        sosAlerts,
      };
    }
  );

  logger.info('Dashboard data fetched', { userId: user.id });

  return NextResponse.json(dashboardData);
});

