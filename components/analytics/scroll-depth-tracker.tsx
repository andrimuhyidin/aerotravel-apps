/**
 * Scroll Depth Tracker Component
 * Client component that tracks scroll depth on the page
 */

'use client';

import { useEffect } from 'react';
import { useScrollTracking } from '@/hooks/use-scroll-tracking';

type ScrollDepthTrackerProps = {
  enabled?: boolean;
  onMilestone?: (milestone: number) => void;
  showDebug?: boolean;
};

export function ScrollDepthTracker({
  enabled = true,
  onMilestone,
  showDebug = false,
}: ScrollDepthTrackerProps) {
  const {
    scrollDepth,
    milestones,
    isTracking,
    hasPassed25,
    hasPassed50,
    hasPassed75,
    hasPassed100,
  } = useScrollTracking({ enabled, onMilestone });

  // Debug logging
  useEffect(() => {
    if (showDebug && process.env.NODE_ENV === 'development') {
      console.log('[ScrollTracker]', {
        scrollDepth,
        milestones,
        isTracking,
      });
    }
  }, [scrollDepth, milestones, isTracking, showDebug]);

  // This component doesn't render anything visible
  // It just activates scroll tracking
  if (!showDebug) {
    return null;
  }

  // Debug UI (only in development)
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 rounded-lg bg-black/80 p-3 text-xs text-white shadow-lg">
      <div className="mb-1 font-semibold">Scroll Tracker</div>
      <div>Depth: {scrollDepth}%</div>
      <div>Tracking: {isTracking ? 'Yes' : 'No'}</div>
      <div className="mt-1 flex gap-1">
        <span
          className={`rounded px-1 ${hasPassed25 ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          25%
        </span>
        <span
          className={`rounded px-1 ${hasPassed50 ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          50%
        </span>
        <span
          className={`rounded px-1 ${hasPassed75 ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          75%
        </span>
        <span
          className={`rounded px-1 ${hasPassed100 ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          100%
        </span>
      </div>
    </div>
  );
}

