/**
 * useReducedMotion Hook
 * Detects if user prefers reduced motion (WCAG 2.1 AAA)
 */

'use client';

import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/fd0e7040-6dec-4c80-af68-824474150b64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-reduced-motion.ts:13',message:'useReducedMotion useEffect started',data:{windowAvailable:typeof window!=='undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    const initialValue = mediaQuery.matches;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/fd0e7040-6dec-4c80-af68-824474150b64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-reduced-motion.ts:19',message:'Media query initial value',data:{matches:initialValue,hasAddListener:!!mediaQuery.addEventListener,hasAddListenerLegacy:!!mediaQuery.addListener},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    setPrefersReducedMotion(initialValue);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    // Legacy browsers (Safari < 14)
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Get animation duration based on reduced motion preference
 */
export function useAnimationDuration(defaultMs = 300): number {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? 0 : defaultMs;
}

