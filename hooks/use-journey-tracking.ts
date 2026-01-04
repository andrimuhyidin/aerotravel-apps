/**
 * Hook: Journey Tracking
 * Combines funnel tracking, scroll tracking, and time tracking
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

import {
  trackFunnelStep,
  FunnelStep,
  getCurrentJourney,
  getJourneyProgress,
} from '@/lib/analytics/journey-tracker';
import {
  startScrollTracking,
  stopScrollTracking,
  getCurrentScrollDepth,
  getTrackedMilestones,
} from '@/lib/analytics/scroll-tracker';
import {
  startTimeTracking,
  stopTimeTracking,
  getTimeOnPage,
  getEngagementLevel,
  sendPageExitEvent,
} from '@/lib/analytics/time-tracker';
import { initDispatcher, cleanupDispatcher } from '@/lib/analytics/dispatcher';

type UseJourneyTrackingOptions = {
  funnelStep?: FunnelStep;
  enableScrollTracking?: boolean;
  enableTimeTracking?: boolean;
  metadata?: Record<string, unknown>;
};

type JourneyTrackingReturn = {
  trackStep: (step: FunnelStep, metadata?: Record<string, unknown>) => void;
  getProgress: () => number;
  getScrollDepth: () => number;
  getTimeSpent: () => number;
  getEngagement: () => string;
  getJourney: () => ReturnType<typeof getCurrentJourney>;
  getScrollMilestones: () => number[];
};

export function useJourneyTracking(
  options: UseJourneyTrackingOptions = {}
): JourneyTrackingReturn {
  const {
    funnelStep,
    enableScrollTracking = true,
    enableTimeTracking = true,
    metadata,
  } = options;

  const pathname = usePathname();
  const hasTrackedStep = useRef(false);
  const previousPathname = useRef<string | null>(null);

  // Initialize dispatcher on mount
  useEffect(() => {
    initDispatcher();
    return () => {
      cleanupDispatcher();
    };
  }, []);

  // Track funnel step when specified
  useEffect(() => {
    if (funnelStep && !hasTrackedStep.current) {
      trackFunnelStep(funnelStep, metadata);
      hasTrackedStep.current = true;
    }
  }, [funnelStep, metadata]);

  // Handle page change
  useEffect(() => {
    if (previousPathname.current !== null && previousPathname.current !== pathname) {
      // Send exit event for previous page
      sendPageExitEvent();

      // Stop previous tracking
      stopScrollTracking();
      stopTimeTracking();

      // Reset step tracking flag
      hasTrackedStep.current = false;
    }

    previousPathname.current = pathname;

    // Start tracking for new page
    if (enableScrollTracking) {
      startScrollTracking();
    }
    if (enableTimeTracking) {
      startTimeTracking();
    }

    return () => {
      if (enableScrollTracking) {
        stopScrollTracking();
      }
      if (enableTimeTracking) {
        sendPageExitEvent();
        stopTimeTracking();
      }
    };
  }, [pathname, enableScrollTracking, enableTimeTracking]);

  // Track funnel step manually
  const trackStep = useCallback(
    (step: FunnelStep, stepMetadata?: Record<string, unknown>) => {
      trackFunnelStep(step, { ...metadata, ...stepMetadata });
    },
    [metadata]
  );

  // Get current journey progress
  const getProgress = useCallback(() => {
    return getJourneyProgress();
  }, []);

  // Get current scroll depth
  const getScrollDepth = useCallback(() => {
    return getCurrentScrollDepth();
  }, []);

  // Get time spent on page
  const getTimeSpent = useCallback(() => {
    return getTimeOnPage();
  }, []);

  // Get engagement level
  const getEngagement = useCallback(() => {
    return getEngagementLevel();
  }, []);

  // Get full journey data
  const getJourney = useCallback(() => {
    return getCurrentJourney();
  }, []);

  // Get scroll milestones
  const getScrollMilestones = useCallback(() => {
    return getTrackedMilestones();
  }, []);

  return {
    trackStep,
    getProgress,
    getScrollDepth,
    getTimeSpent,
    getEngagement,
    getJourney,
    getScrollMilestones,
  };
}

/**
 * Hook for tracking specific funnel step on page load
 */
export function useFunnelStep(
  step: FunnelStep,
  metadata?: Record<string, unknown>
): void {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      trackFunnelStep(step, metadata);
      hasTracked.current = true;
    }
  }, [step, metadata]);
}

