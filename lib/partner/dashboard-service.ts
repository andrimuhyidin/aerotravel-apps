import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type FeaturedPackage = {
  id: string;
  name: string;
  destination: string;
  durationDays: number;
  durationNights: number;
  thumbnailUrl: string | null;
  baseNTAPrice: number;
  basePublishPrice: number;
  commissionRate: number;
  bookingCount: number;
};

export type ActiveOrder = {
  id: string;
  bookingCode: string;
  packageName: string;
  customerName: string;
  tripDate: string;
  status: string;
  totalAmount: number;
  commission: number;
  createdAt: string;
};

export type MonthlyStats = {
  totalSales: number;
  totalOrders: number;
  commission: number;
  avgOrderValue: number;
  salesTrend: number;
  ordersTrend: number;
  commissionTrend: number;
  aovTrend: number;
};

export type RecentBooking = {
  id: string;
  bookingCode: string;
  packageName: string;
  totalAmount: number;
  commission: number;
  status: string;
  createdAt: string;
};

export type WalletStats = {
  balance: number;
  creditLimit: number;
  creditUsed: number;
  availableBalance: number;
};

export type TodayStats = {
  sales: number;
};

export type DashboardData = {
  featured: FeaturedPackage[];
  active: ActiveOrder[];
  monthly: MonthlyStats;
  recent: RecentBooking[];
  wallet: WalletStats;
  today: TodayStats;
  timestamp: string;
};

export async function getTopPackages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  branchId: string
): Promise<FeaturedPackage[]> {
  // Use direct query with JOIN to package_prices table
  const client = supabase as unknown as any;
  
  // Note: Partners can see all published packages (not filtered by branch)
  // RLS policy 'packages_select_published' handles access control
  const { data, error } = await client
    .from('packages')
    .select(
      `
      id,
      name,
      destination,
      duration_days,
      duration_nights,
      thumbnail_url,
      package_prices!inner (
        price_nta,
        price_publish,
        is_active
      )
    `
    )
    .eq('status', 'published')
    .is('deleted_at', null)
    .eq('package_prices.is_active', true)
    .limit(20); // Get more packages, we'll sort client-side

  if (error) {
    logger.error('Failed to fetch featured packages', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Fetch popularity stats separately
  const packageIds = data.map((pkg: any) => pkg.id);
  const { data: popularityData } = await client
    .from('package_popularity')
    .select('package_id, booking_count, total_revenue')
    .in('package_id', packageIds);

  // Create a map for quick lookup
  const popularityMap = new Map(
    popularityData?.map((p: any) => [p.package_id, p]) || []
  );

  // Merge data and sort by booking count
  const packages = data
    .map((pkg: any) => {
      const popularity = popularityMap.get(pkg.id);
      // Get first price tier (usually min_pax = 1)
      const price = pkg.package_prices?.[0];
      const pricePublish = price?.price_publish || 0;
      const priceNta = price?.price_nta || 0;
      
      const commissionRate =
        pricePublish && priceNta
          ? ((pricePublish - priceNta) / pricePublish) * 100
          : 0;

      return {
        id: pkg.id,
        name: pkg.name,
        destination: pkg.destination || 'Unknown',
        durationDays: pkg.duration_days || 1,
        durationNights: pkg.duration_nights || 0,
        thumbnailUrl: pkg.thumbnail_url,
        baseNTAPrice: priceNta,
        basePublishPrice: pricePublish,
        commissionRate: Math.round(commissionRate),
        bookingCount: popularity?.booking_count || 0,
      };
    })
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 5); // Take top 5

  return packages;
}

export async function getActiveOrders(
  supabase: Awaited<ReturnType<typeof createClient>>,
  branchId: string
): Promise<ActiveOrder[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      booking_code,
      customer_name,
      trip_date,
      status,
      total_amount,
      nta_total,
      created_at,
      package:packages!bookings_package_id_fkey (
        name
      )
    `
    )
    .eq('branch_id', branchId)
    .in('status', ['pending_payment', 'confirmed', 'ongoing'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    logger.error('Failed to fetch active orders', error);
    return [];
  }

  return (
    data?.map((booking) => ({
      id: booking.id,
      bookingCode: booking.booking_code,
      packageName: booking.package?.name || 'Unknown Package',
      customerName: booking.customer_name,
      tripDate: booking.trip_date,
      status: booking.status,
      totalAmount: booking.total_amount || 0,
      commission:
        (booking.total_amount || 0) - (booking.nta_total || booking.total_amount || 0),
      createdAt: booking.created_at,
    })) || []
  );
}

export async function getMonthlyStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  branchId: string
): Promise<MonthlyStats> {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Current month stats
  const { data: currentData } = await supabase
    .from('bookings')
    .select('total_amount, nta_total')
    .eq('branch_id', branchId)
    .gte('created_at', currentMonthStart.toISOString())
    .in('status', ['confirmed', 'ongoing', 'completed']);

  // Last month stats
  const { data: lastData } = await supabase
    .from('bookings')
    .select('total_amount, nta_total')
    .eq('branch_id', branchId)
    .gte('created_at', lastMonthStart.toISOString())
    .lte('created_at', lastMonthEnd.toISOString())
    .in('status', ['confirmed', 'ongoing', 'completed']);

  const currentSales = currentData?.reduce(
    (sum, b) => sum + (b.total_amount || 0),
    0
  ) || 0;
  const currentOrders = currentData?.length || 0;
  const currentCommission = currentData?.reduce(
    (sum, b) => sum + ((b.total_amount || 0) - (b.nta_total || b.total_amount || 0)),
    0
  ) || 0;
  const currentAOV = currentOrders > 0 ? currentSales / currentOrders : 0;

  const lastSales = lastData?.reduce(
    (sum, b) => sum + (b.total_amount || 0),
    0
  ) || 0;
  const lastOrders = lastData?.length || 0;
  const lastCommission = lastData?.reduce(
    (sum, b) => sum + ((b.total_amount || 0) - (b.nta_total || b.total_amount || 0)),
    0
  ) || 0;
  const lastAOV = lastOrders > 0 ? lastSales / lastOrders : 0;

  const calcTrend = (current: number, last: number) => {
    if (last === 0) return 0;
    return Math.round(((current - last) / last) * 100);
  };

  return {
    totalSales: currentSales,
    totalOrders: currentOrders,
    commission: currentCommission,
    avgOrderValue: currentAOV,
    salesTrend: calcTrend(currentSales, lastSales),
    ordersTrend: calcTrend(currentOrders, lastOrders),
    commissionTrend: calcTrend(currentCommission, lastCommission),
    aovTrend: calcTrend(currentAOV, lastAOV),
  };
}

export async function getRecentBookings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  branchId: string
): Promise<RecentBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      booking_code,
      total_amount,
      nta_total,
      status,
      created_at,
      package:packages!bookings_package_id_fkey (
        name
      )
    `
    )
    .eq('branch_id', branchId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    logger.error('Failed to fetch recent bookings', error);
    return [];
  }

  return (
    data?.map((booking) => ({
      id: booking.id,
      bookingCode: booking.booking_code,
      packageName: booking.package?.name || 'Unknown Package',
      totalAmount: booking.total_amount || 0,
      commission:
        (booking.total_amount || 0) - (booking.nta_total || booking.total_amount || 0),
      status: booking.status,
      createdAt: booking.created_at,
    })) || []
  );
}

export async function getWalletStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<WalletStats> {
  const client = supabase as unknown as any;
  const { data, error } = await client
    .from('mitra_wallets')
    .select('balance, credit_limit, credit_used')
    .eq('mitra_id', userId)
    .maybeSingle();

  if (error) {
    logger.error('Failed to fetch wallet balance', error);
    return { balance: 0, creditLimit: 0, creditUsed: 0, availableBalance: 0 };
  }

  if (!data) {
    return { balance: 0, creditLimit: 0, creditUsed: 0, availableBalance: 0 };
  }

  const balance = Number(data.balance || 0);
  const creditLimit = Number(data.credit_limit || 0);
  const creditUsed = Number(data.credit_used || 0);
  const availableBalance = balance + (creditLimit - creditUsed);

  return {
    balance,
    creditLimit,
    creditUsed,
    availableBalance,
  };
}

export async function getTodayStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  branchId: string
): Promise<TodayStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const { data } = await supabase
    .from('bookings')
    .select('total_amount')
    .eq('branch_id', branchId)
    .gte('created_at', todayStart.toISOString())
    .in('status', ['confirmed', 'ongoing', 'completed']);

  const sales = data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
  
  return { sales };
}

export async function getDashboardData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  branchId: string
): Promise<DashboardData> {
  const [
    featured,
    active,
    monthly,
    recent,
    wallet,
    today
  ] = await Promise.all([
    getTopPackages(supabase, branchId),
    getActiveOrders(supabase, branchId),
    getMonthlyStats(supabase, branchId),
    getRecentBookings(supabase, branchId),
    getWalletStats(supabase, userId),
    getTodayStats(supabase, branchId)
  ]);

  return {
    featured,
    active,
    monthly,
    recent,
    wallet,
    today,
    timestamp: new Date().toISOString()
  };
}

