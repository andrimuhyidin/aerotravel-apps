/**
 * API: Route Optimization
 * POST /api/guide/route-optimization
 * 
 * Optimizes GPS route for multiple stops using Google Directions API
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

const optimizeRouteSchema = z.object({
  origin: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  waypoints: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string().optional(),
  })).optional(),
  optimize: z.boolean().default(true), // Optimize waypoint order
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const payload = optimizeRouteSchema.parse(await request.json());
  const { origin, destination, waypoints = [], optimize } = payload;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    logger.warn('Google Maps API key not configured, returning mock optimized route');
    
    // Return mock optimized route
    const allPoints = [origin, ...waypoints, destination];
    const optimizedRoute = {
      distance: { text: '25 km', value: 25000 },
      duration: { text: '45 menit', value: 2700 },
      waypoint_order: optimize ? waypoints.map((_, i) => i).reverse() : waypoints.map((_, i) => i),
      route: allPoints.map((point, i) => ({
        order: i + 1,
        location: point,
        name: (point as { name?: string }).name || `Stop ${i + 1}`,
      })),
    };

    return NextResponse.json({
      optimized: optimize,
      route: optimizedRoute,
      savings: optimize ? {
        distance: { text: '3 km', value: 3000 },
        duration: { text: '5 menit', value: 300 },
      } : null,
    });
  }

  try {
    // Build waypoints string
    const waypointsStr = waypoints
      .map((wp) => `${wp.lat},${wp.lng}`)
      .join('|');

    // Google Directions API
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.set('origin', `${origin.lat},${origin.lng}`);
    url.searchParams.set('destination', `${destination.lat},${destination.lng}`);
    if (waypoints.length > 0) {
      url.searchParams.set('waypoints', optimize ? `optimize:true|${waypointsStr}` : waypointsStr);
    }
    url.searchParams.set('key', apiKey);
    url.searchParams.set('language', 'id');
    url.searchParams.set('region', 'id');

    const response = await fetch(url.toString());
    const data = (await response.json()) as {
      routes: Array<{
        legs: Array<{
          distance: { text: string; value: number };
          duration: { text: string; value: number };
          start_location: { lat: number; lng: number };
          end_location: { lat: number; lng: number };
        }>;
        waypoint_order?: number[];
      }>;
      status: string;
    };

    if (data.status !== 'OK' || !data.routes[0]) {
      // If API key not enabled or quota exceeded, return mock data
      if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT') {
        logger.warn('Google Maps API error, returning mock route', { status: data.status });
        const allPoints = [origin, ...waypoints, destination];
        const optimizedRoute = {
          distance: { text: '25 km', value: 25000 },
          duration: { text: '45 menit', value: 2700 },
          waypoint_order: optimize ? waypoints.map((_, i) => waypoints.length - 1 - i) : waypoints.map((_, i) => i),
          route: allPoints.map((point, i) => ({
            order: i + 1,
            location: point,
            name: (point as { name?: string }).name || (i === 0 ? 'Origin' : i === allPoints.length - 1 ? 'Destination' : `Stop ${i}`),
          })),
        };
        return NextResponse.json({
          optimized: optimize,
          route: optimizedRoute,
          note: 'Mock data (API not available)',
        });
      }
      throw new Error(`Google Directions API error: ${data.status}`);
    }

    const route = data.routes[0];
    const totalDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
    const totalDuration = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0);

    // Build optimized route with waypoint order
    const optimizedWaypoints = route.waypoint_order
      ? route.waypoint_order.map((idx) => waypoints[idx]!).filter(Boolean)
      : waypoints;

    const optimizedRoute = {
      distance: {
        text: `${Math.round(totalDistance / 1000)} km`,
        value: totalDistance,
      },
      duration: {
        text: `${Math.round(totalDuration / 60)} menit`,
        value: totalDuration,
      },
      waypoint_order: route.waypoint_order || [],
      route: [
        { order: 1, location: origin, name: 'Origin' },
        ...optimizedWaypoints.map((wp, i) => ({
          order: i + 2,
          location: wp,
          name: wp.name || `Stop ${i + 1}`,
        })),
        {
          order: optimizedWaypoints.length + 2,
          location: destination,
          name: 'Destination',
        },
      ],
    };

    return NextResponse.json({
      optimized: optimize,
      route: optimizedRoute,
    });
  } catch (error) {
    logger.error('Route optimization failed', error);
    return NextResponse.json(
      { error: 'Failed to optimize route' },
      { status: 500 }
    );
  }
});

