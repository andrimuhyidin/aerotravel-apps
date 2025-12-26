/**
 * API: Partner Customer Acquisition Cost (CAC)
 * GET /api/partner/analytics/cac
 * 
 * Calculates CAC = Total Marketing Spend / New Customers Acquired
 * For MVP: Uses wallet withdrawals tagged as marketing as proxy for marketing spend
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

    // Get wallet ID
    const { data: wallet } = await client
      .from('mitra_wallets')
      .select('id')
      .eq('mitra_id', user.id)
      .single();

    // Get marketing spend from wallet transactions
    // For MVP: Look for transactions with description containing "marketing" or specific tag
    let marketingSpend = 0;
    if (wallet) {
      const { data: marketingTransactions } = await client
        .from('mitra_wallet_transactions')
        .select('amount, description, transaction_type')
        .eq('wallet_id', wallet.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .or('description.ilike.%marketing%,description.ilike.%iklan%,description.ilike.%promosi%,description.ilike.%ads%');

      if (marketingTransactions) {
        // Sum up marketing expenses (negative amounts for withdrawals/debits)
        marketingSpend = marketingTransactions.reduce((sum: number, t: any) => {
          const amount = Math.abs(Number(t.amount || 0));
          // Only count if it's a withdrawal or debit (negative transaction)
          if (t.transaction_type === 'withdrawal' || amount < 0) {
            return sum + amount;
          }
          return sum;
        }, 0);
      }
    }

    // Get bookings in period to identify new vs repeat customers
    const { data: bookings } = await client
      .from('bookings')
      .select(`
        id,
        customer_name,
        customer_email,
        customer_phone,
        created_at,
        total_amount,
        nta_total
      `)
      .eq('mitra_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('status', ['paid', 'confirmed', 'ongoing', 'completed']);

    const bookingsData = bookings || [];

    // Identify new vs repeat customers
    // Get all customer bookings before this period to identify repeat customers
    const { data: previousBookings } = await client
      .from('bookings')
      .select('customer_name, customer_email, customer_phone')
      .eq('mitra_id', user.id)
      .lt('created_at', startDate.toISOString())
      .in('status', ['paid', 'confirmed', 'ongoing', 'completed']);

    const previousCustomers = new Set<string>();
    (previousBookings || []).forEach((b: any) => {
      const key = b.customer_email || b.customer_phone || b.customer_name;
      if (key) previousCustomers.add(key);
    });

    const newCustomers = new Set<string>();
    const repeatCustomers = new Set<string>();
    let totalRevenueFromNewCustomers = 0;
    let totalRevenueFromRepeatCustomers = 0;

    bookingsData.forEach((booking: any) => {
      const key = booking.customer_email || booking.customer_phone || booking.customer_name;
      if (!key) return;

      if (previousCustomers.has(key)) {
        repeatCustomers.add(key);
        totalRevenueFromRepeatCustomers += Number(booking.total_amount || 0);
      } else {
        newCustomers.add(key);
        totalRevenueFromNewCustomers += Number(booking.total_amount || 0);
      }
    });

    const newCustomerCount = newCustomers.size;
    const repeatCustomerCount = repeatCustomers.size;
    const totalCustomers = newCustomerCount + repeatCustomerCount;

    // Calculate CAC
    const cac = newCustomerCount > 0 ? marketingSpend / newCustomerCount : 0;

    // Calculate ROI for new customers
    const roi = marketingSpend > 0
      ? ((totalRevenueFromNewCustomers - marketingSpend) / marketingSpend) * 100
      : 0;

    // Calculate average revenue per new customer
    const avgRevenuePerNewCustomer = newCustomerCount > 0
      ? totalRevenueFromNewCustomers / newCustomerCount
      : 0;

    // Calculate LTV (Lifetime Value) approximation - average revenue per customer
    const ltv = totalCustomers > 0
      ? (totalRevenueFromNewCustomers + totalRevenueFromRepeatCustomers) / totalCustomers
      : 0;

    // Calculate CAC trend (daily/weekly)
    const cacTrend: Array<{ date: string; marketingSpend: number; newCustomers: number; cac: number }> = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const groupBy = daysDiff > 90 ? 'week' : 'day';

    for (let i = 0; i < daysDiff; i += groupBy === 'week' ? 7 : 1) {
      const dateStart = new Date(startDate);
      dateStart.setDate(dateStart.getDate() + i);
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + (groupBy === 'week' ? 6 : 0));
      dateEnd.setHours(23, 59, 59, 999);

      // Get marketing spend for this period
      let periodMarketingSpend = 0;
      if (wallet) {
        const { data: periodTransactions } = await client
          .from('mitra_wallet_transactions')
          .select('amount, transaction_type')
          .eq('wallet_id', wallet.id)
          .gte('created_at', dateStart.toISOString())
          .lte('created_at', dateEnd.toISOString())
          .or('description.ilike.%marketing%,description.ilike.%iklan%,description.ilike.%promosi%,description.ilike.%ads%');

        if (periodTransactions) {
          periodMarketingSpend = periodTransactions.reduce((sum: number, t: any) => {
            const amount = Math.abs(Number(t.amount || 0));
            if (t.transaction_type === 'withdrawal' || amount < 0) {
              return sum + amount;
            }
            return sum;
          }, 0);
        }
      }

      // Get new customers for this period
      const { data: periodBookings } = await client
        .from('bookings')
        .select('customer_name, customer_email, customer_phone')
        .eq('mitra_id', user.id)
        .gte('created_at', dateStart.toISOString())
        .lte('created_at', dateEnd.toISOString())
        .in('status', ['paid', 'confirmed', 'ongoing', 'completed']);

      const periodPreviousCustomers = new Set<string>();
      if (i > 0) {
        const { data: prevBookings } = await client
          .from('bookings')
          .select('customer_name, customer_email, customer_phone')
          .eq('mitra_id', user.id)
          .lt('created_at', dateStart.toISOString())
          .in('status', ['paid', 'confirmed', 'ongoing', 'completed']);

        (prevBookings || []).forEach((b: any) => {
          const key = b.customer_email || b.customer_phone || b.customer_name;
          if (key) periodPreviousCustomers.add(key);
        });
      }

      const periodNewCustomers = new Set<string>();
      (periodBookings || []).forEach((b: any) => {
        const key = b.customer_email || b.customer_phone || b.customer_name;
        if (key && !periodPreviousCustomers.has(key)) {
          periodNewCustomers.add(key);
        }
      });

      const periodNewCustomerCount = periodNewCustomers.size;
      const periodCAC = periodNewCustomerCount > 0 ? periodMarketingSpend / periodNewCustomerCount : 0;

      cacTrend.push({
        date: dateStart.toISOString().split('T')[0]!,
        marketingSpend: periodMarketingSpend,
        newCustomers: periodNewCustomerCount,
        cac: periodCAC,
      });
    }

    return NextResponse.json({
      period: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
      },
      metrics: {
        marketingSpend,
        newCustomerCount,
        repeatCustomerCount,
        totalCustomers,
        cac,
        roi,
        avgRevenuePerNewCustomer,
        ltv,
        totalRevenueFromNewCustomers,
        totalRevenueFromRepeatCustomers,
      },
      trend: cacTrend,
    });
  } catch (error) {
    logger.error('Failed to calculate CAC', error, {
      userId: user.id,
      period,
      from,
      to,
    });
    throw error;
  }
});

