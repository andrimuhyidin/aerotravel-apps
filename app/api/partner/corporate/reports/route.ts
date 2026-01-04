/**
 * API: Corporate Reports
 * GET /api/partner/corporate/reports - Get reporting data
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { getCorporateClient } from '@/lib/corporate';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type DepartmentData = {
  department: string;
  bookings: number;
  spending: number;
  budget: number;
};

type MonthlyData = {
  month: string;
  spending: number;
  bookings: number;
};

type TopTraveler = {
  name: string;
  department: string;
  trips: number;
  spending: number;
};

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const corporate = await getCorporateClient(user.id);

    if (!corporate) {
      return NextResponse.json(
        { error: 'No corporate access' },
        { status: 403 }
      );
    }

    const searchParams = sanitizeSearchParams(request);
    const period = searchParams.get('period') || 'this_month';

    // Calculate date range based on period
    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date = now;

    switch (period) {
      case 'last_month':
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        dateTo = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'this_quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        dateFrom = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'this_year':
        dateFrom = new Date(now.getFullYear(), 0, 1);
        break;
      case 'this_month':
      default:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Get employees with their departments and budgets
    const { data: employees } = await supabase
      .from('corporate_employees')
      .select('id, user_id, full_name, department, allocated_amount, used_amount')
      .eq('corporate_id', corporate.id)
      .eq('is_active', true);

    const employeeList = (employees || []) as Array<{
      id: string;
      user_id: string | null;
      full_name: string;
      department: string | null;
      allocated_amount: number;
      used_amount: number;
    }>;

    const employeeUserIds = employeeList
      .map((e) => e.user_id)
      .filter((id): id is string => !!id);

    // Get bookings within date range
    let bookingsData: Array<{
      id: string;
      nta_total: number;
      created_by: string;
      created_at: string;
    }> = [];

    if (employeeUserIds.length > 0) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, nta_total, created_by, created_at')
        .in('created_by', employeeUserIds)
        .gte('created_at', dateFrom.toISOString())
        .lte('created_at', dateTo.toISOString())
        .is('deleted_at', null);

      bookingsData = (bookings || []) as typeof bookingsData;
    }

    // Calculate department breakdown
    const departmentMap = new Map<string, DepartmentData>();
    
    employeeList.forEach((emp) => {
      const dept = emp.department || 'Unknown';
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, {
          department: dept,
          bookings: 0,
          spending: 0,
          budget: 0,
        });
      }
      const deptData = departmentMap.get(dept)!;
      deptData.budget += Number(emp.allocated_amount || 0);
    });

    // Add booking data to departments
    bookingsData.forEach((booking) => {
      const employee = employeeList.find((e) => e.user_id === booking.created_by);
      if (employee) {
        const dept = employee.department || 'Unknown';
        const deptData = departmentMap.get(dept);
        if (deptData) {
          deptData.bookings += 1;
          deptData.spending += Number(booking.nta_total || 0);
        }
      }
    });

    const departmentData: DepartmentData[] = Array.from(departmentMap.values())
      .filter((d) => d.budget > 0 || d.spending > 0)
      .sort((a, b) => b.spending - a.spending);

    // Calculate monthly trend (last 6 months)
    const monthlyData: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthLabel = monthDate.toLocaleString('id-ID', { month: 'short' });

      const monthBookings = bookingsData.filter((b) => {
        const bookingDate = new Date(b.created_at);
        return bookingDate >= monthDate && bookingDate <= monthEnd;
      });

      monthlyData.push({
        month: monthLabel,
        spending: monthBookings.reduce((sum, b) => sum + Number(b.nta_total || 0), 0),
        bookings: monthBookings.length,
      });
    }

    // Calculate top travelers
    const travelerMap = new Map<string, TopTraveler>();
    
    bookingsData.forEach((booking) => {
      const employee = employeeList.find((e) => e.user_id === booking.created_by);
      if (employee) {
        const key = employee.id;
        if (!travelerMap.has(key)) {
          travelerMap.set(key, {
            name: employee.full_name,
            department: employee.department || 'Unknown',
            trips: 0,
            spending: 0,
          });
        }
        const traveler = travelerMap.get(key)!;
        traveler.trips += 1;
        traveler.spending += Number(booking.nta_total || 0);
      }
    });

    const topTravelers = Array.from(travelerMap.values())
      .sort((a, b) => b.spending - a.spending)
      .slice(0, 5);

    // Calculate summary
    const totalSpending = departmentData.reduce((sum, d) => sum + d.spending, 0);
    const totalBudget = departmentData.reduce((sum, d) => sum + d.budget, 0);
    const totalBookings = departmentData.reduce((sum, d) => sum + d.bookings, 0);

    // Calculate previous period for comparison
    let prevPeriodSpending = 0;
    let prevPeriodBookings = 0;
    
    // Simple estimation for now (can be enhanced with actual prev period query)
    if (monthlyData.length >= 2) {
      const prevMonthData = monthlyData[monthlyData.length - 2];
      const currentMonthData = monthlyData[monthlyData.length - 1];
      if (prevMonthData) {
        prevPeriodSpending = prevMonthData.spending || 1;
        prevPeriodBookings = prevMonthData.bookings || 1;
      }
    }

    const spendingChange = prevPeriodSpending > 0 
      ? Math.round(((totalSpending - prevPeriodSpending) / prevPeriodSpending) * 100)
      : 0;
    const bookingsChange = prevPeriodBookings > 0
      ? Math.round(((totalBookings - prevPeriodBookings) / prevPeriodBookings) * 100)
      : 0;

    return NextResponse.json({
      summary: {
        totalSpending,
        totalBudget,
        totalBookings,
        remainingBudget: totalBudget - totalSpending,
        usagePercentage: totalBudget > 0 
          ? Math.round((totalSpending / totalBudget) * 100) 
          : 0,
        spendingChange,
        bookingsChange,
      },
      departmentData,
      monthlyData,
      topTravelers,
      period,
      dateRange: {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to get corporate reports', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to get reports' },
      { status: 500 }
    );
  }
});

