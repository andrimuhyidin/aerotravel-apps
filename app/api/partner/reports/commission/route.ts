/**
 * API: Partner Commission Reports
 * GET /api/partner/reports/commission - Get commission report data
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeSearchParams } from '@/lib/api/partner-helpers';
import ExcelJS from 'exceljs';
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

  // Sanitize search params
  const searchParams = sanitizeSearchParams(request);
  const from = searchParams.get('from'); // YYYY-MM-DD
  const to = searchParams.get('to'); // YYYY-MM-DD
  const groupBy = searchParams.get('groupBy') || 'month'; // 'day', 'month', 'year'
  const exportFormat = searchParams.get('export'); // 'csv', 'excel'
  const packageId = searchParams.get('packageId');
  const destination = searchParams.get('destination');
  const status = searchParams.get('status'); // Filter by booking status

  const client = supabase as unknown as any;

  try {
    // Check if user is a partner (mitra) or partner team member
    const { data: userProfile, error: userProfileError } = await client
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (userProfileError) {
      logger.error('Failed to fetch user profile', userProfileError, {
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: userProfileError.message },
        { status: 500 }
      );
    }

    if (!userProfile) {
      logger.warn('User profile not found', { userId: user.id });
      return NextResponse.json({
        summary: {
          totalBookings: 0,
          totalRevenue: 0,
          totalCommission: 0,
        },
        grouped: [],
        bookings: [],
        breakdown: {
          byPackage: [],
          byDestination: [],
        },
      });
    }

    // Determine partner_id (mitra_id)
    let partnerId = user.id;
    
    // If user is not a mitra, check if they're a team member
    if (userProfile.role !== 'mitra') {
      const { data: partnerUser, error: partnerUserError } = await client
        .from('partner_users')
        .select('partner_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .eq('is_active', true)
        .maybeSingle();

      if (partnerUserError) {
        logger.warn('Failed to check partner_users, assuming direct partner', {
          userId: user.id,
          error: partnerUserError.message,
        });
        // Continue as if user is direct partner
      } else if (partnerUser) {
        partnerId = partnerUser.partner_id;
      } else {
        // User is not a partner or team member - return empty result
        logger.info('User is not a partner or team member, returning empty report', {
          userId: user.id,
          role: userProfile.role,
        });
        return NextResponse.json({
          summary: {
            totalBookings: 0,
            totalRevenue: 0,
            totalCommission: 0,
          },
          grouped: [],
          bookings: [],
          breakdown: {
            byPackage: [],
            byDestination: [],
          },
        });
      }
    }

    // Build query - simplify to avoid RLS issues with nested relations
    let query = client
      .from('bookings')
      .select(
        `
        id,
        booking_code,
        trip_date,
        total_amount,
        nta_total,
        status,
        customer_name,
        created_at,
        package_id
      `,
        { count: 'exact' }
      )
      .eq('mitra_id', partnerId)
      .is('deleted_at', null);

    // Filter by status (default to paid/confirmed/ongoing/completed if not specified)
    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else if (!status) {
      query = query.in('status', ['paid', 'confirmed', 'ongoing', 'completed']);
    }

    // Filter by date range (trip_date)
    if (from) {
      query = query.gte('trip_date', from);
    }
    if (to) {
      query = query.lte('trip_date', to);
    }

    // Filter by package
    if (packageId) {
      query = query.eq('package_id', packageId);
    }

    // Filter by destination (via package)
    if (destination) {
      // Need to join with packages table for destination filter
      // For now, we'll filter after fetching (less efficient but works)
    }

    // Order by trip_date
    query = query.order('trip_date', { ascending: false });

    const { data: bookings, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch commission data', error, {
        userId: user.id,
        partnerId,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
      });
      // Return empty report instead of throwing error
      return NextResponse.json({
        summary: {
          totalBookings: 0,
          totalRevenue: 0,
          totalCommission: 0,
        },
        grouped: [],
        bookings: [],
        breakdown: {
          byPackage: [],
          byDestination: [],
        },
      });
    }

    let bookingsData = bookings || [];

    // Fetch package details separately to avoid RLS issues
    const packageIds = Array.from(
      new Set(bookingsData.map((b: any) => b.package_id).filter(Boolean))
    );

    let packagesMap: Record<string, { name: string; destination: string }> = {};
    if (packageIds.length > 0) {
      const { data: packagesData, error: packagesError } = await client
        .from('packages')
        .select('id, name, destination')
        .in('id', packageIds);

      if (packagesError) {
        logger.warn('Failed to fetch package details', {
          error: packagesError.message,
          packageIds: packageIds.length,
        });
        // Continue without package details
      } else if (packagesData) {
        packagesMap = packagesData.reduce(
          (acc: Record<string, { name: string; destination: string }>, pkg: any) => {
            acc[pkg.id] = { name: pkg.name || 'Unknown', destination: pkg.destination || 'Unknown' };
            return acc;
          },
          {}
        );
      }
    }

    // Attach package info to bookings
    bookingsData = bookingsData.map((booking: any) => ({
      ...booking,
      package: packagesMap[booking.package_id] || null,
    }));

    // Filter by destination if specified (after fetching)
    if (destination) {
      bookingsData = bookingsData.filter(
        (b: any) => b.package?.destination === destination
      );
    }

    // Calculate commission (margin) for each booking
    const bookingsWithCommission = bookingsData.map((booking: any) => {
      const ntaTotal = booking.nta_total || booking.total_amount || 0;
      const totalAmount = booking.total_amount || 0;
      const commission = totalAmount - ntaTotal;

      return {
        ...booking,
        commission: Number(commission),
        ntaTotal: Number(ntaTotal),
        totalAmount: Number(totalAmount),
      };
    });

    // Group by period
    const grouped: Record<string, {
      date: string;
      bookingCount: number;
      totalRevenue: number;
      totalCommission: number;
      bookings: typeof bookingsWithCommission;
    }> = {};

    for (const booking of bookingsWithCommission) {
      const tripDate = new Date(booking.trip_date);
      let key: string;

      switch (groupBy) {
        case 'day':
          key = tripDate.toISOString().split('T')[0]!;
          break;
        case 'month':
          key = `${tripDate.getFullYear()}-${String(tripDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(tripDate.getFullYear());
          break;
        default:
          key = tripDate.toISOString().split('T')[0]!;
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          bookingCount: 0,
          totalRevenue: 0,
          totalCommission: 0,
          bookings: [],
        };
      }

      grouped[key]!.bookingCount += 1;
      grouped[key]!.totalRevenue += booking.totalAmount;
      grouped[key]!.totalCommission += booking.commission;
      grouped[key]!.bookings.push(booking);
    }

    // Helper function to format date for display
    function formatDate(dateStr: string, groupBy: string): string {
      if (groupBy === 'month') {
        const [year, month] = dateStr.split('-');
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
        ];
        return `${monthNames[parseInt(month || '1') - 1]} ${year}`;
      }
      if (groupBy === 'year') {
        return dateStr;
      }
      return new Date(dateStr).toLocaleDateString('id-ID');
    }

    // Convert to array and sort by date
    const groupedArray = Object.values(grouped).sort((a, b) => {
      return a.date.localeCompare(b.date);
    });

    // Calculate totals
    const totals = {
      totalBookings: bookingsWithCommission.length,
      totalRevenue: bookingsWithCommission.reduce(
        (sum: number, b: { totalAmount: number }) => sum + b.totalAmount,
        0
      ),
      totalCommission: bookingsWithCommission.reduce(
        (sum: number, b: { commission: number }) => sum + b.commission,
        0
      ),
    };

    // Export Excel if requested
    if (exportFormat === 'excel') {
      const workbook = new ExcelJS.Workbook();

      // Summary sheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 20 },
      ];
      summarySheet.addRow({ metric: 'Total Bookings', value: totals.totalBookings });
      summarySheet.addRow({ metric: 'Total Revenue', value: totals.totalRevenue });
      summarySheet.addRow({ metric: 'Total Commission', value: totals.totalCommission });
      summarySheet.addRow({ metric: 'Average Commission per Booking', value: totals.totalBookings > 0 ? Math.round(totals.totalCommission / totals.totalBookings) : 0 });
      
      // Style summary header
      summarySheet.getRow(1).font = { bold: true };
      summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Grouped data sheet
      const groupedSheet = workbook.addWorksheet('By Period');
      groupedSheet.columns = [
        { header: 'Period', key: 'date', width: 15 },
        { header: 'Booking Count', key: 'bookingCount', width: 15 },
        { header: 'Total Revenue', key: 'totalRevenue', width: 20 },
        { header: 'Total Commission', key: 'totalCommission', width: 20 },
      ];
      
      groupedArray.forEach((group) => {
        groupedSheet.addRow({
          date: formatDate(group.date, groupBy),
          bookingCount: group.bookingCount,
          totalRevenue: group.totalRevenue,
          totalCommission: group.totalCommission,
        });
      });

      // Style grouped header
      groupedSheet.getRow(1).font = { bold: true };
      groupedSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Detailed bookings sheet
      const bookingsSheet = workbook.addWorksheet('Bookings');
      bookingsSheet.columns = [
        { header: 'Booking Code', key: 'booking_code', width: 20 },
        { header: 'Customer', key: 'customer_name', width: 25 },
        { header: 'Package', key: 'package_name', width: 30 },
        { header: 'Destination', key: 'destination', width: 20 },
        { header: 'Trip Date', key: 'trip_date', width: 15 },
        { header: 'Revenue', key: 'total_amount', width: 15 },
        { header: 'NTA Total', key: 'nta_total', width: 15 },
        { header: 'Commission', key: 'commission', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Created At', key: 'created_at', width: 20 },
      ];

      bookingsWithCommission.forEach((booking: any) => {
        bookingsSheet.addRow({
          booking_code: booking.booking_code,
          customer_name: booking.customer_name || '',
          package_name: booking.package?.name || '',
          destination: booking.package?.destination || '',
          trip_date: new Date(booking.trip_date).toLocaleDateString('id-ID'),
          total_amount: booking.totalAmount,
          nta_total: booking.ntaTotal,
          commission: booking.commission,
          status: booking.status,
          created_at: new Date(booking.created_at).toLocaleDateString('id-ID'),
        });
      });

      // Style bookings header
      bookingsSheet.getRow(1).font = { bold: true };
      bookingsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `commission-report-${from || 'all'}-${to || 'all'}-${new Date().toISOString().split('T')[0]}.xlsx`;

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Export CSV if requested
    if (exportFormat === 'csv') {
      const headers = [
        'Date',
        'Booking Code',
        'Customer',
        'Package',
        'Destination',
        'Trip Date',
        'Revenue',
        'NTA Total',
        'Commission',
        'Status',
      ];
      const rows = bookingsWithCommission.map((b: any) => [
        new Date(b.created_at).toLocaleDateString('id-ID'),
        b.booking_code,
        b.customer_name || '',
        b.package?.name || '',
        b.package?.destination || '',
        new Date(b.trip_date).toLocaleDateString('id-ID'),
        Number(b.totalAmount).toLocaleString('id-ID'),
        Number(b.ntaTotal).toLocaleString('id-ID'),
        Number(b.commission).toLocaleString('id-ID'),
        b.status,
      ]);

      const csv = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="commission-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Calculate commission breakdown by package and destination
    const packageBreakdown: Record<string, {
      packageName: string;
      bookingCount: number;
      totalRevenue: number;
      totalCommission: number;
    }> = {};

    const destinationBreakdown: Record<string, {
      destination: string;
      bookingCount: number;
      totalRevenue: number;
      totalCommission: number;
    }> = {};

    bookingsWithCommission.forEach((booking: any) => {
      const packageName = booking.package?.name || 'Unknown';
      const destination = booking.package?.destination || 'Unknown';

      // Package breakdown
      if (!packageBreakdown[packageName]) {
        packageBreakdown[packageName] = {
          packageName,
          bookingCount: 0,
          totalRevenue: 0,
          totalCommission: 0,
        };
      }
      packageBreakdown[packageName]!.bookingCount += 1;
      packageBreakdown[packageName]!.totalRevenue += booking.totalAmount;
      packageBreakdown[packageName]!.totalCommission += booking.commission;

      // Destination breakdown
      if (!destinationBreakdown[destination]) {
        destinationBreakdown[destination] = {
          destination,
          bookingCount: 0,
          totalRevenue: 0,
          totalCommission: 0,
        };
      }
      destinationBreakdown[destination]!.bookingCount += 1;
      destinationBreakdown[destination]!.totalRevenue += booking.totalAmount;
      destinationBreakdown[destination]!.totalCommission += booking.commission;
    });

    return NextResponse.json({
      summary: totals,
      grouped: groupedArray,
      bookings: bookingsWithCommission,
      breakdown: {
        byPackage: Object.values(packageBreakdown).sort((a, b) => b.totalCommission - a.totalCommission),
        byDestination: Object.values(destinationBreakdown).sort((a, b) => b.totalCommission - a.totalCommission),
      },
    });
  } catch (error) {
    logger.error('Failed to generate commission report', error, {
      userId: user.id,
    });
    throw error;
  }
});

