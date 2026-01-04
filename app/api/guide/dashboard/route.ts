/**
 * API: Guide Dashboard Combined Endpoint
 * GET /api/guide/dashboard
 *
 * Returns all critical dashboard data in a single response to reduce API calls.
 * This endpoint combines: status, trips (limited), stats, and urgent notifications.
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { cacheKeys, cacheTTL, getCached } from '@/lib/cache/redis-cache';
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
  const tripsLimit = parseInt(searchParams.get('tripsLimit') || '20', 10);

  // Use cache for dashboard data (shorter TTL since data can change)
  const cacheKey = cacheKeys.guide.dashboard(user.id);
  const dashboardData = await getCached(
    cacheKey,
    cacheTTL.trips, // 2 minutes
    async () => {
      const branchContext = await getBranchContext(user.id);
      const client = supabase as unknown as any;

      // Fetch all data in parallel
      const [statusResult, tripsResult, statsResult, notificationsResult] =
        await Promise.all([
          // 1. Fetch status
          (async () => {
            let statusQuery = client
              .from('guide_status')
              .select('guide_id, current_status, note, updated_at')
              .eq('guide_id', user.id);
            if (!branchContext.isSuperAdmin && branchContext.branchId) {
              statusQuery = statusQuery.eq('branch_id', branchContext.branchId);
            }
            const { data: statusRow } = await statusQuery.maybeSingle();

            let availabilityQuery = client
              .from('guide_availability')
              .select('id, available_from, available_until, status, reason')
              .eq('guide_id', user.id)
              .gte('available_until', new Date().toISOString())
              .order('available_from', { ascending: true })
              .limit(3);
            if (!branchContext.isSuperAdmin && branchContext.branchId) {
              availabilityQuery = availabilityQuery.eq(
                'branch_id',
                branchContext.branchId
              );
            }
            const { data: upcoming } = await availabilityQuery;

            return {
              status: statusRow ?? {
                guide_id: user.id,
                current_status: 'standby',
                note: null,
                updated_at: null,
              },
              upcoming: upcoming ?? [],
            };
          })(),

          // 2. Fetch trips (limited)
          (async () => {
            // Get assignments from both trip_crews (new) and trip_guides (legacy)
            const tripCrewsQuery = client
              .from('trip_crews')
              .select('trip_id, role, status, assigned_at, confirmed_at')
              .eq('guide_id', user.id)
              .in('status', ['assigned', 'confirmed']);

            const { data: tripCrewsData, error: tripCrewsError } =
              await tripCrewsQuery;

            if (tripCrewsError) {
              logger.error('Failed to load trip_crews', tripCrewsError, {
                guideId: user.id,
              });
            }

            const tripGuidesQuery = client
              .from('trip_guides')
              .select(
                'trip_id, assignment_status, confirmation_deadline, confirmed_at, rejected_at, fee_amount'
              )
              .eq('guide_id', user.id)
              .in('assignment_status', ['confirmed', 'pending_confirmation']);

            const { data: tripGuidesData, error: tripGuidesError } =
              await tripGuidesQuery;

            if (tripGuidesError) {
              logger.error('Failed to load trip_guides', tripGuidesError, {
                guideId: user.id,
              });
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

            (tripCrewsData ?? []).forEach(
              (tc: {
                trip_id: string;
                role: 'lead' | 'support';
                status: string;
                assigned_at: string;
                confirmed_at: string | null;
              }) => {
                assignmentMap.set(tc.trip_id, {
                  assignment_status:
                    tc.status === 'confirmed'
                      ? 'confirmed'
                      : 'pending_confirmation',
                  confirmation_deadline: null,
                  confirmed_at: tc.confirmed_at,
                  rejected_at: null,
                  fee_amount: null,
                  role: tc.role,
                });
              }
            );

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
              return { trips: [] };
            }

            let tripsQuery = client
              .from('trips')
              .select(
                `
                id,
                trip_code,
                trip_date,
                status,
                total_pax,
                created_at,
                updated_at,
                package:packages(
                  id,
                  name,
                  destination,
                  city,
                  duration_days,
                  meeting_point
                )
                `
              )
              .in('id', tripIds)
              .order('trip_date', { ascending: false })
              .limit(tripsLimit);

            if (!branchContext.isSuperAdmin && branchContext.branchId) {
              tripsQuery = tripsQuery.eq('branch_id', branchContext.branchId);
            }

            const { data: tripsData, error: tripsError } = await tripsQuery;

            if (tripsError) {
              logger.error('Failed to load trips', tripsError, {
                guideId: user.id,
              });
              return { trips: [] };
            }

            const nowDate = new Date().toISOString().slice(0, 10);
            const trips = (tripsData ?? []).map((trip: any) => {
              const assignment = assignmentMap.get(trip.id) ?? {
                assignment_status: 'confirmed',
                confirmation_deadline: null,
                confirmed_at: null,
                rejected_at: null,
                fee_amount: null,
                role: null,
              };

              const packageData = trip.package as {
                id?: string;
                name?: string;
                destination?: string;
                city?: string;
                duration_days?: number;
                meeting_point?: string;
              } | null;

              // Calculate UI status
              const date = trip.trip_date ?? nowDate;
              const statusRaw = trip.status ?? 'scheduled';
              let uiStatus: 'ongoing' | 'upcoming' | 'completed' | 'cancelled' = 'upcoming';
              if (statusRaw === 'on_trip' || statusRaw === 'on_the_way' || statusRaw === 'preparing') {
                uiStatus = 'ongoing';
              } else if (statusRaw === 'completed') {
                uiStatus = 'completed';
              } else if (statusRaw === 'cancelled') {
                uiStatus = 'cancelled';
              } else {
                uiStatus = date >= nowDate ? 'upcoming' : 'completed';
              }

              return {
                id: trip.id,
                code: trip.trip_code ?? '',
                name: packageData?.name ?? trip.trip_code ?? 'Trip',
                date: trip.trip_date,
                guests: trip.total_pax ?? 0,
                status: uiStatus,
                destination: packageData?.destination ?? packageData?.city ?? null,
                duration: packageData?.duration_days ?? null,
                meeting_point: packageData?.meeting_point ?? null,
                created_at: trip.created_at,
                updated_at: trip.updated_at,
                assignment_status: assignment.assignment_status,
                confirmation_deadline: assignment.confirmation_deadline,
                confirmed_at: assignment.confirmed_at,
                rejected_at: assignment.rejected_at,
                fee_amount: assignment.fee_amount,
                crew_role: assignment.role ?? null,
              };
            });

            return { trips };
          })(),

          // 3. Fetch stats
          (async () => {
            // Get user join date
            const { data: userProfile } = await client
              .from('users')
              .select('created_at')
              .eq('id', user.id)
              .single();

            // Get total completed trips
            const { count: totalTrips, error: tripsError } = await client
              .from('trip_guides')
              .select('*', { count: 'exact', head: true })
              .eq('guide_id', user.id)
              .not('check_in_at', 'is', null)
              .not('check_out_at', 'is', null);

            if (tripsError) {
              logger.error('Failed to count trips', tripsError, {
                guideId: user.id,
              });
            }

            // Get average rating
            let averageRating = 0;
            let totalRatings = 0;

            try {
              const { data: guideTrips } = await client
                .from('trip_guides')
                .select('trip_id')
                .eq('guide_id', user.id)
                .not('check_in_at', 'is', null)
                .not('check_out_at', 'is', null);

              if (guideTrips && guideTrips.length > 0) {
                const tripIds = guideTrips.map(
                  (gt: { trip_id: string }) => gt.trip_id
                );

                const { data: tripBookings } = await client
                  .from('trip_bookings')
                  .select('booking_id')
                  .in('trip_id', tripIds);

                if (tripBookings && tripBookings.length > 0) {
                  const bookingIds = tripBookings.map(
                    (tb: { booking_id: string }) => tb.booking_id
                  );

                  const { data: reviewsData } = await client
                    .from('reviews')
                    .select('guide_rating')
                    .in('booking_id', bookingIds)
                    .not('guide_rating', 'is', null);

                  if (reviewsData && reviewsData.length > 0) {
                    const ratings = reviewsData
                      .map(
                        (r: { guide_rating: number | null }) => r.guide_rating
                      )
                      .filter((r: number | null): r is number => r !== null);

                    if (ratings.length > 0) {
                      totalRatings = ratings.length;
                      averageRating =
                        ratings.reduce(
                          (sum: number, rating: number) => sum + rating,
                          0
                        ) / ratings.length;
                    }
                  }
                }
              }
            } catch (error) {
              logger.warn('Error calculating average rating', {
                guideId: user.id,
                error,
              });
            }

            // Calculate completed trips this month
            const now = new Date();
            const yearMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            const { data: completedTrips } = await client
              .from('trip_guides')
              .select('trip_id, check_out_at')
              .eq('guide_id', user.id)
              .not('check_in_at', 'is', null)
              .not('check_out_at', 'is', null);

            const completedThisMonth =
              completedTrips?.filter(
                (trip: { check_out_at: string | null }) => {
                  if (!trip.check_out_at) return false;
                  const key = trip.check_out_at.slice(0, 7);
                  return key === yearMonthKey;
                }
              ).length ?? 0;

            return {
              averageRating,
              totalRatings,
              totalTrips: totalTrips ?? 0,
              completedThisMonth,
              joinDate: userProfile?.created_at,
            };
          })(),

          // 4. Fetch urgent notifications only
          (async () => {
            try {
              const { data: notifications } = await client
                .from('notifications')
                .select('id, type, title, message, created_at, read, is_urgent')
                .eq('user_id', user.id)
                .eq('read', false)
                .or(
                  'is_urgent.eq.true,type.eq.trip_assignment,type.eq.deadline'
                )
                .order('created_at', { ascending: false })
                .limit(10);

              return notifications ?? [];
            } catch (error) {
              logger.warn('Failed to fetch notifications', {
                guideId: user.id,
                error,
              });
              return [];
            }
          })(),
        ]);

      return {
        status: statusResult,
        trips: tripsResult,
        stats: statsResult,
        notifications: notificationsResult,
      };
    }
  );

  return NextResponse.json(dashboardData);
});
