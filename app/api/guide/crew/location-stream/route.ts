/**
 * API: Real-Time Location Stream for Crew Directory
 * GET /api/guide/crew/location-stream - Server-Sent Events stream for real-time location updates
 * 
 * Note: Next.js doesn't support WebSocket natively, so we use SSE (Server-Sent Events)
 * Alternative: Use external WebSocket service (e.g., Pusher, Ably) for production
 */

import { NextRequest } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection message
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      send(JSON.stringify({ type: 'connected', message: 'Location stream connected' }));

      // Poll for location updates every 10 seconds
      const interval = setInterval(async () => {
        try {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

          const { data: locations, error } = await supabase
            .from('guide_locations')
            .select(
              `
              guide_id,
              latitude,
              longitude,
              last_seen_at,
              is_online,
              guide:users!guide_locations_guide_id_fkey(
                id,
                full_name
              )
            `,
            )
            .eq('is_online', true)
            .gte('last_seen_at', oneHourAgo)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .limit(100);

          if (error) {
            logger.error('Failed to fetch locations in stream', error);
            send(JSON.stringify({ type: 'error', message: 'Failed to fetch locations' }));
            return;
          }

          // Send location updates
          send(
            JSON.stringify({
              type: 'locations',
              data: (locations || []).map((loc: any) => ({
                guideId: loc.guide_id,
                name: loc.guide?.full_name || 'Unknown',
                latitude: loc.latitude,
                longitude: loc.longitude,
                lastSeenAt: loc.last_seen_at,
                isOnline: loc.is_online,
              })),
              timestamp: new Date().toISOString(),
            })
          );
        } catch (error) {
          logger.error('Error in location stream', error);
          send(JSON.stringify({ type: 'error', message: 'Stream error' }));
        }
      }, 10000); // Update every 10 seconds

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
});

