/**
 * Admin CRM Segments API
 * GET /api/admin/crm/segments - Get customer segment statistics
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  logger.info('GET /api/admin/crm/segments');

  const allowed = await hasRole(['super_admin', 'marketing', 'cs']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all users with bookings
    const { data: usersWithBookings, error } = await supabase
      .from('users')
      .select(
        `
        id,
        bookings!bookings_user_id_fkey (
          id,
          total_amount,
          status
        )
      `
      )
      .not('bookings', 'is', null);

    if (error) {
      logger.error('Failed to fetch segment data', error);
      throw error;
    }

    type UserWithBookings = {
      id: string;
      bookings: Array<{
        id: string;
        total_amount: number;
        status: string;
      }>;
    };

    // Process segments
    let vipCount = 0;
    let repeatCount = 0;
    let newCount = 0;
    let totalRevenue = 0;
    let vipRevenue = 0;
    let repeatRevenue = 0;
    let newRevenue = 0;

    (usersWithBookings || []).forEach((customer: UserWithBookings) => {
      const bookings = customer.bookings || [];
      const completedBookings = bookings.filter(
        (b) => b.status === 'completed' || b.status === 'confirmed'
      );
      const customerTotal = completedBookings.reduce(
        (sum, b) => sum + (b.total_amount || 0),
        0
      );
      const bookingCount = completedBookings.length;

      totalRevenue += customerTotal;

      if (customerTotal >= 10000000 || bookingCount >= 5) {
        vipCount++;
        vipRevenue += customerTotal;
      } else if (bookingCount >= 2) {
        repeatCount++;
        repeatRevenue += customerTotal;
      } else {
        newCount++;
        newRevenue += customerTotal;
      }
    });

    const totalCustomers = vipCount + repeatCount + newCount;

    const segments = [
      {
        id: 'vip',
        name: 'VIP Customers',
        description: 'Total spent >= Rp 10jt atau 5+ bookings',
        count: vipCount,
        percentage: totalCustomers > 0 ? Math.round((vipCount / totalCustomers) * 100) : 0,
        revenue: vipRevenue,
        avgValue: vipCount > 0 ? Math.round(vipRevenue / vipCount) : 0,
        color: 'purple',
      },
      {
        id: 'repeat',
        name: 'Repeat Customers',
        description: '2-4 bookings',
        count: repeatCount,
        percentage: totalCustomers > 0 ? Math.round((repeatCount / totalCustomers) * 100) : 0,
        revenue: repeatRevenue,
        avgValue: repeatCount > 0 ? Math.round(repeatRevenue / repeatCount) : 0,
        color: 'blue',
      },
      {
        id: 'new',
        name: 'New Customers',
        description: '1 booking',
        count: newCount,
        percentage: totalCustomers > 0 ? Math.round((newCount / totalCustomers) * 100) : 0,
        revenue: newRevenue,
        avgValue: newCount > 0 ? Math.round(newRevenue / newCount) : 0,
        color: 'green',
      },
    ];

    return NextResponse.json({
      segments,
      summary: {
        totalCustomers,
        totalRevenue,
        avgCustomerValue: totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0,
      },
    });
  } catch (error) {
    logger.error('CRM segments error', error);
    throw error;
  }
});

