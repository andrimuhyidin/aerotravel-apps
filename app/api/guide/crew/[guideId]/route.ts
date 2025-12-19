/**
 * API: Guide Profile Detail
 * GET /api/guide/crew/[guideId] - Get guide profile details
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ guideId: string }> }
) => {
  const { guideId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get guide profile from guide_profiles_public_internal
  const { data: profile, error: profileError } = await client
    .from('guide_profiles_public_internal')
    .select(`
      user_id,
      display_name,
      photo_url,
      badges,
      skills,
      current_availability,
      last_status_update,
      contact_enabled,
      is_active,
      updated_at,
      branch:branches(id, code, name)
    `)
    .eq('user_id', guideId)
    .maybeSingle();

  if (profileError) {
    logger.error('Failed to fetch guide profile', profileError, { guideId });
    return NextResponse.json({ error: 'Failed to fetch guide profile', details: (profileError as { message?: string })?.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
  }

  // Get user basic info
  const { data: userInfo, error: userError } = await client
    .from('users')
    .select('id, full_name, email, phone, role')
    .eq('id', guideId)
    .single();

  if (userError) {
    logger.warn('Failed to fetch user info', { error: userError, guideId });
  }

  // Get current trip assignments (if any)
  const { data: currentTrips, error: tripsError } = await client
    .from('trip_guides')
    .select(`
      id,
      trip_id,
      guide_role,
      assignment_status,
      trip:trips(id, trip_code, departure_date, return_date)
    `)
    .eq('guide_id', guideId)
    .in('assignment_status', ['confirmed', 'pending_confirmation'])
    .limit(5);

  if (tripsError) {
    logger.warn('Failed to fetch current trips', { error: tripsError, guideId });
  }

  // Normalize branch data (might be array from Supabase)
  let normalizedBranch = profile.branch;
  if (Array.isArray(profile.branch) && profile.branch.length > 0) {
    normalizedBranch = profile.branch[0] as { id: string; code: string; name: string };
  }

  // ============================================
  // HIGH VALUE: Get Guide Stats (Total Trips, Rating, Badges, Level)
  // ============================================
  let stats = null;
  try {
    // Get total completed trips
    const { count: totalTrips } = await client
      .from('trip_guides')
      .select('*', { count: 'exact', head: true })
      .eq('guide_id', guideId)
      .not('check_in_at', 'is', null)
      .not('check_out_at', 'is', null);

    // Get ratings
    let averageRating = 0;
    let totalRatings = 0;
    let ratingDistribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };

    const { data: guideTrips } = await client
      .from('trip_guides')
      .select('trip_id')
      .eq('guide_id', guideId);

    if (guideTrips && guideTrips.length > 0) {
      const tripIds = guideTrips.map((gt: { trip_id: string }) => gt.trip_id);
      const { data: tripBookings } = await client
        .from('trip_bookings')
        .select('booking_id')
        .in('trip_id', tripIds);

      if (tripBookings && tripBookings.length > 0) {
        const bookingIds = tripBookings.map((tb: { booking_id: string }) => tb.booking_id);
        const { data: reviewsData } = await client
          .from('reviews')
          .select('guide_rating')
          .in('booking_id', bookingIds)
          .not('guide_rating', 'is', null);

        if (reviewsData) {
          const ratings = reviewsData
            .map((r: { guide_rating: number | null }) => r.guide_rating)
            .filter((r: number | null) => r !== null && r > 0) as number[];

          totalRatings = ratings.length;
          if (ratings.length > 0) {
            averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
            
            // Calculate rating distribution
            ratings.forEach((rating: number) => {
              const rounded = Math.round(rating);
              const key = String(rounded) as keyof typeof ratingDistribution;
              if (key in ratingDistribution) {
                ratingDistribution[key]++;
              }
            });
          }
        }
      }
    }

    // Get user join date for years of experience
    const { data: userProfile } = await client
      .from('users')
      .select('created_at')
      .eq('id', guideId)
      .single();

    const joinDate = userProfile?.created_at ? new Date(userProfile.created_at) : null;
    const yearsOfExperience = joinDate
      ? Math.floor((new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
      : 0;

    // Calculate level (using gamification function logic)
    const totalTripsCount = totalTrips || 0;
    let currentLevel: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    if (totalTripsCount >= 100) currentLevel = 'platinum';
    else if (totalTripsCount >= 50) currentLevel = 'gold';
    else if (totalTripsCount >= 20) currentLevel = 'silver';

    stats = {
      totalTrips: totalTripsCount,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings,
      ratingDistribution,
      currentLevel,
      yearsOfExperience,
    };
  } catch (statsError) {
    logger.warn('Failed to fetch guide stats', { error: statsError, guideId });
  }

  // ============================================
  // HIGH VALUE: Get Guide Skills from guide_skills table
  // ============================================
  let guideSkills = null;
  try {
    const { data: skillsData } = await client
      .from('guide_skills')
      .select(`
        id,
        current_level,
        status,
        validated_at,
        skill:guide_skills_catalog(
          id,
          name,
          category,
          icon_name,
          requires_certification
        )
      `)
      .eq('guide_id', guideId)
      .in('status', ['claimed', 'validated'])
      .order('created_at', { ascending: false });

    if (skillsData) {
      guideSkills = skillsData.map((s: any) => {
        const skillCatalog = Array.isArray(s.skill) ? s.skill[0] : s.skill;
        return {
          id: s.id,
          name: skillCatalog?.name || 'Unknown',
          category: skillCatalog?.category || 'other',
          level: s.current_level,
          certified: skillCatalog?.requires_certification && s.status === 'validated',
          validated: s.status === 'validated',
        };
      });
    }
  } catch (skillsError) {
    logger.warn('Failed to fetch guide skills', { error: skillsError, guideId });
  }

  // ============================================
  // MEDIUM VALUE: Get Performance Tier
  // ============================================
  let performanceTier: 'excellent' | 'good' | 'average' | 'needs_improvement' | null = null;
  try {
    // Get latest performance metrics
    const { data: metrics } = await client
      .from('guide_performance_metrics')
      .select('performance_tier, overall_score')
      .eq('guide_id', guideId)
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (metrics?.performance_tier) {
      performanceTier = metrics.performance_tier as 'excellent' | 'good' | 'average' | 'needs_improvement';
    } else if (stats) {
      // Calculate tier from stats if metrics not available
      const ratingScore = stats.averageRating ? (stats.averageRating / 5) * 40 : 0;
      const tripsScore = Math.min((stats.totalTrips / 10) * 30, 30);
      const overallScore = ratingScore + tripsScore;
      
      if (overallScore >= 80) performanceTier = 'excellent';
      else if (overallScore >= 65) performanceTier = 'good';
      else if (overallScore >= 50) performanceTier = 'average';
      else performanceTier = 'needs_improvement';
    }
  } catch (tierError) {
    logger.warn('Failed to fetch performance tier', { error: tierError, guideId });
  }

  // ============================================
  // MEDIUM VALUE: Calculate Leaderboard Rank
  // ============================================
  let leaderboardRank: number | null = null;
  let totalGuidesInBranch = 0;
  try {
    // Get all guides in same branch
    const branchIdForQuery = normalizedBranch?.id || branchContext.branchId;
    if (!branchIdForQuery) {
      logger.warn('No branch ID available for leaderboard calculation', { guideId });
    } else {
      const { data: allGuides } = await client
        .from('users')
        .select('id')
        .eq('role', 'guide')
        .eq('branch_id', branchIdForQuery);

      totalGuidesInBranch = allGuides?.length || 0;

      if (totalGuidesInBranch > 0 && stats) {
        // Simplified ranking: Use performance metrics if available
        // Get all guides' latest metrics for comparison (join with users to filter by branch)
        const { data: allGuidesIds } = await client
          .from('users')
          .select('id')
          .eq('role', 'guide')
          .eq('branch_id', branchIdForQuery);

        if (allGuidesIds && allGuidesIds.length > 0) {
          const guideIds = allGuidesIds.map((g: { id: string }) => g.id);
          
          // Get latest metrics for all guides in branch
          const { data: metricsData } = await client
            .from('guide_performance_metrics')
            .select('guide_id, average_rating, overall_score, period_end')
            .in('guide_id', guideIds)
            .order('period_end', { ascending: false });

          if (metricsData && metricsData.length > 0) {
            // Group by guide_id and get latest metric for each guide
            const latestMetrics = new Map<string, { average_rating: number | null; overall_score: number | null }>();
            metricsData.forEach((m: { guide_id: string; average_rating: number | null; overall_score: number | null }) => {
              if (!latestMetrics.has(m.guide_id)) {
                latestMetrics.set(m.guide_id, { average_rating: m.average_rating, overall_score: m.overall_score });
              }
            });

            // Get current guide's metric
            const currentMetric = latestMetrics.get(guideId);
            
            if (currentMetric && currentMetric.overall_score !== null && currentMetric.overall_score !== undefined) {
              const currentScore = currentMetric.overall_score;
              // Count guides with better overall_score
              const betterCount = Array.from(latestMetrics.values()).filter((m) => {
                return m.overall_score !== null && m.overall_score !== undefined && m.overall_score > currentScore;
              }).length;
              leaderboardRank = betterCount + 1;
            } else if (currentMetric && currentMetric.average_rating !== null && stats.averageRating > 0) {
              // Fallback to rating comparison
              const betterCount = Array.from(latestMetrics.values()).filter((m) => {
                return m.average_rating !== null && m.average_rating > stats.averageRating;
              }).length;
              leaderboardRank = betterCount + 1;
            } else if (stats.averageRating > 0) {
              // No metrics for current guide, but we have rating - compare with others
              const betterCount = Array.from(latestMetrics.values()).filter((m) => {
                return m.average_rating !== null && m.average_rating > stats.averageRating;
              }).length;
              leaderboardRank = betterCount + 1;
            } else {
              // No metrics and no rating, use simple estimate
              leaderboardRank = Math.max(1, Math.floor(totalGuidesInBranch * 0.5));
            }
          } else {
            // No metrics available, use simple estimate based on trips
            // For now, estimate rank based on total trips (guides with more trips rank higher)
            leaderboardRank = Math.max(1, Math.floor(totalGuidesInBranch * 0.5));
          }

          // Ensure rank is within valid range
          if (leaderboardRank > totalGuidesInBranch) {
            leaderboardRank = totalGuidesInBranch;
          }
        }
      }
    }
  } catch (rankError) {
    logger.warn('Failed to calculate leaderboard rank', { error: rankError, guideId });
  }

  // ============================================
  // LOW VALUE: Get Trip Statistics (Favorite Destinations, Trip Types)
  // ============================================
  let tripStatistics = null;
  try {
    const { data: completedTrips } = await client
      .from('trip_guides')
      .select(`
        trip:trips(
          id,
          destination,
          package_id,
          package:packages(name, type)
        )
      `)
      .eq('guide_id', guideId)
      .not('check_in_at', 'is', null)
      .not('check_out_at', 'is', null)
      .limit(100);

    if (completedTrips && completedTrips.length > 0) {
      // Count destinations
      const destinationCount = new Map<string, number>();
      const tripTypeCount = new Map<string, number>();

      completedTrips.forEach((tg: { trip: any }) => {
        const trip = Array.isArray(tg.trip) ? tg.trip[0] : tg.trip;
        if (trip?.destination) {
          destinationCount.set(trip.destination, (destinationCount.get(trip.destination) || 0) + 1);
        }
        if (trip?.package) {
          const packageData = Array.isArray(trip.package) ? trip.package[0] : trip.package;
          const type = packageData?.type || 'other';
          tripTypeCount.set(type, (tripTypeCount.get(type) || 0) + 1);
        }
      });

      // Get top 3 destinations
      const topDestinations = Array.from(destinationCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([destination, count]) => ({ destination, count }));

      // Get trip types
      const tripTypes = Array.from(tripTypeCount.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({ type, count }));

      tripStatistics = {
        topDestinations,
        tripTypes,
        totalCompleted: completedTrips.length,
      };
    }
  } catch (tripStatsError) {
    logger.warn('Failed to fetch trip statistics', { error: tripStatsError, guideId });
  }

  return NextResponse.json({
    profile: {
      ...profile,
      branch: normalizedBranch,
    },
    user: userInfo || null,
    currentTrips: currentTrips || [],
    stats: stats || null,
    skills: guideSkills || [],
    performanceTier: performanceTier || null,
    leaderboardRank: leaderboardRank || null,
    totalGuidesInBranch: totalGuidesInBranch || 0,
    tripStatistics: tripStatistics || null,
  });
});
