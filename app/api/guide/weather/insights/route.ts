/**
 * API: AI-Powered Weather Insights
 * GET /api/guide/weather/insights?lat=...&lng=...
 * 
 * Uses Google Gemini AI to provide weather-based recommendations:
 * - Safety recommendations
 * - Trip planning advice
 * - Equipment/clothing suggestions
 * - Sea condition predictions
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  // Get authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get branch context for data filtering
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Fetch upcoming trips (next 7 days) untuk trip-aware insights
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    let upcomingTripsQuery = client
      .from('trip_guides')
      .select(`
        trip_id,
        trip:trips(
          id,
          trip_code,
          trip_date,
          departure_time,
          package:packages(
            id,
            name,
            destination,
            city,
            package_type,
            duration_days,
            meeting_point,
            meeting_point_lat,
            meeting_point_lng
          )
        )
      `)
      .eq('guide_id', user.id)
      .gte('trip_date', today.toISOString().split('T')[0])
      .lte('trip_date', sevenDaysLater.toISOString().split('T')[0])
      .in('assignment_status', ['confirmed', 'pending_confirmation']);

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      upcomingTripsQuery = upcomingTripsQuery.eq('branch_id', branchContext.branchId);
    }

    const { data: upcomingTripsData, error: tripsError } = await upcomingTripsQuery;

    if (tripsError) {
      logger.warn('Failed to fetch upcoming trips for weather insights', { error: tripsError, guideId: user.id });
    }

    const upcomingTrips = (upcomingTripsData || [])
      .map((tg: {
        trip_id: string;
        trip: {
          id: string;
          trip_code: string | null;
          trip_date: string | null;
          departure_time: string | null;
          package: {
            id: string;
            name: string | null;
            destination: string | null;
            city: string | null;
            package_type: string | null;
            duration_days: number | null;
            meeting_point: string | null;
            meeting_point_lat: number | null;
            meeting_point_lng: number | null;
          } | null;
        } | null;
      }) => {
        if (!tg.trip) return null;
        const pkg = tg.trip.package;
        return {
          tripId: tg.trip.id,
          tripCode: tg.trip.trip_code || '',
          tripDate: tg.trip.trip_date || '',
          departureTime: tg.trip.departure_time || null,
          destination: pkg?.destination || '',
          city: pkg?.city || '',
          packageType: pkg?.package_type || null,
          durationDays: pkg?.duration_days || 1,
          meetingPoint: pkg?.meeting_point || null,
          lat: pkg?.meeting_point_lat || null,
          lng: pkg?.meeting_point_lng || null,
        };
      })
      .filter((t: unknown): t is NonNullable<typeof t> => t !== null);

    type UpcomingTrip = {
      tripId: string;
      tripCode: string;
      tripDate: string;
      departureTime: string | null;
      destination: string;
      city: string;
      packageType: string | null;
      durationDays: number;
      meetingPoint: string | null;
      lat: number | null;
      lng: number | null;
    };

    // Fetch guide performance stats untuk personalized insights
    let guideStats = {
      totalTrips: 0,
      averageRating: 0,
      totalRatings: 0,
      experience: 'new' as 'new' | 'experienced',
      currentLevel: 'bronze' as 'bronze' | 'silver' | 'gold' | 'platinum',
      onTimeRate: 0,
    };

    try {
      // Get total completed trips
      let totalTripsQuery = client
        .from('trip_guides')
        .select('*', { count: 'exact', head: true })
        .eq('guide_id', user.id)
        .not('check_in_at', 'is', null)
        .not('check_out_at', 'is', null);

      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        totalTripsQuery = totalTripsQuery.eq('branch_id', branchContext.branchId);
      }

      const { count: totalTrips } = await totalTripsQuery;

      // Get average rating
      let avgRating = 0;
      let totalRatings = 0;
      const { data: guideTrips } = await client
        .from('trip_guides')
        .select('trip_id')
        .eq('guide_id', user.id);

      if (guideTrips && guideTrips.length > 0) {
        const tripIds = guideTrips.map((gt: { trip_id: string }) => gt.trip_id);
        const { data: tripBookings } = await client
          .from('trip_bookings')
          .select('booking_id')
          .in('trip_id', tripIds);

        if (tripBookings && tripBookings.length > 0) {
          const bookingIds = tripBookings.map((tb: { booking_id: string }) => tb.booking_id);
          const { data: reviews } = await client
            .from('reviews')
            .select('guide_rating')
            .in('booking_id', bookingIds)
            .not('guide_rating', 'is', null);

          if (reviews && reviews.length > 0) {
            const ratings = reviews
              .map((r: { guide_rating: number | null }) => r.guide_rating)
              .filter((r: number | null): r is number => r !== null && r > 0);
            totalRatings = ratings.length;
            if (ratings.length > 0) {
              avgRating = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;
            }
          }
        }
      }

      // Get user join date for experience calculation
      const { data: userProfile } = await client
        .from('users')
        .select('created_at')
        .eq('id', user.id)
        .maybeSingle();

      const joinDate = userProfile?.created_at ? new Date(userProfile.created_at) : null;
      const yearsOfExperience = joinDate
        ? Math.floor((new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
        : 0;

      // Calculate level
      const totalTripsCount = totalTrips || 0;
      let currentLevel: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
      if (totalTripsCount >= 100) currentLevel = 'platinum';
      else if (totalTripsCount >= 50) currentLevel = 'gold';
      else if (totalTripsCount >= 20) currentLevel = 'silver';

      // Calculate on-time rate (simplified - count trips with check_in_at close to departure_time)
      // For now, use a default value or calculate from attendance data if available
      let onTimeRate = 95.0; // Default
      try {
        const { data: attendance } = await client
          .from('guide_attendance')
          .select('check_in_time, trip:trips(departure_time)')
          .eq('guide_id', user.id)
          .limit(50); // Last 50 trips

        if (attendance && attendance.length > 0) {
          let onTime = 0;
          attendance.forEach((a: { check_in_time: string | null; trip: { departure_time: string | null } | null }) => {
            if (a.check_in_time && a.trip?.departure_time) {
              const checkIn = new Date(a.check_in_time);
              const departure = new Date(a.trip.departure_time);
              // Consider on-time if check-in is within 15 minutes before or 5 minutes after departure
              const diffMinutes = (checkIn.getTime() - departure.getTime()) / (1000 * 60);
              if (diffMinutes >= -15 && diffMinutes <= 5) {
                onTime++;
              }
            }
          });
          onTimeRate = attendance.length > 0 ? (onTime / attendance.length) * 100 : 95.0;
        }
      } catch (attendanceError) {
        logger.warn('Failed to calculate on-time rate', { error: attendanceError, guideId: user.id });
      }

      guideStats = {
        totalTrips: totalTripsCount,
        averageRating: Math.round(avgRating * 10) / 10,
        totalRatings,
        experience: totalTripsCount >= 20 || yearsOfExperience >= 2 ? 'experienced' : 'new',
        currentLevel,
        onTimeRate: Math.round(onTimeRate * 10) / 10,
      };
    } catch (statsError) {
      logger.warn('Failed to fetch guide stats for weather insights', { error: statsError, guideId: user.id });
    }

    // Fetch historical trip data untuk pattern analysis (optional, Phase 3)
    let historicalPatterns = null;
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      let pastTripsQuery = client
        .from('trip_guides')
        .select(`
          trip_id,
          trip:trips(
            id,
            trip_date,
            status,
            package:packages(
              package_type,
              destination
            )
          )
        `)
        .eq('guide_id', user.id)
        .eq('status', 'completed')
        .gte('trip_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('trip_date', { ascending: false })
        .limit(20);

      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        pastTripsQuery = pastTripsQuery.eq('branch_id', branchContext.branchId);
      }

      const { data: pastTripsData, error: pastTripsError } = await pastTripsQuery;

      if (!pastTripsError && pastTripsData && pastTripsData.length > 0) {
        // Analyze patterns from past trips
        const completedTrips = pastTripsData.filter(
          (tg: { trip: { status: string } | null }) => tg.trip?.status === 'completed'
        );

        // Get trip outcomes (ratings) for these trips
        const tripIds = completedTrips.map((tg: { trip_id: string }) => tg.trip_id);
        let ratings = [];
        if (tripIds.length > 0) {
          const { data: tripBookings } = await client
            .from('trip_bookings')
            .select('booking_id, trip_id')
            .in('trip_id', tripIds);

          if (tripBookings && tripBookings.length > 0) {
            const bookingIds = tripBookings.map((tb: { booking_id: string }) => tb.booking_id);
            const { data: reviews } = await client
              .from('reviews')
              .select('guide_rating, booking_id')
              .in('booking_id', bookingIds)
              .not('guide_rating', 'is', null);

            ratings = reviews || [];
          }
        }

        // Calculate patterns
        const totalPastTrips = completedTrips.length;
        const avgRating = ratings.length > 0
          ? ratings.reduce((sum: number, r: { guide_rating: number }) => sum + (r.guide_rating || 0), 0) / ratings.length
          : 0;

        // Count trips by package type
        const packageTypeCounts: Record<string, number> = {};
        completedTrips.forEach((tg: { trip: { package: { package_type: string | null } | null } | null }) => {
          const pkgType = tg.trip?.package?.package_type || 'unknown';
          packageTypeCounts[pkgType] = (packageTypeCounts[pkgType] || 0) + 1;
        });

        historicalPatterns = {
          totalPastTrips,
          averageRating: Math.round(avgRating * 10) / 10,
          totalRatings: ratings.length,
          packageTypeDistribution: packageTypeCounts,
          timeRange: {
            from: sixMonthsAgo.toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0],
          },
        };
      }
    } catch (historicalError) {
      logger.warn('Failed to fetch historical patterns for weather insights', { error: historicalError, guideId: user.id });
    }

    // Fetch weather data dan tide data untuk setiap trip destination
    const worldTidesApiKey = process.env.WORLDTIDES_API_KEY || 'd784ee1e-eb1d-4e3a-bbdc-5c58e7adc717';

    const tripsWithWeather = await Promise.all(
      upcomingTrips.map(async (trip: UpcomingTrip) => {
        if (!trip.lat || !trip.lng) {
          return { ...trip, weather: null, tide: null };
        }

        try {
          // Fetch weather data
          const tripWeatherRes = await fetch(
            `${request.nextUrl.origin}/api/guide/weather?lat=${trip.lat}&lng=${trip.lng}`
          );
          if (!tripWeatherRes.ok) {
            logger.warn('Failed to fetch weather for trip destination', {
              tripId: trip.tripId,
              lat: trip.lat,
              lng: trip.lng,
            });
            return { ...trip, weather: null, tide: null };
          }

          const tripWeather = (await tripWeatherRes.json()) as {
            current: {
              temp: number;
              feels_like: number;
              humidity: number;
              wind_speed: number;
              weather: { main: string; description: string };
            };
            forecast: Array<{
              date: string;
              temp_max: number;
              temp_min: number;
              weather: { main: string; description: string };
              wind_speed: number;
            }>;
            alerts: Array<{ severity: string; message: string }>;
          };

          // Fetch tide data from WorldTides API
          let tideData = null;
          try {
            const tideResponse = await fetch(
              `https://www.worldtides.info/api/v2?heights&lat=${trip.lat}&lon=${trip.lng}&key=${worldTidesApiKey}&days=7`
            );

            if (tideResponse.ok) {
              const tideResult = (await tideResponse.json()) as {
                status?: number;
                heights?: Array<{
                  dt: number;
                  date: string;
                  height: number;
                }>;
                callCount?: number;
              };

              if (tideResult.heights && tideResult.heights.length > 0) {
                // Process tide data: identify high/low tides
                const heights = tideResult.heights;
                const highTides: Array<{ time: number; height: number; date: string }> = [];
                const lowTides: Array<{ time: number; height: number; date: string }> = [];

                // Simple algorithm: find local maxima (high) and minima (low)
                for (let i = 1; i < heights.length - 1; i++) {
                  const prev = heights[i - 1]!.height;
                  const curr = heights[i]!.height;
                  const next = heights[i + 1]!.height;

                  if (curr > prev && curr > next) {
                    // Local maximum (high tide)
                    highTides.push({
                      time: heights[i]!.dt,
                      height: curr,
                      date: heights[i]!.date,
                    });
                  } else if (curr < prev && curr < next) {
                    // Local minimum (low tide)
                    lowTides.push({
                      time: heights[i]!.dt,
                      height: curr,
                      date: heights[i]!.date,
                    });
                  }
                }

                tideData = {
                  highTides: highTides.slice(0, 14), // Next 7 days (approx 2 per day)
                  lowTides: lowTides.slice(0, 14),
                  heights: heights.slice(0, 24), // First 24 hours for detailed view
                };
              }
            } else {
              logger.warn('WorldTides API error', {
                status: tideResponse.status,
                tripId: trip.tripId,
              });
            }
          } catch (tideError) {
            logger.warn('Failed to fetch tide data from WorldTides', {
              error: tideError,
              tripId: trip.tripId,
              lat: trip.lat,
              lng: trip.lng,
            });
          }

          return {
            ...trip,
            weather: {
              current: tripWeather.current,
              forecast: tripWeather.forecast.slice(0, 3), // Next 3 days
              alerts: tripWeather.alerts,
            },
            tide: tideData,
          };
        } catch (error) {
          logger.warn('Error fetching weather/tide for trip destination', {
            error,
            tripId: trip.tripId,
            lat: trip.lat,
            lng: trip.lng,
          });
          return { ...trip, weather: null, tide: null };
        }
      })
    );

    // Get current weather data (for current location)
    const weatherRes = await fetch(`${request.nextUrl.origin}/api/guide/weather?lat=${lat}&lng=${lng}`);
    if (!weatherRes.ok) {
      throw new Error('Failed to fetch weather data');
    }
    const weatherData = (await weatherRes.json()) as {
      current: {
        temp: number;
        feels_like: number;
        humidity: number;
        wind_speed: number;
        weather: { main: string; description: string };
      };
      forecast: Array<{
        date: string;
        temp_max: number;
        temp_min: number;
        weather: { main: string; description: string };
        wind_speed: number;
      }>;
      alerts: Array<{ severity: string; message: string }>;
    };

    // Build context for AI
    const weatherContext = {
      current: {
        temperature: weatherData.current.temp,
        feelsLike: weatherData.current.feels_like,
        condition: weatherData.current.weather.main,
        description: weatherData.current.weather.description,
        humidity: weatherData.current.humidity,
        windSpeed: weatherData.current.wind_speed,
      },
      forecast: weatherData.forecast.slice(0, 3).map((f) => ({
        date: f.date,
        tempMax: f.temp_max,
        tempMin: f.temp_min,
        condition: f.weather.main,
        windSpeed: f.wind_speed,
      })),
      alerts: weatherData.alerts,
    };

    // Build enriched context for AI prompt
    const guideContext = {
      experience: guideStats.experience,
      totalTrips: guideStats.totalTrips,
      averageRating: guideStats.averageRating,
      totalRatings: guideStats.totalRatings,
      currentLevel: guideStats.currentLevel,
      onTimeRate: guideStats.onTimeRate,
    };

    const tripsContext = tripsWithWeather.map((trip) => ({
      tripId: trip.tripId,
      tripCode: trip.tripCode,
      tripDate: trip.tripDate,
      departureTime: trip.departureTime,
      destination: trip.destination,
      city: trip.city,
      packageType: trip.packageType,
      durationDays: trip.durationDays,
      weather: trip.weather
        ? {
            current: trip.weather.current,
            forecast: trip.weather.forecast,
            alerts: trip.weather.alerts,
          }
        : null,
      tide: trip.tide
        ? {
            highTides: trip.tide.highTides.slice(0, 4), // Next 2 days
            lowTides: trip.tide.lowTides.slice(0, 4),
          }
        : null,
    }));

    // Generate AI insights dengan enriched context
    const prompt = `You are an AI assistant helping a tour guide in Indonesia plan safe and successful trips based on weather conditions, tide data, and guide performance.

=== GUIDE PROFILE ===
Experience Level: ${guideContext.experience} (${guideContext.totalTrips} total trips, ${guideContext.currentLevel} level)
Performance: ${guideContext.averageRating}/5.0 rating (${guideContext.totalRatings} reviews), ${guideContext.onTimeRate}% on-time rate

=== CURRENT LOCATION WEATHER ===
Temperature: ${weatherContext.current.temperature}°C (feels like ${weatherContext.current.feelsLike}°C)
Condition: ${weatherContext.current.condition} (${weatherContext.current.description})
Humidity: ${weatherContext.current.humidity}%
Wind Speed: ${weatherContext.current.windSpeed} km/h

3-Day Forecast:
${weatherContext.forecast.map((f) => `- ${f.date}: ${f.condition}, ${f.tempMin}°-${f.tempMax}°C, Wind: ${f.windSpeed} km/h`).join('\n')}

Active Alerts: ${weatherContext.alerts.length > 0 ? weatherData.alerts.map((a) => a.message).join('; ') : 'None'}

=== UPCOMING TRIPS (Next 7 Days) ===
${tripsContext.length > 0
  ? tripsContext
      .map(
        (trip) => `
Trip: ${trip.tripCode || trip.tripId} - ${trip.destination || trip.city || 'Unknown'}
Date: ${trip.tripDate}${trip.departureTime ? `, Departure: ${trip.departureTime}` : ''}
Package Type: ${trip.packageType || 'Standard'}, Duration: ${trip.durationDays} day(s)
${trip.weather
  ? `Destination Weather:
  - Current: ${trip.weather.current.temp}°C, ${trip.weather.current.weather.main} (${trip.weather.current.weather.description})
  - Wind: ${trip.weather.current.wind_speed} km/h, Humidity: ${trip.weather.current.humidity}%
  - Forecast: ${trip.weather.forecast.map((f: { date: string; weather: { main: string }; temp_min: number; temp_max: number }) => `${f.date}: ${f.weather.main}, ${f.temp_min}°-${f.temp_max}°C`).join('; ')}
  - Alerts: ${trip.weather.alerts.length > 0 ? trip.weather.alerts.map((a: { message: string }) => a.message).join('; ') : 'None'}`
  : 'Weather data not available'}
${trip.tide
  ? `Tide Information:
  - High Tides: ${trip.tide.highTides.map((ht: { time: number; height: number }) => `${new Date(ht.time * 1000).toLocaleString('id-ID')} (${ht.height.toFixed(2)}m)`).join(', ')}
  - Low Tides: ${trip.tide.lowTides.map((lt: { time: number; height: number }) => `${new Date(lt.time * 1000).toLocaleString('id-ID')} (${lt.height.toFixed(2)}m)`).join(', ')}`
  : 'Tide data not available'}`
      )
      .join('\n')
  : 'No upcoming trips in the next 7 days'}

=== ANALYSIS REQUIREMENTS ===
Based on the guide's experience level (${guideContext.experience}), performance metrics, and upcoming trips, provide:

1. **Trip-Specific Recommendations**: For each upcoming trip, assess:
   - Risk level (low/medium/high) based on weather + tide conditions
   - Best departure/return times considering tide conditions
   - Equipment/clothing needs specific to package type and weather
   - Alternative plans if weather/tide conditions are unfavorable
   - Communication strategy (when to notify passengers, what to communicate)

2. **Performance Impact Predictions**: 
   - Predicted rating impact (0-5 scale, considering weather-related factors)
   - On-time risk (low/medium/high) based on weather conditions
   - Cancellation risk (0-100%) for each trip
   - Revenue risk (estimated financial impact)

3. **General Safety Assessment**: Overall safety level considering all factors

4. **Actionable Recommendations**: Prioritized list of actions to take

Provide insights in JSON format:
{
  "safety_assessment": {
    "level": "safe" | "caution" | "risky" | "unsafe",
    "reasoning": "brief explanation of safety level",
    "warnings": ["warning 1", "warning 2"]
  },
  "trip_specific_insights": [
    {
      "tripId": "trip_id_from_context",
      "tripCode": "trip_code_from_context",
      "tripDate": "trip_date_from_context",
      "riskLevel": "low" | "medium" | "high",
      "recommendations": [
        {
          "type": "go_ahead" | "postpone" | "modify" | "cancel",
          "title": "recommendation title",
          "description": "detailed recommendation",
          "priority": "high" | "medium" | "low"
        }
      ],
      "alternativePlans": [
        {
          "title": "alternative plan title",
          "description": "detailed alternative plan",
          "conditions": "when to use this alternative"
        }
      ],
      "bestDepartureTime": "recommended departure time considering weather and tide",
      "bestReturnTime": "recommended return time considering weather and tide",
      "equipmentNeeds": [
        {
          "item": "item name",
          "reason": "why this is needed for this specific trip",
          "priority": "essential" | "recommended" | "optional"
        }
      ],
      "weatherComparison": {
        "currentLocation": "brief comparison with current location weather",
        "destination": "brief summary of destination weather conditions"
      },
      "tideConsiderations": "specific advice about tide conditions for this trip"
    }
  ],
  "performance_impact": {
    "predictedRatingImpact": 0.0,
    "onTimeRisk": "low" | "medium" | "high",
    "cancellationRisk": 0.0,
    "revenueRisk": 0.0,
    "reasoning": "explanation of performance impact predictions"
  },
  "communication_strategy": {
    "notifyPassengers": true | false,
    "notifyTime": "when to notify passengers (e.g., '24 hours before departure')",
    "messageTemplate": "suggested message template for passenger notification"
  },
  "general_recommendations": [
    {
      "type": "go_ahead" | "postpone" | "modify" | "cancel",
      "title": "general recommendation title",
      "description": "detailed recommendation",
      "priority": "high" | "medium" | "low"
    }
  ],
  "equipment_suggestions": [
    {
      "item": "item name",
      "reason": "why this is needed",
      "priority": "essential" | "recommended" | "optional"
    }
  ],
  "sea_conditions": {
    "wave_height": "calm" | "moderate" | "rough" | "very_rough",
    "visibility": "excellent" | "good" | "poor",
    "advice": "detailed sea condition advice considering tide data"
  },
  "best_times": {
    "today": "best time window for trips today",
    "next_3_days": "best days for trips in next 3 days"
  },
  "clothing_recommendations": [
    "recommendation 1",
    "recommendation 2"
  ]
}

Return ONLY the JSON object, no additional text.`;

    let aiResponse: string;
    try {
      aiResponse = await generateContent(prompt);
    } catch (aiError) {
      logger.error('Failed to generate weather AI insights', { error: aiError, lat, lng });
      // Return fallback insights
      const fallbackInsights = {
        safety_assessment: {
          level: 'caution' as const,
          reasoning: 'Berdasarkan kondisi cuaca saat ini',
          warnings: weatherData.alerts.length > 0 
            ? weatherData.alerts.map((a) => a.message)
            : ['Perhatikan kondisi cuaca sebelum memulai trip'],
        },
        trip_specific_insights: tripsContext.map((trip) => ({
          tripId: trip.tripId,
          tripCode: trip.tripCode,
          tripDate: trip.tripDate,
          riskLevel: 'medium' as const,
          recommendations: [],
          alternativePlans: [],
          bestDepartureTime: trip.departureTime || 'Sesuaikan dengan kondisi cuaca',
          bestReturnTime: 'Sesuaikan dengan kondisi cuaca',
          equipmentNeeds: [],
          weatherComparison: {
            currentLocation: 'Periksa perbedaan cuaca antara lokasi saat ini dan destinasi',
            destination: trip.weather ? `${trip.weather.current.temp}°C, ${trip.weather.current.weather.main}` : 'Data cuaca tidak tersedia',
          },
          tideConsiderations: trip.tide ? 'Perhatikan kondisi pasang surut untuk aktivitas laut' : 'Data pasang surut tidak tersedia',
        })),
        performance_impact: {
          predictedRatingImpact: 0,
          onTimeRisk: 'medium' as const,
          cancellationRisk: 0,
          revenueRisk: 0,
          reasoning: 'Berdasarkan kondisi cuaca dan performa guide',
        },
        communication_strategy: {
          notifyPassengers: false,
          notifyTime: 'Jika kondisi cuaca memburuk',
          messageTemplate: 'Sesuaikan dengan kondisi cuaca aktual',
        },
        general_recommendations: [],
        equipment_suggestions: [],
        sea_conditions: {
          wave_height: 'moderate' as const,
          visibility: 'good' as const,
          advice: 'Kondisi laut perlu diperhatikan berdasarkan kecepatan angin',
        },
        best_times: {
          today: 'Sesuaikan dengan kondisi cuaca',
          next_3_days: 'Periksa prakiraan cuaca sebelum memulai trip',
        },
        clothing_recommendations: [],
      };
      return NextResponse.json({
        insights: fallbackInsights,
        weatherContext,
        guideContext,
        historicalPatterns,
        tripsContext: tripsContext.map((trip) => ({
          tripId: trip.tripId,
          tripCode: trip.tripCode,
          tripDate: trip.tripDate,
          destination: trip.destination,
          packageType: trip.packageType,
        })),
      });
    }

    // Parse AI response
    let insights: Record<string, unknown>;
    try {
      const cleaned = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      insights = JSON.parse(cleaned);
      
      // Validate insights structure
      if (!insights || typeof insights !== 'object') {
        throw new Error('Invalid AI response structure');
      }
    } catch (parseError) {
      logger.error('Failed to parse weather AI insights', {
        error: parseError,
        lat,
        lng,
        aiResponse: aiResponse.substring(0, 200),
      });
      // Return fallback insights
      insights = {
        safety_assessment: {
          level: 'caution',
          reasoning: 'Berdasarkan kondisi cuaca saat ini',
          warnings: weatherData.alerts.length > 0 
            ? weatherData.alerts.map((a) => a.message)
            : ['Perhatikan kondisi cuaca sebelum memulai trip'],
        },
        trip_recommendations: [],
        equipment_suggestions: [],
        sea_conditions: {
          wave_height: 'moderate',
          visibility: 'good',
          advice: 'Kondisi laut perlu diperhatikan berdasarkan kecepatan angin',
        },
        best_times: {
          today: 'Sesuaikan dengan kondisi cuaca',
          next_3_days: 'Periksa prakiraan cuaca sebelum memulai trip',
        },
        clothing_recommendations: [],
      };
    }

    return NextResponse.json({
      insights,
      weatherContext,
      guideContext,
      historicalPatterns,
      tripsContext: tripsContext.map((trip) => ({
        tripId: trip.tripId,
        tripCode: trip.tripCode,
        tripDate: trip.tripDate,
        destination: trip.destination,
        packageType: trip.packageType,
      })),
    });
  } catch (error) {
    logger.error('Failed to generate weather insights', { error, lat, lng });
    return NextResponse.json(
      { error: 'Failed to generate weather insights' },
      { status: 500 }
    );
  }
});
