/**
 * API: Corporate Reports Export
 * GET /api/partner/corporate/reports/export - Export reports as CSV or PDF
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { getCorporateClient } from '@/lib/corporate';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

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
    const format = searchParams.get('format') || 'csv';
    const period = searchParams.get('period') || 'this_month';
    const type = searchParams.get('type') || 'summary';

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

    // Get employees
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

    // Get bookings
    let bookingsData: Array<{
      id: string;
      booking_code: string;
      trip_date: string;
      nta_total: number;
      status: string;
      created_by: string;
      created_at: string;
      packages: { name: string; destination: string } | null;
    }> = [];

    if (employeeUserIds.length > 0 && type === 'bookings') {
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_code,
          trip_date,
          nta_total,
          status,
          created_by,
          created_at,
          packages (name, destination)
        `)
        .in('created_by', employeeUserIds)
        .gte('created_at', dateFrom.toISOString())
        .lte('created_at', dateTo.toISOString())
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      bookingsData = (bookings || []) as typeof bookingsData;
    }

    // Generate CSV content based on type
    let csvContent = '';
    let filename = '';

    if (type === 'bookings') {
      filename = `corporate-bookings-${period}-${new Date().toISOString().split('T')[0]}.csv`;
      
      // CSV Header
      csvContent = 'Booking Code,Trip Date,Package,Destination,Employee,Department,Amount,Status,Created At\n';
      
      // CSV Rows
      bookingsData.forEach((booking) => {
        const employee = employeeList.find((e) => e.user_id === booking.created_by);
        csvContent += [
          booking.booking_code,
          booking.trip_date,
          `"${booking.packages?.name || 'N/A'}"`,
          `"${booking.packages?.destination || 'N/A'}"`,
          `"${employee?.full_name || 'Unknown'}"`,
          `"${employee?.department || 'Unknown'}"`,
          booking.nta_total,
          booking.status,
          new Date(booking.created_at).toLocaleDateString('id-ID'),
        ].join(',') + '\n';
      });
    } else if (type === 'employees') {
      filename = `corporate-employees-${new Date().toISOString().split('T')[0]}.csv`;
      
      // CSV Header
      csvContent = 'Name,Department,Allocated Budget,Used Budget,Remaining Budget,Usage %\n';
      
      // CSV Rows
      employeeList.forEach((emp) => {
        const allocated = Number(emp.allocated_amount || 0);
        const used = Number(emp.used_amount || 0);
        const remaining = allocated - used;
        const usagePercent = allocated > 0 ? Math.round((used / allocated) * 100) : 0;
        
        csvContent += [
          `"${emp.full_name}"`,
          `"${emp.department || 'Unknown'}"`,
          allocated,
          used,
          remaining,
          `${usagePercent}%`,
        ].join(',') + '\n';
      });
    } else {
      // Summary export
      filename = `corporate-summary-${period}-${new Date().toISOString().split('T')[0]}.csv`;
      
      // Department summary
      const departmentMap = new Map<string, { bookings: number; spending: number; budget: number }>();
      
      employeeList.forEach((emp) => {
        const dept = emp.department || 'Unknown';
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, { bookings: 0, spending: 0, budget: 0 });
        }
        const deptData = departmentMap.get(dept)!;
        deptData.budget += Number(emp.allocated_amount || 0);
        deptData.spending += Number(emp.used_amount || 0);
      });
      
      // CSV Header
      csvContent = 'Department,Total Budget,Total Spent,Remaining,Usage %\n';
      
      // CSV Rows
      departmentMap.forEach((data, dept) => {
        const remaining = data.budget - data.spending;
        const usagePercent = data.budget > 0 ? Math.round((data.spending / data.budget) * 100) : 0;
        
        csvContent += [
          `"${dept}"`,
          data.budget,
          data.spending,
          remaining,
          `${usagePercent}%`,
        ].join(',') + '\n';
      });
      
      // Add totals
      const totals = Array.from(departmentMap.values()).reduce(
        (acc, d) => ({
          budget: acc.budget + d.budget,
          spending: acc.spending + d.spending,
        }),
        { budget: 0, spending: 0 }
      );
      
      csvContent += '\n';
      csvContent += [
        '"TOTAL"',
        totals.budget,
        totals.spending,
        totals.budget - totals.spending,
        `${totals.budget > 0 ? Math.round((totals.spending / totals.budget) * 100) : 0}%`,
      ].join(',') + '\n';
    }

    logger.info('Corporate report exported', {
      corporateId: corporate.id,
      userId: user.id,
      format,
      type,
      period,
    });

    // Return CSV response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error('Failed to export corporate report', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
});

