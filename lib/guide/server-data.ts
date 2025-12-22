/**
 * Server-Side Data Fetching for Guide Dashboard
 * Prefetch critical data di server untuk faster initial render
 */

import 'server-only';

import { getBranchContext } from '@/lib/branch/branch-injection';
import { cacheKeys, cacheTTL, getCached } from '@/lib/cache/redis-cache';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import {
  calculateBadges,
  calculateLevel,
  calculateLevelProgress,
  getTripsNeededForNextLevel,
  type GuideStats,
} from './gamification';
import {
  awardPoints,
  calculateBadgePoints,
  calculateLevelUpPoints,
} from './reward-points';

/**
 * Fetch guide status data
 */
export async function fetchGuideStatus(userId: string) {
  try {
    const supabase = await createClient();
    const branchContext = await getBranchContext(userId);
    const client = supabase as unknown as any;

    let statusQuery = client
      .from('guide_status')
      .select('guide_id, current_status, note, updated_at')
      .eq('guide_id', userId);
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      statusQuery = statusQuery.eq('branch_id', branchContext.branchId);
    }
    const { data: statusRow } = await statusQuery.maybeSingle();

    let availabilityQuery = client
      .from('guide_availability')
      .select('id, available_from, available_until, status, reason')
      .eq('guide_id', userId)
      .gte('available_until', new Date().toISOString())
      .order('available_from', { ascending: true })
      .limit(3);
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      availabilityQuery = availabilityQuery.eq('branch_id', branchContext.branchId);
    }
    const { data: upcoming } = await availabilityQuery;

    return {
      status: statusRow ?? {
        guide_id: userId,
        current_status: 'standby' as const,
        note: null,
        updated_at: null,
      },
      upcoming: upcoming ?? [],
    };
  } catch (error) {
    logger.error('Failed to fetch guide status', error, { userId });
    return {
      status: {
        guide_id: userId,
        current_status: 'standby' as const,
        note: null,
        updated_at: null,
      },
      upcoming: [],
    };
  }
}

/**
 * Fetch guide trips data (limited for dashboard)
 */
export async function fetchGuideTrips(userId: string, limit = 20) {
  try {
    const cacheKey = cacheKeys.guide.trips(userId);
    const trips = await getCached(
      cacheKey,
      cacheTTL.trips,
      async () => {
        const supabase = await createClient();
        const branchContext = await getBranchContext(userId);
        const client = supabase as unknown as any;

        // Get assignments from both trip_crews (new) and trip_guides (legacy)
        const tripCrewsQuery = client
          .from('trip_crews')
          .select('trip_id, role, status, assigned_at, confirmed_at')
          .eq('guide_id', userId)
          .in('status', ['assigned', 'confirmed']);

        const { data: tripCrewsData, error: tripCrewsError } = await tripCrewsQuery;

        if (tripCrewsError) {
          logger.error('Failed to load trip_crews', tripCrewsError, { guideId: userId });
        }

        // trip_guides (legacy single-guide system)
        const tripGuidesQuery = client
          .from('trip_guides')
          .select('trip_id, assignment_status, confirmation_deadline, confirmed_at, rejected_at, fee_amount')
          .eq('guide_id', userId)
          .in('assignment_status', ['confirmed', 'pending_confirmation']);

        const { data: tripGuidesData, error: tripGuidesError } = await tripGuidesQuery;

        if (tripGuidesError) {
          logger.error('Failed to load trip_guides', tripGuidesError, { guideId: userId });
        }

        // Create map of trip_id -> assignment info
        type AssignmentInfo = {
          assignment_status: string;
          confirmation_deadline: string | null;
          confirmed_at: string | null;
          rejected_at: string | null;
          fee_amount: number | null;
          role?: 'lead' | 'support' | null;
        };

        const assignmentMap = new Map<string, AssignmentInfo>();

        // Add trip_crews assignments
        (tripCrewsData ?? []).forEach(
          (tc: {
            trip_id: string;
            role: 'lead' | 'support';
            status: string;
            assigned_at: string;
            confirmed_at: string | null;
          }) => {
            assignmentMap.set(tc.trip_id, {
              assignment_status: tc.status === 'confirmed' ? 'confirmed' : 'pending_confirmation',
              confirmation_deadline: null,
              confirmed_at: tc.confirmed_at,
              rejected_at: null,
              fee_amount: null,
              role: tc.role,
            });
          }
        );

        // Add trip_guides assignments (legacy, don't override if already in map)
        (tripGuidesData ?? []).forEach(
          (tg: {
            trip_id: string;
            assignment_status: string;
            confirmation_deadline: string | null;
            confirmed_at: string | null;
            rejected_at: string | null;
            fee_amount: number | null;
          }) => {
            if (!assignmentMap.has(tg.trip_id)) {
              assignmentMap.set(tg.trip_id, {
                assignment_status: tg.assignment_status,
                confirmation_deadline: tg.confirmation_deadline,
                confirmed_at: tg.confirmed_at,
                rejected_at: tg.rejected_at,
                fee_amount: tg.fee_amount,
              });
            }
          }
        );

        const tripIds = Array.from(assignmentMap.keys());

        if (tripIds.length === 0) {
          return [];
        }

        // Get trips with branch filter - use nested select with packages like working API route
        let tripsQuery = client
          .from('trips')
          .select(
            `
            id,
            trip_code,
            trip_date,
            status,
            total_pax,
            package:packages(
              id,
              name,
              destination,
              city,
              duration_days,
              meeting_point
            )
          `,
          )
          .in('id', tripIds);

        if (!branchContext.isSuperAdmin && branchContext.branchId) {
          tripsQuery = tripsQuery.eq('branch_id', branchContext.branchId);
        }

        const { data: tripsData, error: tripsError } = await tripsQuery.order('trip_date', { ascending: true });

        if (tripsError) {
          logger.error('Failed to load trips', tripsError, { guideId: userId });
          return [];
        }

        // Map trips data to match component expectations (same structure as working API route)
        const nowDate = new Date().toISOString().slice(0, 10);
        
        const mappedTrips = (tripsData ?? []).map((trip: {
          id: string;
          trip_code: string | null;
          trip_date: string | null;
          status: string | null;
          total_pax: number | null;
          package?: {
            id?: string | null;
            name?: string | null;
            destination?: string | null;
            city?: string | null;
            duration_days?: number | null;
            meeting_point?: string | null;
          } | null;
        }) => {
          const date = trip.trip_date ?? nowDate;
          const statusRaw = trip.status ?? 'scheduled';

          // Determine UI status
          let uiStatus: 'ongoing' | 'upcoming' | 'completed' | 'cancelled' = 'upcoming';
          if (statusRaw === 'on_trip' || statusRaw === 'on_the_way' || statusRaw === 'preparing') {
            uiStatus = 'ongoing';
          } else if (statusRaw === 'completed') {
            uiStatus = 'completed';
          } else if (statusRaw === 'cancelled') {
            uiStatus = 'cancelled';
          } else {
            // scheduled: compare date
            uiStatus = date >= nowDate ? 'upcoming' : 'completed';
          }

          const assignment = assignmentMap.get(trip.id) || null;
          const crewRole = assignment?.role ?? null;
          
          const packageData = trip.package;

          return {
            id: trip.id,
            code: trip.trip_code ?? '',
            name: packageData?.name ?? trip.trip_code ?? 'Trip',
            date,
            guests: trip.total_pax ?? 0,
            status: uiStatus,
            assignment_status: assignment?.assignment_status || null,
            confirmation_deadline: assignment?.confirmation_deadline || null,
            confirmed_at: assignment?.confirmed_at || null,
            rejected_at: assignment?.rejected_at || null,
            fee_amount: assignment?.fee_amount ?? null,
            // Additional details for enhanced display
            destination: packageData?.destination ?? packageData?.city ?? null,
            duration: packageData?.duration_days ?? null,
            meeting_point: packageData?.meeting_point ?? null,
            crew_role: crewRole,
            // Keep trip_code for compatibility
            trip_code: trip.trip_code ?? '',
          };
        });
        
        return mappedTrips;
      }
    );

    return { trips };
  } catch (error) {
    logger.error('Failed to fetch guide trips', error, { userId });
    return { trips: [] };
  }
}

/**
 * Fetch guide stats data
 */
export async function fetchGuideStats(userId: string) {
  try {
    const stats = await getCached(
      cacheKeys.guide.stats(userId),
      cacheTTL.stats,
      async () => {
        const supabase = await createClient();
        const branchContext = await getBranchContext(userId);
        const client = supabase as unknown as any;

        // Get user join date from users table
        const { data: userProfile } = await client
          .from('users')
          .select('created_at')
          .eq('id', userId)
          .single();

        // Get total completed trips
        const { count: totalTrips, error: tripsError } = await client
          .from('trip_guides')
          .select('*', { count: 'exact', head: true })
          .eq('guide_id', userId)
          .not('check_in_at', 'is', null)
          .not('check_out_at', 'is', null);

        if (tripsError) {
          logger.error('Failed to count trips', tripsError, { guideId: userId });
        }

        // Get average rating from reviews
        let averageRating = 0;
        let totalRatings = 0;

        try {
          // Step 1: Get trip IDs for this guide (only completed trips)
          const { data: guideTrips } = await client
            .from('trip_guides')
            .select('trip_id')
            .eq('guide_id', userId)
            .not('check_in_at', 'is', null)
            .not('check_out_at', 'is', null);

          if (guideTrips && guideTrips.length > 0) {
            const tripIds = guideTrips.map((gt: { trip_id: string }) => gt.trip_id);

            // Step 2: Get booking IDs for these trips via trip_bookings
            const { data: tripBookings } = await client
              .from('trip_bookings')
              .select('booking_id')
              .in('trip_id', tripIds);

            if (tripBookings && tripBookings.length > 0) {
              const bookingIds = tripBookings.map((tb: { booking_id: string }) => tb.booking_id);

              // Step 3: Get reviews for these bookings with guide_rating
              const { data: reviewsData, error: reviewsQueryError } = await client
                .from('reviews')
                .select('guide_rating')
                .in('booking_id', bookingIds)
                .not('guide_rating', 'is', null);

              if (reviewsQueryError) {
                logger.warn('Failed to fetch reviews for stats', {
                  guideId: userId,
                  error: reviewsQueryError,
                });
              } else if (reviewsData && reviewsData.length > 0) {
                const ratings = reviewsData
                  .map((r: { guide_rating: number | null }) => r.guide_rating)
                  .filter((r: number | null): r is number => r !== null);

                if (ratings.length > 0) {
                  totalRatings = ratings.length;
                  averageRating = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length;
                }
              }
            }
          }
        } catch (error) {
          logger.warn('Error calculating average rating', { guideId: userId, error });
        }

        // Calculate completed trips this month
        const now = new Date();
        const yearMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const { data: completedTrips } = await client
          .from('trip_guides')
          .select('trip_id, check_out_at')
          .eq('guide_id', userId)
          .not('check_in_at', 'is', null)
          .not('check_out_at', 'is', null);

        const completedThisMonth =
          completedTrips?.filter((trip: { check_out_at: string | null }) => {
            if (!trip.check_out_at) return false;
            const key = trip.check_out_at.slice(0, 7);
            return key === yearMonthKey;
          }).length ?? 0;

        // Calculate level and badges
        const level = calculateLevel(totalTrips ?? 0);
        const badges = calculateBadges({
          totalTrips: totalTrips ?? 0,
          averageRating,
          totalRatings,
          complaints: 0, // TODO: Calculate from complaints table
          penalties: 0, // TODO: Calculate from penalties table
        });
        const levelProgress = calculateLevelProgress(totalTrips ?? 0, level);
        const tripsNeededForNextLevel = getTripsNeededForNextLevel(totalTrips ?? 0, level);

        // Return stats (points calculation is done separately via API)
        return {
          averageRating,
          totalRatings,
          totalTrips: totalTrips ?? 0,
          completedThisMonth,
          joinDate: userProfile?.created_at,
          level,
          badges,
          levelProgress,
          tripsNeededForNextLevel,
        } as {
          averageRating: number;
          totalRatings: number;
          totalTrips: number;
          completedThisMonth: number;
          joinDate?: string;
        };
      }
    );

    return {
      averageRating: stats.averageRating ?? 0,
      totalRatings: stats.totalRatings ?? 0,
      totalTrips: stats.totalTrips ?? 0,
      completedThisMonth: stats.completedThisMonth ?? 0,
      joinDate: stats.joinDate,
    };
  } catch (error) {
    logger.error('Failed to fetch guide stats', error, { userId });
    return {
      averageRating: 0,
      totalRatings: 0,
      totalTrips: 0,
      completedThisMonth: 0,
    };
  }
}

/**
 * Fetch all critical dashboard data in parallel
 */
export async function fetchGuideDashboardData(userId: string) {
  try {
    // Fetch all critical data in parallel
    const [statusData, tripsData, statsData] = await Promise.all([
      fetchGuideStatus(userId),
      fetchGuideTrips(userId, 20),
      fetchGuideStats(userId),
    ]);

    return {
      status: statusData,
      trips: tripsData,
      stats: statsData,
    };
  } catch (error) {
    logger.error('Failed to fetch guide dashboard data', error, { userId });
    return {
      status: {
        status: {
          guide_id: userId,
          current_status: 'standby' as const,
          note: null,
          updated_at: null,
        },
        upcoming: [],
      },
      trips: { trips: [] },
      stats: {
        averageRating: 0,
        totalRatings: 0,
        totalTrips: 0,
        completedThisMonth: 0,
      },
    };
  }
}

