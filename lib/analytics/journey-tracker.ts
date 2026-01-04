/**
 * Journey Tracker
 * Tracks user progress through conversion funnel
 * Syncs across GA4, PostHog, and Clarity
 */

'use client';

import { trackEvent } from './analytics';
import { claritySetFunnelStep, clarityUpgrade } from './clarity';

// ============================================
// Funnel Step Definitions
// ============================================

export const FUNNEL_STEPS = {
  // Discovery Phase
  LANDING: 'landing',
  BROWSE_PACKAGES: 'browse_packages',
  SEARCH: 'search',
  FILTER: 'filter',

  // Consideration Phase
  VIEW_PACKAGE: 'view_package',
  VIEW_REVIEWS: 'view_reviews',
  CHECK_AVAILABILITY: 'check_availability',
  COMPARE_PACKAGES: 'compare_packages',

  // Booking Phase
  START_BOOKING: 'start_booking',
  SELECT_DATE: 'select_date',
  SELECT_PARTICIPANTS: 'select_participants',
  FILL_DETAILS: 'fill_details',
  ADD_EXTRAS: 'add_extras',

  // Payment Phase
  VIEW_SUMMARY: 'view_summary',
  SELECT_PAYMENT: 'select_payment',
  PAYMENT_PROCESSING: 'payment_processing',

  // Completion Phase
  PAYMENT_SUCCESS: 'payment_success',
  CONFIRMATION: 'confirmation',
  POST_BOOKING: 'post_booking',
} as const;

export type FunnelStep = (typeof FUNNEL_STEPS)[keyof typeof FUNNEL_STEPS];

// ============================================
// Journey Session Storage
// ============================================

const JOURNEY_KEY = 'aero_journey';

type JourneyData = {
  sessionId: string;
  startTime: number;
  steps: {
    step: FunnelStep;
    timestamp: number;
    metadata?: Record<string, unknown>;
  }[];
  lastStep: FunnelStep;
  packageId?: string;
  bookingId?: string;
};

function getJourneyData(): JourneyData | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = sessionStorage.getItem(JOURNEY_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setJourneyData(data: JourneyData): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(JOURNEY_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

function initJourney(): JourneyData {
  const data: JourneyData = {
    sessionId: `journey_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    startTime: Date.now(),
    steps: [],
    lastStep: FUNNEL_STEPS.LANDING,
  };
  setJourneyData(data);
  return data;
}

// ============================================
// Funnel Tracking Functions
// ============================================

/**
 * Track funnel step
 * Fires event to all analytics platforms
 */
export function trackFunnelStep(
  step: FunnelStep,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;

  // Get or initialize journey
  let journey = getJourneyData();
  if (!journey) {
    journey = initJourney();
  }

  const now = Date.now();
  const previousStep = journey.lastStep;
  const stepDuration = journey.steps.length > 0
    ? now - journey.steps[journey.steps.length - 1].timestamp
    : 0;

  // Add step to journey
  journey.steps.push({
    step,
    timestamp: now,
    metadata,
  });
  journey.lastStep = step;

  // Update package/booking IDs if provided
  if (metadata?.packageId) {
    journey.packageId = metadata.packageId as string;
  }
  if (metadata?.bookingId) {
    journey.bookingId = metadata.bookingId as string;
  }

  setJourneyData(journey);

  // Track in GA4 and PostHog
  trackEvent('funnel_step' as any, {
    funnel_step: step,
    previous_step: previousStep,
    step_duration_ms: stepDuration,
    journey_duration_ms: now - journey.startTime,
    step_number: journey.steps.length,
    session_id: journey.sessionId,
    package_id: journey.packageId,
    booking_id: journey.bookingId,
    ...metadata,
  });

  // Track in Clarity
  claritySetFunnelStep(step);

  // Upgrade session for important steps
  if (isConversionStep(step)) {
    clarityUpgrade(`funnel_${step}`);
  }
}

/**
 * Check if step is a conversion step
 */
function isConversionStep(step: FunnelStep): boolean {
  return [
    FUNNEL_STEPS.START_BOOKING,
    FUNNEL_STEPS.PAYMENT_SUCCESS,
    FUNNEL_STEPS.CONFIRMATION,
  ].includes(step);
}

/**
 * Track package view in funnel
 */
export function trackPackageView(
  packageId: string,
  packageName: string,
  price?: number
): void {
  trackFunnelStep(FUNNEL_STEPS.VIEW_PACKAGE, {
    packageId,
    packageName,
    price,
  });
}

/**
 * Track booking start
 */
export function trackBookingStart(packageId: string, packageName: string): void {
  trackFunnelStep(FUNNEL_STEPS.START_BOOKING, {
    packageId,
    packageName,
  });
}

/**
 * Track booking completion
 */
export function trackBookingComplete(
  bookingId: string,
  packageId: string,
  totalValue: number
): void {
  trackFunnelStep(FUNNEL_STEPS.CONFIRMATION, {
    bookingId,
    packageId,
    value: totalValue,
    currency: 'IDR',
  });
}

/**
 * Get current journey data
 */
export function getCurrentJourney(): JourneyData | null {
  return getJourneyData();
}

/**
 * Reset journey (start new session)
 */
export function resetJourney(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(JOURNEY_KEY);
}

/**
 * Get journey progress percentage
 * Based on typical conversion funnel
 */
export function getJourneyProgress(): number {
  const journey = getJourneyData();
  if (!journey) return 0;

  const stepOrder: FunnelStep[] = [
    FUNNEL_STEPS.LANDING,
    FUNNEL_STEPS.BROWSE_PACKAGES,
    FUNNEL_STEPS.VIEW_PACKAGE,
    FUNNEL_STEPS.START_BOOKING,
    FUNNEL_STEPS.FILL_DETAILS,
    FUNNEL_STEPS.SELECT_PAYMENT,
    FUNNEL_STEPS.CONFIRMATION,
  ];

  const currentIndex = stepOrder.indexOf(journey.lastStep);
  if (currentIndex === -1) return 0;

  return Math.round((currentIndex / (stepOrder.length - 1)) * 100);
}

/**
 * Check if user has viewed specific step
 */
export function hasViewedStep(step: FunnelStep): boolean {
  const journey = getJourneyData();
  if (!journey) return false;

  return journey.steps.some((s) => s.step === step);
}

/**
 * Get time since journey started
 */
export function getJourneyDuration(): number {
  const journey = getJourneyData();
  if (!journey) return 0;

  return Date.now() - journey.startTime;
}

