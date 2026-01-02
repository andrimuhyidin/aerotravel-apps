/**
 * Analytics Events API
 * Receives custom analytics events from the dispatcher
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

export const runtime = 'edge';

type EventPayload = {
  name: string;
  category: string;
  action?: string;
  label?: string;
  value?: number;
  properties?: Record<string, unknown>;
  timestamp: number;
};

export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    
    if (!text) {
      return new NextResponse(null, { status: 204 });
    }

    const payload: EventPayload = JSON.parse(text);

    // Log the event for analytics processing
    logger.info('Custom analytics event received', {
      name: payload.name,
      category: payload.category,
      action: payload.action,
      label: payload.label,
      value: payload.value,
    });

    // Here you could:
    // 1. Store in database for custom analytics
    // 2. Forward to third-party analytics
    // 3. Process for real-time dashboards

    // For now, just acknowledge receipt
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.warn('Failed to process analytics event', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Always return 204 for beacons to avoid client errors
    return new NextResponse(null, { status: 204 });
  }
}

