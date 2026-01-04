/**
 * Time on Page Tracker
 * Tracks how long users spend on each page
 */

'use client';

import { trackEvent } from './analytics';
import { claritySetTag } from './clarity';

// ============================================
// Constants
// ============================================

// Time thresholds to track (in seconds)
const TIME_THRESHOLDS = [30, 60, 120, 300, 600] as const;
type TimeThreshold = (typeof TIME_THRESHOLDS)[number];

const TICK_INTERVAL_MS = 1000; // 1 second

// ============================================
// State
// ============================================

let startTime: number = 0;
let activeTime: number = 0;
let tickInterval: ReturnType<typeof setInterval> | null = null;
let isActive: boolean = true;
let trackedThresholds: Set<number> = new Set();
let currentPagePath: string = '';

// ============================================
// Visibility Tracking
// ============================================

function handleVisibilityChange(): void {
  if (document.hidden) {
    // Tab became hidden - pause tracking
    isActive = false;
  } else {
    // Tab became visible - resume tracking
    isActive = true;
  }
}

// ============================================
// Time Tracking
// ============================================

function tick(): void {
  if (!isActive) return;

  activeTime += 1; // 1 second

  // Check thresholds
  for (const threshold of TIME_THRESHOLDS) {
    if (activeTime >= threshold && !trackedThresholds.has(threshold)) {
      trackTimeThreshold(threshold);
    }
  }
}

function trackTimeThreshold(threshold: TimeThreshold): void {
  if (trackedThresholds.has(threshold)) return;

  trackedThresholds.add(threshold);

  // Track in GA4 and PostHog
  trackEvent('time_on_page' as any, {
    seconds: threshold,
    page_path: currentPagePath,
    threshold: `${threshold}s`,
    category: getTimeCategory(threshold),
  });

  // Track in Clarity
  claritySetTag('time_on_page', `${threshold}s`);
}

function getTimeCategory(seconds: number): string {
  if (seconds < 30) return 'bounce';
  if (seconds < 60) return 'quick_read';
  if (seconds < 120) return 'engaged';
  if (seconds < 300) return 'deep_read';
  return 'very_engaged';
}

// ============================================
// Beacon for Exit Tracking
// ============================================

function sendExitBeacon(): void {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) return;
  if (activeTime < 5) return; // Don't track very short visits

  const data = JSON.stringify({
    event: 'page_exit',
    page_path: currentPagePath,
    time_spent_seconds: activeTime,
    category: getTimeCategory(activeTime),
    thresholds_reached: Array.from(trackedThresholds),
    timestamp: Date.now(),
  });

  // Use sendBeacon for reliable exit tracking
  navigator.sendBeacon('/api/analytics/beacon', data);
}

function handleBeforeUnload(): void {
  sendExitBeacon();
}

// ============================================
// Public API
// ============================================

/**
 * Start time tracking for current page
 */
export function startTimeTracking(): void {
  if (typeof window === 'undefined') return;

  // Reset state
  startTime = Date.now();
  activeTime = 0;
  trackedThresholds = new Set();
  currentPagePath = window.location.pathname;
  isActive = !document.hidden;

  // Start tick interval
  if (tickInterval) {
    clearInterval(tickInterval);
  }
  tickInterval = setInterval(tick, TICK_INTERVAL_MS);

  // Add visibility listener
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Add beforeunload listener for exit tracking
  window.addEventListener('beforeunload', handleBeforeUnload);
}

/**
 * Stop time tracking
 */
export function stopTimeTracking(): void {
  if (typeof window === 'undefined') return;

  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }

  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('beforeunload', handleBeforeUnload);
}

/**
 * Reset tracking for new page
 */
export function resetTimeTracking(): void {
  stopTimeTracking();
  startTimeTracking();
}

/**
 * Get current time on page (seconds)
 */
export function getTimeOnPage(): number {
  return activeTime;
}

/**
 * Get total elapsed time (including inactive)
 */
export function getElapsedTime(): number {
  if (startTime === 0) return 0;
  return Math.floor((Date.now() - startTime) / 1000);
}

/**
 * Get active time percentage
 */
export function getActiveTimePercentage(): number {
  const elapsed = getElapsedTime();
  if (elapsed === 0) return 100;
  return Math.round((activeTime / elapsed) * 100);
}

/**
 * Check if user is currently active
 */
export function isUserActive(): boolean {
  return isActive;
}

/**
 * Get reached thresholds
 */
export function getReachedThresholds(): number[] {
  return Array.from(trackedThresholds);
}

/**
 * Get engagement level based on time
 */
export function getEngagementLevel():
  | 'bounce'
  | 'quick_read'
  | 'engaged'
  | 'deep_read'
  | 'very_engaged' {
  return getTimeCategory(activeTime) as ReturnType<typeof getEngagementLevel>;
}

/**
 * Track custom time event
 */
export function trackTimeEvent(eventName: string): void {
  trackEvent(eventName as any, {
    time_spent_seconds: activeTime,
    page_path: currentPagePath,
    engagement_level: getEngagementLevel(),
  });
}

/**
 * Force send exit beacon (for SPA navigation)
 */
export function sendPageExitEvent(): void {
  // Track final time
  if (activeTime >= 5) {
    trackEvent('page_exit' as any, {
      page_path: currentPagePath,
      time_spent_seconds: activeTime,
      engagement_level: getEngagementLevel(),
      thresholds_reached: Array.from(trackedThresholds),
    });
  }
}

