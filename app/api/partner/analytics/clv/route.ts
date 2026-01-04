/**
 * API: Partner CLV Analytics
 * GET /api/partner/analytics/clv - Get CLV statistics
 */

import { NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner' },
      { status: 403 }
    );
  }

  try {
    // Get all customers with booking aggregates using verified partnerId
    const { data: customerData, error: customerError } = await client
      .from('partner_customers')
      .select(`
        id,
        bookings:bookings(
          total_amount,
          status,
          created_at
        )
      `)
      .eq('partner_id', partnerId)
      .is('deleted_at', null);

    if (customerError) {
      logger.error('Failed to fetch customer data for CLV', customerError, { userId: user.id });
      throw customerError;
    }

    if (!customerData || customerData.length === 0) {
      return NextResponse.json({
        totalCustomers: 0,
        averageCLV: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        repeatCustomerRate: 0,
        highValueCustomers: 0,
        atRiskCustomers: 0,
      });
    }

    // Calculate CLV metrics
    let totalRevenue = 0;
    let totalOrders = 0;
    let customersWithOrders = 0;
    let repeatCustomers = 0;
    const clvValues: number[] = [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    let highValueCount = 0;
    let atRiskCount = 0;

    for (const customer of customerData) {
      const completedBookings = (customer.bookings || []).filter(
        (b: { status: string }) => ['confirmed', 'completed', 'paid'].includes(b.status)
      );

      if (completedBookings.length > 0) {
        customersWithOrders++;

        const customerTotal = completedBookings.reduce(
          (sum: number, b: { total_amount: number }) => sum + Number(b.total_amount || 0),
          0
        );

        totalRevenue += customerTotal;
        totalOrders += completedBookings.length;
        clvValues.push(customerTotal);

        if (completedBookings.length > 1) {
          repeatCustomers++;
        }

        // High value threshold: > 10M IDR
        if (customerTotal > 10000000) {
          highValueCount++;
        }

        // Check for at-risk (no order in 90 days but had orders before)
        const lastOrderDate = new Date(
          Math.max(...completedBookings.map((b: { created_at: string }) => new Date(b.created_at).getTime()))
        );
        
        if (lastOrderDate < ninetyDaysAgo) {
          atRiskCount++;
        }
      }
    }

    const averageCLV = clvValues.length > 0
      ? clvValues.reduce((a, b) => a + b, 0) / clvValues.length
      : 0;

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const repeatCustomerRate = customersWithOrders > 0
      ? (repeatCustomers / customersWithOrders) * 100
      : 0;

    return NextResponse.json({
      totalCustomers: customerData.length,
      averageCLV: Math.round(averageCLV),
      totalRevenue: Math.round(totalRevenue),
      averageOrderValue: Math.round(averageOrderValue),
      repeatCustomerRate: Math.round(repeatCustomerRate * 10) / 10,
      highValueCustomers: highValueCount,
      atRiskCustomers: atRiskCount,
    });
  } catch (error) {
    logger.error('Failed to calculate CLV stats', error, { userId: user.id });
    throw error;
  }
});

