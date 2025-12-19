/**
 * API: Guide Monthly Insights
 * GET /api/guide/insights/monthly - Get monthly summary for guide (trips, guests, income, penalties, rating)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
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

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month'); // Format: YYYY-MM

  // Get date range for selected month
  let startDate: Date;
  let endDate: Date;

  if (monthParam) {
    const parts = monthParam.split('-');
    const year = parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
    const month = parts[1] ? parseInt(parts[1], 10) : new Date().getMonth() + 1;
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59);
  } else {
    // Default to current month
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Get total trips in this month
    let totalTripsQuery = client.from('trip_guides')
      .select('*', { count: 'exact', head: true })
      .eq('guide_id', user.id)
      .gte('check_in_at', startDate.toISOString())
      .lte('check_in_at', endDate.toISOString())
      .not('check_in_at', 'is', null)
      .not('check_out_at', 'is', null);
    
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      totalTripsQuery = totalTripsQuery.eq('branch_id', branchContext.branchId);
    }
    
    const { count: totalTrips } = await totalTripsQuery;

    // Get trip IDs for this guide in this month
    let tripGuidesQuery = client.from('trip_guides')
      .select('trip_id')
      .eq('guide_id', user.id)
      .gte('check_in_at', startDate.toISOString())
      .lte('check_in_at', endDate.toISOString())
      .not('check_in_at', 'is', null)
      .not('check_out_at', 'is', null);
    
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      tripGuidesQuery = tripGuidesQuery.eq('branch_id', branchContext.branchId);
    }
    
    const { data: tripGuides } = await tripGuidesQuery;

    const tripIds = tripGuides?.map((tg: { trip_id: string }) => tg.trip_id) || [];

    // Get trips with package info for breakdown
    let tripsWithPackageQuery = client.from('trips')
      .select('id, package_id, package:packages(id, name, city)')
      .in('id', tripIds);
    
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      tripsWithPackageQuery = tripsWithPackageQuery.eq('branch_id', branchContext.branchId);
    }
    
    const { data: tripsWithPackage } = await tripsWithPackageQuery;

    // Get total guests (from bookings in these trips)
    let totalGuests = 0;
    if (tripIds.length > 0) {
      let tripBookingsQuery = client.from('trip_bookings')
        .select('booking_id')
        .in('trip_id', tripIds);
      
      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        tripBookingsQuery = tripBookingsQuery.eq('branch_id', branchContext.branchId);
      }
      
      const { data: tripBookings } = await tripBookingsQuery;

      if (tripBookings && tripBookings.length > 0) {
        const bookingIds = tripBookings.map((tb: { booking_id: string }) => tb.booking_id);

        const { data: bookings } = await client
          .from('bookings')
          .select('adult_pax, child_pax, infant_pax')
          .in('id', bookingIds);

        if (bookings) {
          totalGuests = bookings.reduce(
            (sum: number, b: { adult_pax: number; child_pax: number; infant_pax: number }) => {
              return sum + (b.adult_pax || 0) + (b.child_pax || 0) + (b.infant_pax || 0);
            },
            0,
          );
        }
      }
    }

    // Get total income/earnings (from guide_wallet_transactions)
    let totalIncome = 0;

    // First get wallet_id
    let walletQuery = client.from('guide_wallets')
      .select('id')
      .eq('guide_id', user.id);
    
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      walletQuery = walletQuery.eq('branch_id', branchContext.branchId);
    }
    
    const { data: wallet } = await walletQuery.single();

    if (wallet) {
      const { data: incomeTransactions } = await client
        .from('guide_wallet_transactions')
        .select('amount, transaction_type')
        .eq('wallet_id', (wallet as { id: string }).id)
        .eq('transaction_type', 'earning')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (incomeTransactions) {
        totalIncome = incomeTransactions.reduce(
          (sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0),
          0,
        );
      }
    }

    // Get total penalties
    let totalPenalties = 0;
    let penaltiesQuery = client.from('salary_deductions')
      .select('amount')
      .eq('guide_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      penaltiesQuery = penaltiesQuery.eq('branch_id', branchContext.branchId);
    }
    
    const { data: penalties } = await penaltiesQuery;

    if (penalties) {
      totalPenalties = penalties.reduce((sum: number, p: { amount: number }) => {
        return sum + (Number(p.amount) || 0);
      }, 0);
    }

    // Get average rating for trips in this month
    let averageRating = 0;
    let totalRatings = 0;

    if (tripIds.length > 0) {
      let tripBookingsQuery2 = client.from('trip_bookings')
        .select('booking_id')
        .in('trip_id', tripIds);
      
      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        tripBookingsQuery2 = tripBookingsQuery2.eq('branch_id', branchContext.branchId);
      }
      
      const { data: tripBookings } = await tripBookingsQuery2;

      if (tripBookings && tripBookings.length > 0) {
        const bookingIds = tripBookings.map((tb: { booking_id: string }) => tb.booking_id);

        const { data: reviews } = await client
          .from('reviews')
          .select('guide_rating')
          .in('booking_id', bookingIds)
          .not('guide_rating', 'is', null);

        if (reviews) {
          const ratings = reviews
            .map((r: { guide_rating: number | null }) => r.guide_rating)
            .filter((r: number | null): r is number => r !== null && r > 0);

          totalRatings = ratings.length;
          if (ratings.length > 0) {
            averageRating = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;
          }
        }
      }
    }

    // Get weekly breakdown for chart (4 weeks)
    const weeks: Array<{
      week: number;
      weekStart: string;
      weekEnd: string;
      trips: number;
      guests: number;
      income: number;
      penalties: number;
    }> = [];

    for (let week = 1; week <= 4; week++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (week - 1) * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      if (weekEnd > endDate) {
        weekEnd.setTime(endDate.getTime());
      }

      // Count trips in this week
      let weekTripsQuery = client.from('trip_guides')
        .select('*', { count: 'exact', head: true })
        .eq('guide_id', user.id)
        .gte('check_in_at', weekStart.toISOString())
        .lte('check_in_at', weekEnd.toISOString())
        .not('check_in_at', 'is', null)
        .not('check_out_at', 'is', null);
      
      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        weekTripsQuery = weekTripsQuery.eq('branch_id', branchContext.branchId);
      }
      
      const { count: weekTrips } = await weekTripsQuery;

      // Get week trip IDs for guests count
      let weekTripGuidesQuery = client.from('trip_guides')
        .select('trip_id')
        .eq('guide_id', user.id)
        .gte('check_in_at', weekStart.toISOString())
        .lte('check_in_at', weekEnd.toISOString())
        .not('check_in_at', 'is', null)
        .not('check_out_at', 'is', null);
      
      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        weekTripGuidesQuery = weekTripGuidesQuery.eq('branch_id', branchContext.branchId);
      }
      
      const { data: weekTripGuides } = await weekTripGuidesQuery;

      let weekGuests = 0;
      if (weekTripGuides && weekTripGuides.length > 0) {
        const weekTripIds = weekTripGuides.map((tg: { trip_id: string }) => tg.trip_id);

        let weekTripBookingsQuery = client.from('trip_bookings')
          .select('booking_id')
          .in('trip_id', weekTripIds);
        
        if (!branchContext.isSuperAdmin && branchContext.branchId) {
          weekTripBookingsQuery = weekTripBookingsQuery.eq('branch_id', branchContext.branchId);
        }
        
        const { data: weekTripBookings } = await weekTripBookingsQuery;

        if (weekTripBookings && weekTripBookings.length > 0) {
          const weekBookingIds = weekTripBookings.map((tb: { booking_id: string }) => tb.booking_id);

          const { data: weekBookings } = await client
            .from('bookings')
            .select('adult_pax, child_pax, infant_pax')
            .in('id', weekBookingIds);

          if (weekBookings) {
            weekGuests = weekBookings.reduce(
              (sum: number, b: { adult_pax: number; child_pax: number; infant_pax: number }) => {
                return sum + (b.adult_pax || 0) + (b.child_pax || 0) + (b.infant_pax || 0);
              },
              0,
            );
          }
        }
      }

      // Get week income
      let weekIncome = 0;
      if (wallet) {
        const { data: weekIncomeTransactions } = await client
          .from('guide_wallet_transactions')
          .select('amount')
          .eq('wallet_id', (wallet as { id: string }).id)
          .eq('transaction_type', 'earning')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString());

        weekIncome =
          weekIncomeTransactions?.reduce((sum: number, t: { amount: number }) => {
            return sum + (Number(t.amount) || 0);
          }, 0) || 0;
      }


      // Get week penalties
      let weekPenaltiesQuery = client.from('salary_deductions')
        .select('amount')
        .eq('guide_id', user.id)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());
      
      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        weekPenaltiesQuery = weekPenaltiesQuery.eq('branch_id', branchContext.branchId);
      }
      
      const { data: weekPenalties } = await weekPenaltiesQuery;

      const weekPenaltiesAmount =
        weekPenalties?.reduce((sum: number, p: { amount: number }) => {
          return sum + (Number(p.amount) || 0);
        }, 0) || 0;

      weeks.push({
        week,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        trips: weekTrips || 0,
        guests: weekGuests,
        income: weekIncome,
        penalties: weekPenaltiesAmount,
      });
    }

    // Get previous month data for comparison (if not current month)
    let previousMonthSummary: {
      totalTrips: number;
      totalGuests: number;
      totalIncome: number;
      totalPenalties: number;
      averageRating: number;
      totalRatings: number;
    } | undefined;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const isCurrentMonth = monthParam === currentMonth || !monthParam;

    if (!isCurrentMonth) {
      // Calculate previous month
      const monthParts = (monthParam || currentMonth).split('-');
      const year = monthParts[0] ? Number(monthParts[0]) : now.getFullYear();
      const month = monthParts[1] ? Number(monthParts[1]) : now.getMonth() + 1;
      const prevStartDate = new Date(year, month - 2, 1);
      const prevEndDate = new Date(year, month - 1, 0, 23, 59, 59);

      // Get previous month trips
      let prevTotalTripsQuery = client.from('trip_guides')
        .select('*', { count: 'exact', head: true })
        .eq('guide_id', user.id)
        .gte('check_in_at', prevStartDate.toISOString())
        .lte('check_in_at', prevEndDate.toISOString())
        .not('check_in_at', 'is', null)
        .not('check_out_at', 'is', null);
      
      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        prevTotalTripsQuery = prevTotalTripsQuery.eq('branch_id', branchContext.branchId);
      }
      
      const { count: prevTotalTrips } = await prevTotalTripsQuery;

      // Get previous month trip IDs
      let prevTripGuidesQuery = client.from('trip_guides')
        .select('trip_id')
        .eq('guide_id', user.id)
        .gte('check_in_at', prevStartDate.toISOString())
        .lte('check_in_at', prevEndDate.toISOString())
        .not('check_in_at', 'is', null)
        .not('check_out_at', 'is', null);
      
      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        prevTripGuidesQuery = prevTripGuidesQuery.eq('branch_id', branchContext.branchId);
      }
      
      const { data: prevTripGuides } = await prevTripGuidesQuery;
      const prevTripIds = prevTripGuides?.map((tg: { trip_id: string }) => tg.trip_id) || [];

      // Get previous month guests
      let prevTotalGuests = 0;
      if (prevTripIds.length > 0) {
        let prevTripBookingsQuery = client.from('trip_bookings')
          .select('booking_id')
          .in('trip_id', prevTripIds);
        
        if (!branchContext.isSuperAdmin && branchContext.branchId) {
          prevTripBookingsQuery = prevTripBookingsQuery.eq('branch_id', branchContext.branchId);
        }
        
        const { data: prevTripBookings } = await prevTripBookingsQuery;

        if (prevTripBookings && prevTripBookings.length > 0) {
          const prevBookingIds = prevTripBookings.map((tb: { booking_id: string }) => tb.booking_id);

          const { data: prevBookings } = await client
            .from('bookings')
            .select('adult_pax, child_pax, infant_pax')
            .in('id', prevBookingIds);

          if (prevBookings) {
            prevTotalGuests = prevBookings.reduce(
              (sum: number, b: { adult_pax: number; child_pax: number; infant_pax: number }) => {
                return sum + (b.adult_pax || 0) + (b.child_pax || 0) + (b.infant_pax || 0);
              },
              0,
            );
          }
        }
      }

      // Get previous month income
      let prevTotalIncome = 0;
      if (wallet) {
        const { data: prevIncomeTransactions } = await client
          .from('guide_wallet_transactions')
          .select('amount, transaction_type')
          .eq('wallet_id', (wallet as { id: string }).id)
          .eq('transaction_type', 'earning')
          .gte('created_at', prevStartDate.toISOString())
          .lte('created_at', prevEndDate.toISOString());

        if (prevIncomeTransactions) {
          prevTotalIncome = prevIncomeTransactions.reduce(
            (sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0),
            0,
          );
        }
      }

      // Get previous month penalties
      let prevTotalPenalties = 0;
      let prevPenaltiesQuery = client.from('salary_deductions')
        .select('amount')
        .eq('guide_id', user.id)
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString());
      
      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        prevPenaltiesQuery = prevPenaltiesQuery.eq('branch_id', branchContext.branchId);
      }
      
      const { data: prevPenalties } = await prevPenaltiesQuery;

      if (prevPenalties) {
        prevTotalPenalties = prevPenalties.reduce((sum: number, p: { amount: number }) => {
          return sum + (Number(p.amount) || 0);
        }, 0);
      }

      // Get previous month rating
      let prevAverageRating = 0;
      let prevTotalRatings = 0;

      if (prevTripIds.length > 0) {
        let prevTripBookingsQuery2 = client.from('trip_bookings')
          .select('booking_id')
          .in('trip_id', prevTripIds);
        
        if (!branchContext.isSuperAdmin && branchContext.branchId) {
          prevTripBookingsQuery2 = prevTripBookingsQuery2.eq('branch_id', branchContext.branchId);
        }
        
        const { data: prevTripBookings2 } = await prevTripBookingsQuery2;

        if (prevTripBookings2 && prevTripBookings2.length > 0) {
          const prevBookingIds = prevTripBookings2.map((tb: { booking_id: string }) => tb.booking_id);

          const { data: prevReviews } = await client
            .from('reviews')
            .select('guide_rating')
            .in('booking_id', prevBookingIds)
            .not('guide_rating', 'is', null);

          if (prevReviews) {
            const prevRatings = prevReviews
              .map((r: { guide_rating: number | null }) => r.guide_rating)
              .filter((r: number | null): r is number => r !== null && r > 0);

            prevTotalRatings = prevRatings.length;
            if (prevRatings.length > 0) {
              prevAverageRating = prevRatings.reduce((sum: number, r: number) => sum + r, 0) / prevRatings.length;
            }
          }
        }
      }

      previousMonthSummary = {
        totalTrips: prevTotalTrips || 0,
        totalGuests: prevTotalGuests,
        totalIncome: prevTotalIncome,
        totalPenalties: prevTotalPenalties,
        averageRating: Math.round(prevAverageRating * 10) / 10,
        totalRatings: prevTotalRatings,
      };
    }

    // Calculate breakdown by package/destination
    const packageBreakdown: Array<{
      packageId: string | null;
      packageName: string;
      city: string | null;
      trips: number;
      guests: number;
      income: number;
    }> = [];

    if (tripsWithPackage && tripsWithPackage.length > 0) {
      // Group trips by package
      const packageMap = new Map<string, {
        packageId: string | null;
        packageName: string;
        city: string | null;
        tripIds: string[];
      }>();

      for (const trip of tripsWithPackage) {
        const tripData = trip as {
          id: string;
          package_id: string | null;
          package?: {
            id: string;
            name: string | null;
            city: string | null;
          } | null;
        };

        const packageId = tripData.package_id || 'unknown';
        const packageName = tripData.package?.name || 'Paket Lainnya';
        const city = tripData.package?.city || null;

        if (!packageMap.has(packageId)) {
          packageMap.set(packageId, {
            packageId: tripData.package_id,
            packageName,
            city,
            tripIds: [],
          });
        }

        packageMap.get(packageId)!.tripIds.push(tripData.id);
      }

      // Calculate metrics for each package
      for (const [packageId, packageInfo] of packageMap.entries()) {
        const packageTripIds = packageInfo.tripIds;

        // Count trips
        const packageTrips = packageTripIds.length;

        // Count guests for this package
        let packageGuests = 0;
        if (packageTripIds.length > 0) {
          let packageTripBookingsQuery = client.from('trip_bookings')
            .select('booking_id')
            .in('trip_id', packageTripIds);
          
          if (!branchContext.isSuperAdmin && branchContext.branchId) {
            packageTripBookingsQuery = packageTripBookingsQuery.eq('branch_id', branchContext.branchId);
          }
          
          const { data: packageTripBookings } = await packageTripBookingsQuery;

          if (packageTripBookings && packageTripBookings.length > 0) {
            const packageBookingIds = packageTripBookings.map((tb: { booking_id: string }) => tb.booking_id);

            const { data: packageBookings } = await client
              .from('bookings')
              .select('adult_pax, child_pax, infant_pax')
              .in('id', packageBookingIds);

            if (packageBookings) {
              packageGuests = packageBookings.reduce(
                (sum: number, b: { adult_pax: number; child_pax: number; infant_pax: number }) => {
                  return sum + (b.adult_pax || 0) + (b.child_pax || 0) + (b.infant_pax || 0);
                },
                0,
              );
            }
          }
        }

        // Calculate income for this package
        let packageIncome = 0;
        if (wallet && packageTripIds.length > 0) {
          // Get guide fee for trips in this package
          let packageTripGuidesQuery = client.from('trip_guides')
            .select('fee_amount')
            .eq('guide_id', user.id)
            .in('trip_id', packageTripIds)
            .gte('check_in_at', startDate.toISOString())
            .lte('check_in_at', endDate.toISOString());
          
          if (!branchContext.isSuperAdmin && branchContext.branchId) {
            packageTripGuidesQuery = packageTripGuidesQuery.eq('branch_id', branchContext.branchId);
          }
          
          const { data: packageTripGuides } = await packageTripGuidesQuery;

          if (packageTripGuides) {
            packageIncome = packageTripGuides.reduce(
              (sum: number, tg: { fee_amount: number | null }) => sum + (Number(tg.fee_amount) || 0),
              0,
            );
          }
        }

        packageBreakdown.push({
          packageId: packageInfo.packageId,
          packageName: packageInfo.packageName,
          city: packageInfo.city,
          trips: packageTrips,
          guests: packageGuests,
          income: packageIncome,
        });
      }

      // Sort by trips (descending)
      packageBreakdown.sort((a, b) => b.trips - a.trips);
    }

    return NextResponse.json({
      month: monthParam || new Date().toISOString().slice(0, 7),
      summary: {
        totalTrips: totalTrips || 0,
        totalGuests,
        totalIncome,
        totalPenalties,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
      },
      previousMonth: previousMonthSummary,
      weeklyBreakdown: weeks,
      packageBreakdown: packageBreakdown.slice(0, 10), // Top 10 packages
    });
  } catch (error) {
    logger.error('Failed to fetch monthly insights', error, { guideId: user.id, month: monthParam });
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
  }
});
