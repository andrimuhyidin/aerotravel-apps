/**
 * API: Partner CLV Customer List
 * GET /api/partner/analytics/clv/customers - Get customers with CLV data
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// CLV thresholds in IDR
const HIGH_VALUE_THRESHOLD = 10000000; // 10M
const MEDIUM_VALUE_THRESHOLD = 3000000; // 3M

// Days since last order for churn risk
const HIGH_RISK_DAYS = 90;
const MEDIUM_RISK_DAYS = 60;

function calculateSegment(totalSpent: number): 'high' | 'medium' | 'low' {
  if (totalSpent >= HIGH_VALUE_THRESHOLD) return 'high';
  if (totalSpent >= MEDIUM_VALUE_THRESHOLD) return 'medium';
  return 'low';
}

function calculateChurnRisk(daysSinceLastOrder: number): 'high' | 'medium' | 'low' {
  if (daysSinceLastOrder >= HIGH_RISK_DAYS) return 'high';
  if (daysSinceLastOrder >= MEDIUM_RISK_DAYS) return 'medium';
  return 'low';
}

export const GET = withErrorHandler(async (request: NextRequest) => {
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
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const searchParams = sanitizeSearchParams(request);
  const segment = searchParams.get('segment');
  const churnRisk = searchParams.get('churnRisk');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    // Get all customers with booking data
    const { data: customerData, error: customerError } = await client
      .from('partner_customers')
      .select(`
        id,
        name,
        phone,
        bookings:bookings(
          total_amount,
          status,
          created_at
        )
      `)
      .eq('partner_id', partnerId)
      .is('deleted_at', null);

    if (customerError) {
      logger.error('Failed to fetch customer CLV data', customerError, { userId: user.id });
      throw customerError;
    }

    if (!customerData || customerData.length === 0) {
      return NextResponse.json({ customers: [] });
    }

    const now = new Date();

    // Calculate CLV for each customer
    const customersWithCLV = customerData.map((customer: {
      id: string;
      name: string;
      phone: string;
      bookings: Array<{
        total_amount: number;
        status: string;
        created_at: string;
      }>;
    }) => {
      const completedBookings = (customer.bookings || []).filter(
        (b) => ['confirmed', 'completed', 'paid'].includes(b.status)
      );

      const totalSpent = completedBookings.reduce(
        (sum, b) => sum + Number(b.total_amount || 0),
        0
      );

      const orderCount = completedBookings.length;
      const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

      // Get last order date
      let lastOrderDate: string | null = null;
      let daysSinceLastOrder = Infinity;

      if (completedBookings.length > 0) {
        const dates = completedBookings.map((b) => new Date(b.created_at).getTime());
        const lastDate = new Date(Math.max(...dates));
        lastOrderDate = lastDate.toISOString();
        daysSinceLastOrder = Math.floor(
          (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      // Calculate segment and churn risk
      const customerSegment = calculateSegment(totalSpent);
      const customerChurnRisk = orderCount > 0
        ? calculateChurnRisk(daysSinceLastOrder)
        : 'low'; // New customers without orders are not at risk

      // Simple CLV calculation: total spent * expected future purchases factor
      // For high-value repeat customers, multiply by factor
      let clvFactor = 1;
      if (orderCount >= 3 && daysSinceLastOrder < 60) clvFactor = 2.5;
      else if (orderCount >= 2 && daysSinceLastOrder < 90) clvFactor = 1.8;
      else if (orderCount >= 1 && daysSinceLastOrder < 120) clvFactor = 1.3;

      const clv = totalSpent * clvFactor;

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        segment: customerSegment,
        clv: Math.round(clv),
        totalSpent: Math.round(totalSpent),
        orderCount,
        averageOrderValue: Math.round(averageOrderValue),
        lastOrderDate,
        daysSinceLastOrder: daysSinceLastOrder === Infinity ? -1 : daysSinceLastOrder,
        churnRisk: customerChurnRisk,
      };
    });

    // Filter by segment if specified
    let filteredCustomers = customersWithCLV;
    if (segment) {
      filteredCustomers = filteredCustomers.filter((c: { segment: string }) => c.segment === segment);
    }
    if (churnRisk) {
      filteredCustomers = filteredCustomers.filter((c: { churnRisk: string }) => c.churnRisk === churnRisk);
    }

    // Sort by CLV descending
    filteredCustomers.sort((a: { clv: number }, b: { clv: number }) => b.clv - a.clv);

    // Apply limit
    filteredCustomers = filteredCustomers.slice(0, limit);

    return NextResponse.json({ customers: filteredCustomers });
  } catch (error) {
    logger.error('Failed to get customer CLV list', error, { userId: user.id });
    throw error;
  }
});

