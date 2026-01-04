/**
 * Page Journey Tracker Component
 * Tracks funnel steps automatically on page mount
 */

'use client';

import { useEffect, useRef } from 'react';
import { trackFunnelStep, FunnelStep, FUNNEL_STEPS } from '@/lib/analytics/journey-tracker';
import { trackItemView } from '@/lib/analytics/analytics';

type PageJourneyTrackerProps = {
  step: FunnelStep;
  metadata?: Record<string, unknown>;
  /** For package views - track item view as well */
  packageInfo?: {
    itemId: string;
    itemName: string;
    itemCategory?: string;
    price?: number;
  };
};

export function PageJourneyTracker({
  step,
  metadata,
  packageInfo,
}: PageJourneyTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Track funnel step
    trackFunnelStep(step, metadata);

    // Track item view if package info provided
    if (packageInfo) {
      trackItemView({
        itemId: packageInfo.itemId,
        itemName: packageInfo.itemName,
        itemCategory: packageInfo.itemCategory,
        price: packageInfo.price,
      });
    }
  }, [step, metadata, packageInfo]);

  return null;
}

/**
 * Pre-configured tracker for Browse Packages page
 */
export function BrowsePackagesTracker() {
  return <PageJourneyTracker step={FUNNEL_STEPS.BROWSE_PACKAGES} />;
}

/**
 * Pre-configured tracker for Package Detail page
 */
export function ViewPackageTracker({
  packageId,
  packageName,
  price,
  category,
}: {
  packageId: string;
  packageName: string;
  price?: number;
  category?: string;
}) {
  return (
    <PageJourneyTracker
      step={FUNNEL_STEPS.VIEW_PACKAGE}
      metadata={{ packageId, packageName, price }}
      packageInfo={{
        itemId: packageId,
        itemName: packageName,
        itemCategory: category,
        price,
      }}
    />
  );
}

/**
 * Pre-configured tracker for Booking Start
 */
export function StartBookingTracker({
  packageId,
  packageName,
}: {
  packageId?: string;
  packageName?: string;
}) {
  return (
    <PageJourneyTracker
      step={FUNNEL_STEPS.START_BOOKING}
      metadata={{ packageId, packageName }}
    />
  );
}

/**
 * Pre-configured tracker for Booking Confirmation
 */
export function BookingConfirmationTracker({
  bookingId,
  packageId,
  value,
}: {
  bookingId: string;
  packageId: string;
  value: number;
}) {
  return (
    <PageJourneyTracker
      step={FUNNEL_STEPS.CONFIRMATION}
      metadata={{ bookingId, packageId, value }}
    />
  );
}

