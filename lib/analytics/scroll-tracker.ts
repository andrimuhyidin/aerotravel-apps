/**
 * Scroll Depth Tracker
 * Tracks how far users scroll on each page
 */

'use client';

import { trackEvent } from './analytics';
import { claritySetTag } from './clarity';

// ============================================
// Constants
// ============================================

const SCROLL_MILESTONES = [25, 50, 75, 100] as const;
type ScrollMilestone = (typeof SCROLL_MILESTONES)[number];

const STORAGE_KEY = 'aero_scroll_tracked';
const DEBOUNCE_MS = 100;

// ============================================
// State
// ============================================

let trackedMilestones: Set<number> = new Set();
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
let isTracking = false;
let currentPagePath = '';

// ============================================
// Scroll Calculation
// ============================================

function getScrollPercentage(): number {
  if (typeof window === 'undefined') return 0;

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = window.innerHeight;

  // Handle edge case where page fits in viewport
  if (scrollHeight <= clientHeight) {
    return 100;
  }

  const scrollableHeight = scrollHeight - clientHeight;
  const percentage = (scrollTop / scrollableHeight) * 100;

  return Math.min(Math.round(percentage), 100);
}

function getNextMilestone(currentPercentage: number): ScrollMilestone | null {
  for (const milestone of SCROLL_MILESTONES) {
    if (currentPercentage >= milestone && !trackedMilestones.has(milestone)) {
      return milestone;
    }
  }
  return null;
}

// ============================================
// Tracking Functions
// ============================================

/**
 * Track scroll milestone
 */
function trackScrollMilestone(milestone: ScrollMilestone): void {
  if (trackedMilestones.has(milestone)) return;

  trackedMilestones.add(milestone);

  const pagePath =
    typeof window !== 'undefined' ? window.location.pathname : '';

  // Track in GA4 and PostHog
  trackEvent('scroll_depth' as any, {
    percent: milestone,
    page_path: pagePath,
    milestone: `${milestone}%`,
  });

  // Track in Clarity
  claritySetTag('scroll_depth', `${milestone}%`);

  // Store in session to prevent duplicate tracking on back navigation
  saveTrackedMilestones(pagePath);
}

/**
 * Handle scroll event (debounced)
 */
function handleScroll(): void {
  if (!isTracking) return;

  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  scrollTimeout = setTimeout(() => {
    const percentage = getScrollPercentage();
    const milestone = getNextMilestone(percentage);

    if (milestone !== null) {
      trackScrollMilestone(milestone);

      // Check if there are more milestones to track
      const nextMilestone = getNextMilestone(percentage);
      if (nextMilestone !== null && nextMilestone !== milestone) {
        trackScrollMilestone(nextMilestone);
      }
    }
  }, DEBOUNCE_MS);
}

// ============================================
// Session Storage
// ============================================

function getStorageKey(pagePath: string): string {
  return `${STORAGE_KEY}_${pagePath.replace(/\//g, '_')}`;
}

function loadTrackedMilestones(pagePath: string): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = sessionStorage.getItem(getStorageKey(pagePath));
    if (stored) {
      const milestones = JSON.parse(stored) as number[];
      trackedMilestones = new Set(milestones);
    } else {
      trackedMilestones = new Set();
    }
  } catch {
    trackedMilestones = new Set();
  }
}

function saveTrackedMilestones(pagePath: string): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(
      getStorageKey(pagePath),
      JSON.stringify(Array.from(trackedMilestones))
    );
  } catch {
    // Storage full or unavailable
  }
}

// ============================================
// Public API
// ============================================

/**
 * Start scroll tracking for current page
 */
export function startScrollTracking(): void {
  if (typeof window === 'undefined') return;
  if (isTracking) return;

  currentPagePath = window.location.pathname;
  loadTrackedMilestones(currentPagePath);
  isTracking = true;

  window.addEventListener('scroll', handleScroll, { passive: true });

  // Check initial scroll position (for users landing mid-page)
  handleScroll();
}

/**
 * Stop scroll tracking
 */
export function stopScrollTracking(): void {
  if (typeof window === 'undefined') return;

  isTracking = false;
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
    scrollTimeout = null;
  }

  window.removeEventListener('scroll', handleScroll);
}

/**
 * Reset tracking for new page
 */
export function resetScrollTracking(): void {
  stopScrollTracking();
  trackedMilestones = new Set();
  startScrollTracking();
}

/**
 * Get current scroll depth
 */
export function getCurrentScrollDepth(): number {
  return getScrollPercentage();
}

/**
 * Get tracked milestones for current page
 */
export function getTrackedMilestones(): number[] {
  return Array.from(trackedMilestones);
}

/**
 * Check if milestone has been tracked
 */
export function hasMilestoneBeenTracked(milestone: ScrollMilestone): boolean {
  return trackedMilestones.has(milestone);
}

/**
 * Manually track a specific milestone
 */
export function forceTrackMilestone(milestone: ScrollMilestone): void {
  trackScrollMilestone(milestone);
}

