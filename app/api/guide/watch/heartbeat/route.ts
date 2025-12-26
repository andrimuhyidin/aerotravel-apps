/**
 * API: Watch Heartbeat (Health Check)
 * POST /api/guide/watch/heartbeat - Periodic health check from watch
 * 
 * Used for:
 * - Tracking watch app connectivity
 * - Battery level monitoring (optional)
 * - Heart rate data (optional, if available)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const heartbeatSchema = z.object({
  batteryLevel: z.number().min(0).max(100).optional(),
  heartRate: z.number().min(30).max(220).optional(),
  watchType: z.enum(['apple', 'wearos', 'web']).optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional(),
    })
    .optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const payload = heartbeatSchema.parse(await request.json());
  const client = supabase as unknown as any;

  try {
    // Log heartbeat (for monitoring/debugging)
    // You can create a watch_heartbeats table if needed for analytics
    logger.info('Watch heartbeat received', {
      userId: user.id,
      batteryLevel: payload.batteryLevel,
      heartRate: payload.heartRate,
      watchType: payload.watchType,
      hasLocation: !!payload.location,
    });

    // Update last seen timestamp in user profile or separate watch_activity table
    // For now, just return success

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      // Optional: return any commands/updates for watch
      updates: [],
    });
  } catch (error) {
    logger.error('Failed to process watch heartbeat', error, {
      userId: user.id,
    });
    throw error;
  }
});

