/**
 * Shadow P&L Report - Laba Rugi Per Trip
 * PRD 4.5.A - Shadow P&L (Laba Rugi Per Trip)
 */

import type { Database } from '@/types/supabase';

type Booking = Database['public']['Tables']['bookings']['Row'];
type TripSchedule = Database['public']['Tables']['trip_schedules']['Row'];

export type CostItem = {
  category: string;
  description: string;
  amount: number;
  isVariable: boolean; // Variable vs Fixed cost
};

export type RevenueItem = {
  bookingId: string;
  bookingCode: string;
  customerName: string;
  paxCount: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
};

export type TripPnL = {
  tripId: string;
  tripCode: string;
  packageName: string;
  startDate: string;
  endDate: string;
  status: string;

  // Revenue
  totalPax: number;
  grossRevenue: number;
  totalDiscounts: number;
  netRevenue: number;
  revenueItems: RevenueItem[];

  // Costs
  fixedCosts: CostItem[];
  variableCosts: CostItem[];
  totalFixedCost: number;
  totalVariableCost: number;
  totalCost: number;

  // Profit
  grossProfit: number;
  grossMargin: number; // Percentage
  netProfit: number;
  netMargin: number; // Percentage

  // Per Pax Metrics
  revenuePerPax: number;
  costPerPax: number;
  profitPerPax: number;

  // Breakeven
  breakevenPax: number;
  isAboveBreakeven: boolean;
};

export type PnLSummary = {
  period: string;
  totalTrips: number;
  totalPax: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number;
  profitableTrips: number;
  unprofitableTrips: number;
};

/**
 * Default cost structure per trip type
 */
export const DEFAULT_COST_STRUCTURE: Record<string, CostItem[]> = {
  boat_trip: [
    { category: 'Operasional', description: 'BBM Kapal', amount: 500000, isVariable: false },
    { category: 'Operasional', description: 'Sewa Kapal', amount: 1500000, isVariable: false },
    { category: 'Operasional', description: 'Crew Kapal', amount: 300000, isVariable: false },
    { category: 'Guide', description: 'Fee Guide', amount: 200000, isVariable: false },
    { category: 'Konsumsi', description: 'Makan per Pax', amount: 50000, isVariable: true },
    { category: 'Konsumsi', description: 'Snack per Pax', amount: 15000, isVariable: true },
    { category: 'Perlengkapan', description: 'Alat Snorkeling per Pax', amount: 25000, isVariable: true },
    { category: 'Asuransi', description: 'Asuransi per Pax', amount: 10000, isVariable: true },
    { category: 'Dokumentasi', description: 'Foto/Video', amount: 100000, isVariable: false },
  ],
  land_trip: [
    { category: 'Transportasi', description: 'Sewa Kendaraan', amount: 800000, isVariable: false },
    { category: 'Transportasi', description: 'BBM', amount: 300000, isVariable: false },
    { category: 'Guide', description: 'Fee Guide', amount: 200000, isVariable: false },
    { category: 'Konsumsi', description: 'Makan per Pax', amount: 75000, isVariable: true },
    { category: 'Tiket', description: 'Tiket Masuk per Pax', amount: 50000, isVariable: true },
    { category: 'Asuransi', description: 'Asuransi per Pax', amount: 10000, isVariable: true },
  ],
};

/**
 * Calculate total cost based on pax count
 */
export function calculateTotalCost(
  costs: CostItem[],
  paxCount: number
): { fixed: number; variable: number; total: number } {
  let fixed = 0;
  let variable = 0;

  for (const cost of costs) {
    if (cost.isVariable) {
      variable += cost.amount * paxCount;
    } else {
      fixed += cost.amount;
    }
  }

  return {
    fixed,
    variable,
    total: fixed + variable,
  };
}

/**
 * Calculate breakeven pax count
 */
export function calculateBreakevenPax(
  fixedCost: number,
  pricePerPax: number,
  variableCostPerPax: number
): number {
  const contributionMargin = pricePerPax - variableCostPerPax;
  if (contributionMargin <= 0) return Infinity;
  return Math.ceil(fixedCost / contributionMargin);
}

/**
 * Generate P&L report for a single trip
 */
export function generateTripPnL(
  trip: TripSchedule,
  bookings: Booking[],
  costs: CostItem[],
  packageName: string
): TripPnL {
  // Filter confirmed/paid bookings
  const validBookings = bookings.filter(
    (b) =>
      b.trip_schedule_id === trip.id &&
      ['confirmed', 'paid', 'completed'].includes(b.status ?? '')
  );

  // Calculate revenue
  const revenueItems: RevenueItem[] = validBookings.map((b) => ({
    bookingId: b.id,
    bookingCode: b.booking_code,
    customerName: '', // Will be filled by caller
    paxCount: b.pax_count || 0,
    grossAmount: b.total_price || 0,
    discountAmount: b.discount_amount || 0,
    netAmount: (b.total_price || 0) - (b.discount_amount || 0),
  }));

  const totalPax = revenueItems.reduce((sum, r) => sum + r.paxCount, 0);
  const grossRevenue = revenueItems.reduce((sum, r) => sum + r.grossAmount, 0);
  const totalDiscounts = revenueItems.reduce((sum, r) => sum + r.discountAmount, 0);
  const netRevenue = grossRevenue - totalDiscounts;

  // Calculate costs
  const fixedCosts = costs.filter((c) => !c.isVariable);
  const variableCosts = costs.filter((c) => c.isVariable);
  const costCalc = calculateTotalCost(costs, totalPax);

  // Calculate profit
  const grossProfit = netRevenue - costCalc.total;
  const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

  // Per pax metrics
  const revenuePerPax = totalPax > 0 ? netRevenue / totalPax : 0;
  const costPerPax = totalPax > 0 ? costCalc.total / totalPax : 0;
  const profitPerPax = totalPax > 0 ? grossProfit / totalPax : 0;

  // Breakeven
  const variableCostPerPax = variableCosts.reduce((sum, c) => sum + c.amount, 0);
  const avgPricePerPax = totalPax > 0 ? netRevenue / totalPax : 0;
  const breakevenPax = calculateBreakevenPax(
    costCalc.fixed,
    avgPricePerPax,
    variableCostPerPax
  );

  return {
    tripId: trip.id,
    tripCode: trip.trip_code || '',
    packageName,
    startDate: trip.start_date,
    endDate: trip.end_date,
    status: trip.status || 'unknown',

    totalPax,
    grossRevenue,
    totalDiscounts,
    netRevenue,
    revenueItems,

    fixedCosts,
    variableCosts,
    totalFixedCost: costCalc.fixed,
    totalVariableCost: costCalc.variable,
    totalCost: costCalc.total,

    grossProfit,
    grossMargin: Math.round(grossMargin * 100) / 100,
    netProfit: grossProfit, // Same for now, can add taxes later
    netMargin: Math.round(grossMargin * 100) / 100,

    revenuePerPax: Math.round(revenuePerPax),
    costPerPax: Math.round(costPerPax),
    profitPerPax: Math.round(profitPerPax),

    breakevenPax,
    isAboveBreakeven: totalPax >= breakevenPax,
  };
}

/**
 * Generate P&L summary for multiple trips
 */
export function generatePnLSummary(tripPnLs: TripPnL[], period: string): PnLSummary {
  const totalTrips = tripPnLs.length;
  const totalPax = tripPnLs.reduce((sum, t) => sum + t.totalPax, 0);
  const totalRevenue = tripPnLs.reduce((sum, t) => sum + t.netRevenue, 0);
  const totalCost = tripPnLs.reduce((sum, t) => sum + t.totalCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const profitableTrips = tripPnLs.filter((t) => t.grossProfit > 0).length;
  const unprofitableTrips = totalTrips - profitableTrips;

  return {
    period,
    totalTrips,
    totalPax,
    totalRevenue,
    totalCost,
    totalProfit,
    averageMargin: Math.round(averageMargin * 100) / 100,
    profitableTrips,
    unprofitableTrips,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get profit status label
 */
export function getProfitStatus(
  margin: number
): { label: string; color: 'green' | 'yellow' | 'red' } {
  if (margin >= 30) return { label: 'Sangat Baik', color: 'green' };
  if (margin >= 15) return { label: 'Baik', color: 'green' };
  if (margin >= 0) return { label: 'Tipis', color: 'yellow' };
  return { label: 'Rugi', color: 'red' };
}
