/**
 * Pull-to-Refresh Hook
 * Mobile gesture untuk refresh dashboard
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type UsePullToRefreshOptions = {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  disabled?: boolean;
};

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const touchStartY = useRef(0);
  const isTouchDevice = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only trigger if scrolled to top
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0]?.clientY || 0;
      isTouchDevice.current = true;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || !isTouchDevice.current) return;
    if (window.scrollY > 0) return;

    const touch = e.touches[0];
    if (!touch) return;

    const currentY = touch.clientY;
    const distance = currentY - touchStartY.current;

    if (distance > 0) {
      e.preventDefault();
      const calculatedDistance = distance / resistance;
      setPullDistance(calculatedDistance);
      setIsPulling(true);
    }
  }, [disabled, isRefreshing, resistance]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || !isTouchDevice.current) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          setIsPulling(false);
          isTouchDevice.current = false;
        }, 500);
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
      isTouchDevice.current = false;
    }
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    progress: Math.min((pullDistance / threshold) * 100, 100),
  };
}

