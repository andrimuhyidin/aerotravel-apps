/**
 * Analytics Beacon API
 * Receives time-on-page and exit events via navigator.sendBeacon
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

export const runtime = 'edge';

type BeaconPayload = {
  event: string;
  page_path: string;
  time_spent_seconds: number;
  category?: string;
  thresholds_reached?: number[];
  timestamp: number;
};

export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    
    if (!text) {
      return new NextResponse(null, { status: 204 });
    }

    const payload: BeaconPayload = JSON.parse(text);

    // Log the event for analytics processing
    logger.info('Analytics beacon received', {
      event: payload.event,
      page_path: payload.page_path,
      time_spent: payload.time_spent_seconds,
      category: payload.category,
    });

    // Here you could:
    // 1. Store in database for custom analytics
    // 2. Forward to third-party analytics
    // 3. Process for real-time dashboards

    // For now, just acknowledge receipt
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.warn('Failed to process analytics beacon', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Always return 204 for beacons to avoid client errors
    return new NextResponse(null, { status: 204 });
  }
}

