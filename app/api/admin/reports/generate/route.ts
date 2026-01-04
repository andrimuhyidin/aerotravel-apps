/**
 * API: Admin - Report Generation
 * POST /api/admin/reports/generate - Generate report in PDF or Excel format
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';
import {
  generateRevenueReportPDF,
  generatePnLReportPDF,
  generateBookingReportPDF,
} from '@/lib/reports/pdf-export';
import { ReportExporter } from '@/lib/excel/export';

const generateReportSchema = z.object({
  reportType: z.enum(['revenue', 'pnl', 'bookings', 'customers', 'guide-performance']),
  format: z.enum(['pdf', 'excel']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  filters: z.record(z.string(), z.unknown()).optional(),
});

// Type helpers for data processing
type RevenueTrip = {
  tripCode: string;
  packageName: string;
  revenue: number;
  pax: number;
};

type PnlTrip = {
  tripCode: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
};

type BookingData = {
  bookingCode: string;
  customerName: string;
  packageName: string;
  tripDate: string;
  pax: number;
  amount: number;
  status: string;
};

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'finance_manager', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const validated = generateReportSchema.parse(body);

  const { reportType, format, startDate, endDate } = validated;
  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    let buffer: Buffer;
    let filename: string;
    let mimeType: string;

    switch (reportType) {
      case 'revenue': {
        // Fetch revenue data
        const { data: trips } = await client
          .from('trips')
          .select(`
            trip_code,
            packages!inner(name),
            bookings!inner(total_amount, adult_pax, child_pax)
          `)
          .gte('start_date', startDate)
          .lte('start_date', endDate);

        const revenueTrips: RevenueTrip[] = trips?.map((trip: any) => {
          const tripRevenue = trip.bookings?.reduce(
            (sum: number, b: any) => sum + (b.total_amount || 0),
            0
          ) || 0;
          const tripPax = trip.bookings?.reduce(
            (sum: number, b: any) => sum + (b.adult_pax || 0) + (b.child_pax || 0),
            0
          ) || 0;
          return {
            tripCode: trip.trip_code as string,
            packageName: (trip.packages?.name as string) || 'Unknown',
            revenue: tripRevenue,
            pax: tripPax,
          };
        }) || [];

        const totalRevenue = revenueTrips.reduce(
          (sum: number, t: RevenueTrip) => sum + t.revenue,
          0
        );
        const totalBookings = revenueTrips.length;

        const revenueData = {
          startDate,
          endDate,
          revenue: totalRevenue,
          bookings: totalBookings,
          trips: revenueTrips,
        };

        if (format === 'pdf') {
          buffer = await generateRevenueReportPDF(revenueData);
          filename = `revenue-report-${startDate}-to-${endDate}.pdf`;
          mimeType = 'application/pdf';
        } else {
          const excelData = revenueTrips.map((trip: RevenueTrip) => ({
            period: trip.tripCode,
            booking_count: 1,
            revenue: trip.revenue,
          }));
          buffer = await ReportExporter.revenue(excelData);
          filename = `revenue-report-${startDate}-to-${endDate}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }
        break;
      }

      case 'pnl': {
        // Fetch P&L data from shadow_pnl or calculate from trips
        const { data: trips } = await client
          .from('trips')
          .select(`
            trip_code,
            packages!inner(name),
            bookings!inner(total_amount)
          `)
          .gte('start_date', startDate)
          .lte('start_date', endDate);

        const pnlTrips: PnlTrip[] = trips?.map((trip: any) => {
          const revenue = trip.bookings?.reduce(
            (sum: number, b: any) => sum + (b.total_amount || 0),
            0
          ) || 0;
          // Cost calculation would come from actual cost data
          const cost = revenue * 0.6; // Placeholder: 60% cost assumption
          const profit = revenue - cost;
          const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

          return {
            tripCode: trip.trip_code as string,
            revenue,
            cost,
            profit,
            margin,
          };
        }) || [];

        const totalRevenue = pnlTrips.reduce((sum: number, t: PnlTrip) => sum + t.revenue, 0);
        const totalCost = pnlTrips.reduce((sum: number, t: PnlTrip) => sum + t.cost, 0);
        const totalProfit = totalRevenue - totalCost;

        if (format === 'pdf') {
          buffer = await generatePnLReportPDF({
            startDate,
            endDate,
            totalRevenue,
            totalCost,
            totalProfit,
            trips: pnlTrips,
          });
          filename = `pnl-report-${startDate}-to-${endDate}.pdf`;
          mimeType = 'application/pdf';
        } else {
          const excelData = pnlTrips.map((trip: PnlTrip) => ({
            trip_code: trip.tripCode,
            package_name: 'Unknown',
            revenue: trip.revenue,
            cost: trip.cost,
            profit: trip.profit,
            margin: trip.margin / 100,
          }));
          buffer = await ReportExporter.pnl(excelData);
          filename = `pnl-report-${startDate}-to-${endDate}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }
        break;
      }

      case 'bookings': {
        // Fetch bookings data
        const { data: bookings } = await client
          .from('bookings')
          .select(`
            booking_code,
            customer_name,
            trip_date,
            adult_pax,
            child_pax,
            total_amount,
            status,
            packages!inner(name)
          `)
          .gte('trip_date', startDate)
          .lte('trip_date', endDate)
          .order('created_at', { ascending: false });

        const bookingsData: BookingData[] = bookings?.map((booking: any) => ({
          bookingCode: booking.booking_code as string,
          customerName: booking.customer_name as string,
          packageName: (booking.packages?.name as string) || 'Unknown',
          tripDate: booking.trip_date as string,
          pax: ((booking.adult_pax as number) || 0) + ((booking.child_pax as number) || 0),
          amount: (booking.total_amount as number) || 0,
          status: booking.status as string,
        })) || [];

        const totalAmount = bookingsData.reduce((sum: number, b: BookingData) => sum + b.amount, 0);

        if (format === 'pdf') {
          buffer = await generateBookingReportPDF({
            startDate,
            endDate,
            bookings: bookingsData,
            totalAmount,
            totalBookings: bookingsData.length,
          });
          filename = `booking-report-${startDate}-to-${endDate}.pdf`;
          mimeType = 'application/pdf';
        } else {
          const excelData = bookingsData.map((b: BookingData) => ({
            code: b.bookingCode,
            trip_date: b.tripDate,
            customer_name: b.customerName,
            package_name: b.packageName,
            total_pax: b.pax,
            total_amount: b.amount,
            status: b.status,
          }));
          buffer = await ReportExporter.bookings(excelData);
          filename = `booking-report-${startDate}-to-${endDate}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }
        break;
      }

      case 'customers': {
        // Fetch customer data
        const { data: customers } = await client
          .from('users')
          .select('full_name, email, phone, role')
          .eq('role', 'customer')
          .order('created_at', { ascending: false });

        // Get booking stats for each customer
        const customersWithStats = await Promise.all(
          (customers || []).map(async (customer: any) => {
            const { data: customerBookings } = await client
              .from('bookings')
              .select('total_amount, trip_date')
              .eq('customer_email', customer.email)
              .order('trip_date', { ascending: false });

            const totalBookings = customerBookings?.length || 0;
            const totalSpent = customerBookings?.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0) || 0;
            const lastBookingDate = customerBookings?.[0]?.trip_date || null;

            return {
              full_name: customer.full_name as string,
              email: customer.email as string,
              phone: customer.phone as string,
              total_bookings: totalBookings,
              total_spent: totalSpent,
              last_booking_date: lastBookingDate,
              segment: totalBookings >= 5 ? 'vip' : totalBookings >= 2 ? 'repeat' : 'new',
            };
          })
        );

        buffer = await ReportExporter.customers(customersWithStats);
        filename = `customer-list-${new Date().toISOString().split('T')[0]}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      }

      case 'guide-performance': {
        // Fetch guide performance data
        const { data: guides } = await client
          .from('users')
          .select('id, full_name')
          .eq('role', 'guide')
          .order('full_name', { ascending: true });

        const guidesWithStats = await Promise.all(
          (guides || []).map(async (guide: any) => {
            const { data: guideTrips } = await client
              .from('trips')
              .select('trip_code, start_date, bookings!inner(total_amount, adult_pax, child_pax)')
              .eq('guide_id', guide.id)
              .gte('start_date', startDate)
              .lte('start_date', endDate);

            const totalTrips = guideTrips?.length || 0;
            const totalPax = guideTrips?.reduce(
              (sum: number, trip: any) =>
                sum +
                (trip.bookings?.reduce(
                  (paxSum: number, b: any) => paxSum + ((b.adult_pax as number) || 0) + ((b.child_pax as number) || 0),
                  0
                ) || 0),
              0
            ) || 0;
            const totalRevenue = guideTrips?.reduce(
              (sum: number, trip: any) =>
                sum +
                (trip.bookings?.reduce((revSum: number, b: any) => revSum + ((b.total_amount as number) || 0), 0) || 0),
              0
            ) || 0;
            const lastTripDate = guideTrips?.[guideTrips.length - 1]?.start_date || null;

            // Average rating would come from reviews table
            const avgRating = 4.5; // Placeholder

            return {
              guide_name: (guide.full_name as string) || 'Unknown',
              total_trips: totalTrips,
              total_pax: totalPax,
              avg_rating: avgRating,
              total_revenue: totalRevenue,
              last_trip_date: lastTripDate,
            };
          })
        );

        buffer = await ReportExporter.guidePerformance(guidesWithStats);
        filename = `guide-performance-${startDate}-to-${endDate}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    // Return file as base64 for download
    const base64 = buffer.toString('base64');
    return NextResponse.json({
      success: true,
      filename,
      mimeType,
      data: base64,
    });
  } catch (error) {
    logger.error('Failed to generate report', error, {
      reportType,
      format,
      startDate,
      endDate,
    });
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
});
