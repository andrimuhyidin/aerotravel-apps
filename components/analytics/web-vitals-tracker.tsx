/**
 * Web Vitals Tracker Component
 * Initializes Web Vitals tracking on client-side
 * Sends metrics to GA4, PostHog, and Clarity
 */

'use client';

import { useEffect } from 'react';
import { claritySetTag, isClarityAvailable } from '@/lib/analytics/clarity';

type WebVitalMetric = {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
};

/**
 * Send metric to Clarity
 */
function sendToClarity(metric: WebVitalMetric): void {
  if (!isClarityAvailable()) return;

  claritySetTag(`cwv_${metric.name.toLowerCase()}`, String(Math.round(metric.value)));
  claritySetTag(`cwv_${metric.name.toLowerCase()}_rating`, metric.rating);
}

/**
 * Send metric to GA4
 */
function sendToGA4(metric: WebVitalMetric): void {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'web_vital', {
    event_category: 'Web Vitals',
    event_label: metric.name,
    value: metric.name === 'CLS' ? Math.round(metric.value * 1000) : Math.round(metric.value),
    metric_id: metric.id,
    metric_value: metric.value,
    metric_rating: metric.rating,
  });
}

/**
 * Send metric to all platforms
 */
function reportMetric(metric: WebVitalMetric): void {
  sendToGA4(metric);
  sendToClarity(metric);

  // Also send to PostHog via analytics module
  if (typeof window !== 'undefined') {
    import('@/lib/analytics/analytics')
      .then(({ trackEvent }) => {
        trackEvent('page_view' as any, {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_rating: metric.rating,
          metric_id: metric.id,
        });
      })
      .catch(() => {
        // Silent fail
      });
  }
}

export function WebVitalsTracker() {
  useEffect(() => {
    // Dynamically import web-vitals to avoid SSR issues
    import('web-vitals')
      .then(({ onCLS, onFID, onLCP, onTTFB, onINP }) => {
        // Track Core Web Vitals
        onCLS((metric) => {
          reportMetric({
            id: metric.id,
            name: 'CLS',
            value: metric.value,
            rating: metric.rating,
          });
        });

        onFID((metric) => {
          reportMetric({
            id: metric.id,
            name: 'FID',
            value: metric.value,
            rating: metric.rating,
          });
        });

        onLCP((metric) => {
          reportMetric({
            id: metric.id,
            name: 'LCP',
            value: metric.value,
            rating: metric.rating,
          });
        });

        onTTFB((metric) => {
          reportMetric({
            id: metric.id,
            name: 'TTFB',
            value: metric.value,
            rating: metric.rating,
          });
        });

        onINP((metric) => {
          reportMetric({
            id: metric.id,
            name: 'INP',
            value: metric.value,
            rating: metric.rating,
          });
        });
      })
      .catch(() => {
        // web-vitals package not installed, skip silently
      });

    // Track page load performance
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance;
      if (perfData.timing) {
        const timing = perfData.timing;
        const tti = timing.domInteractive - timing.navigationStart;
        const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
        const loadComplete = timing.loadEventEnd - timing.navigationStart;

        // Send to GA4
        if (window.gtag) {
          window.gtag('event', 'page_load_performance', {
            event_category: 'Performance',
            tti,
            dom_content_loaded: domContentLoaded,
            load_complete: loadComplete,
            non_interaction: true,
          });
        }

        // Send to Clarity
        if (isClarityAvailable()) {
          claritySetTag('page_tti', String(tti));
          claritySetTag('page_dcl', String(domContentLoaded));
          claritySetTag('page_load', String(loadComplete));
        }
      }
    }
  }, []);

  return null;
}
