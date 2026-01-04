/**
 * API: Real-time Events (Server-Sent Events)
 * GET /api/guide/realtime - SSE endpoint for real-time updates
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

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId || userId !== user.id) {
    return new Response('Invalid userId', { status: 400 });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`));

      // Setup Supabase realtime subscription
      const channel = supabase
        .channel(`guide-realtime-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notification_logs',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const data = encoder.encode(
              `event: notification\ndata: ${JSON.stringify({
                type: 'notification',
                data: payload,
                timestamp: Date.now(),
              })}\n\n`,
            );
            controller.enqueue(data);
          },
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ops_broadcasts',
          },
          (payload) => {
            const data = encoder.encode(
              `event: broadcast\ndata: ${JSON.stringify({
                type: 'broadcast',
                data: payload,
                timestamp: Date.now(),
              })}\n\n`,
            );
            controller.enqueue(data);
          },
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sos_alerts',
            filter: `guide_id=eq.${userId}`,
          },
          (payload) => {
            const data = encoder.encode(
              `event: sos_alert\ndata: ${JSON.stringify({
                type: 'sos_alert',
                data: payload,
                timestamp: Date.now(),
              })}\n\n`,
            );
            controller.enqueue(data);
          },
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'guide_wallet_transactions',
            filter: `wallet_id=in.(SELECT id FROM guide_wallets WHERE guide_id=eq.${userId})`,
          },
          (payload) => {
            const data = encoder.encode(
              `event: wallet_update\ndata: ${JSON.stringify({
                type: 'wallet_update',
                data: payload,
                timestamp: Date.now(),
              })}\n\n`,
            );
            controller.enqueue(data);
          },
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('[Realtime] SSE client subscribed', { userId });
          }
        });

      // Keep connection alive with heartbeat
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          // Connection closed
          clearInterval(heartbeatInterval);
          channel.unsubscribe();
        }
      }, 30000); // Every 30 seconds

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        channel.unsubscribe();
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

