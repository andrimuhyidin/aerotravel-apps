/**
 * Hook: Scroll Tracking
 * Track scroll depth on current page
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';

import {
  startScrollTracking,
  stopScrollTracking,
  resetScrollTracking,
  getCurrentScrollDepth,
  getTrackedMilestones,
  hasMilestoneBeenTracked,
} from '@/lib/analytics/scroll-tracker';

type UseScrollTrackingOptions = {
  enabled?: boolean;
  onMilestone?: (milestone: number) => void;
};

type UseScrollTrackingReturn = {
  scrollDepth: number;
  milestones: number[];
  isTracking: boolean;
  hasPassed25: boolean;
  hasPassed50: boolean;
  hasPassed75: boolean;
  hasPassed100: boolean;
  reset: () => void;
};

export function useScrollTracking(
  options: UseScrollTrackingOptions = {}
): UseScrollTrackingReturn {
  const { enabled = true, onMilestone } = options;

  const pathname = usePathname();
  const [scrollDepth, setScrollDepth] = useState(0);
  const [milestones, setMilestones] = useState<number[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  // Start/stop tracking based on enabled flag
  useEffect(() => {
    if (!enabled) {
      stopScrollTracking();
      setIsTracking(false);
      return;
    }

    startScrollTracking();
    setIsTracking(true);

    return () => {
      stopScrollTracking();
      setIsTracking(false);
    };
  }, [enabled]);

  // Reset on pathname change
  useEffect(() => {
    if (enabled) {
      resetScrollTracking();
      setMilestones([]);
      setScrollDepth(0);
    }
  }, [pathname, enabled]);

  // Update scroll depth periodically
  useEffect(() => {
    if (!enabled) return;

    const updateDepth = () => {
      const depth = getCurrentScrollDepth();
      setScrollDepth(depth);

      const currentMilestones = getTrackedMilestones();
      if (currentMilestones.length !== milestones.length) {
        const newMilestones = currentMilestones.filter(
          (m) => !milestones.includes(m)
        );
        for (const milestone of newMilestones) {
          onMilestone?.(milestone);
        }
        setMilestones(currentMilestones);
      }
    };

    const interval = setInterval(updateDepth, 500);
    return () => clearInterval(interval);
  }, [enabled, milestones, onMilestone]);

  const reset = useCallback(() => {
    resetScrollTracking();
    setMilestones([]);
    setScrollDepth(0);
  }, []);

  return {
    scrollDepth,
    milestones,
    isTracking,
    hasPassed25: hasMilestoneBeenTracked(25),
    hasPassed50: hasMilestoneBeenTracked(50),
    hasPassed75: hasMilestoneBeenTracked(75),
    hasPassed100: hasMilestoneBeenTracked(100),
    reset,
  };
}

/**
 * Hook for simple scroll depth value only
 */
export function useScrollDepth(): number {
  const [depth, setDepth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setDepth(getCurrentScrollDepth());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial value

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return depth;
}

