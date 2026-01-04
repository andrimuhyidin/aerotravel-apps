/**
 * Hook: Booking Analytics Tracking
 * 
 * Features:
 * - Track conversion events
 * - Fire-and-forget (non-blocking)
 * - Auto-track time spent
 */

'use client';

import { useCallback, useRef } from 'react';
import { usePartnerAuth } from '@/hooks/use-partner-auth';
import { logger } from '@/lib/utils/logger';

type AnalyticsEvent = 'started' | 'step_completed' | 'abandoned' | 'completed';

type TrackEventParams = {
  eventType: AnalyticsEvent;
  stepName?: string;
  bookingId?: string;
  draftId?: string;
  metadata?: Record<string, any>;
};

export function useBookingAnalytics() {
  const { partnerId } = usePartnerAuth();
  const startTimeRef = useRef<number>(Date.now());
  const stepStartTimeRef = useRef<number>(Date.now());

  // Track event (fire-and-forget)
  const trackEvent = useCallback(
    async (params: TrackEventParams) => {
      if (!partnerId) return;

      const now = Date.now();
      const timeSpent = Math.floor((now - stepStartTimeRef.current) / 1000); // seconds

      // Reset step timer
      stepStartTimeRef.current = now;

      try {
        // Fire-and-forget - don't await
        fetch('/api/partner/bookings/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            timeSpentSeconds: timeSpent,
            metadata: {
              ...params.metadata,
              totalTimeSpent: Math.floor((now - startTimeRef.current) / 1000),
            },
          }),
          keepalive: true, // Ensure request completes even if user navigates away
        });

        logger.info('Analytics event tracked', {
          eventType: params.eventType,
          stepName: params.stepName,
          timeSpent,
        });
      } catch (error) {
        // Silent fail - analytics should never block user flow
        logger.warn('Failed to track analytics event', error as Error);
      }
    },
    [partnerId]
  );

  // Track booking start
  const trackStart = useCallback(() => {
    startTimeRef.current = Date.now();
    stepStartTimeRef.current = Date.now();

    trackEvent({
      eventType: 'started',
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        screenWidth: typeof window !== 'undefined' ? window.innerWidth : undefined,
        screenHeight: typeof window !== 'undefined' ? window.innerHeight : undefined,
      },
    });
  }, [trackEvent]);

  // Track step completion
  const trackStepCompleted = useCallback(
    (stepName: string, metadata?: Record<string, any>) => {
      trackEvent({
        eventType: 'step_completed',
        stepName,
        metadata,
      });
    },
    [trackEvent]
  );

  // Track abandonment
  const trackAbandoned = useCallback(
    (stepName?: string, reason?: string) => {
      trackEvent({
        eventType: 'abandoned',
        stepName,
        metadata: { reason },
      });
    },
    [trackEvent]
  );

  // Track completion
  const trackCompleted = useCallback(
    (bookingId: string, draftId?: string, metadata?: Record<string, any>) => {
      trackEvent({
        eventType: 'completed',
        bookingId,
        draftId,
        metadata,
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackStart,
    trackStepCompleted,
    trackAbandoned,
    trackCompleted,
  };
}

