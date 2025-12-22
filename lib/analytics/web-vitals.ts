/**
 * Web Vitals Performance Tracking
 * Tracks Core Web Vitals (LCP, FID, CLS, TTI) and sends to analytics
 */

'use client';

import { onCLS, onFID, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

type WebVitalsOptions = {
  debug?: boolean;
  sampleRate?: number;
};

/**
 * Track Web Vitals metrics
 */
export function trackWebVitals(options: WebVitalsOptions = {}) {
  const { debug = false, sampleRate = 1.0 } = options;

  // Only track for sample rate percentage of users
  if (Math.random() > sampleRate) {
    return;
  }

  function sendToAnalytics(metric: Metric) {
    if (debug) {
      console.log('[Web Vitals]', metric);
    }

    // Send to GA4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
        // Custom dimensions
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: metric.rating,
      });
    }

    // Send to PostHog
    if (typeof window !== 'undefined') {
      import('./posthog')
        .then(({ posthog }) => {
          if (posthog && typeof posthog.capture === 'function') {
            posthog.capture('web_vital', {
              name: metric.name,
              value: metric.value,
              delta: metric.delta,
              rating: metric.rating,
              id: metric.id,
            });
          }
        })
        .catch(() => {
          // PostHog not available, skip silently
        });
    }

    // Send to Sentry (if available)
    if (typeof window !== 'undefined') {
      import('@sentry/nextjs')
        .then((Sentry) => {
          // Sentry metrics API may vary by version
          try {
            if (Sentry.metrics && typeof Sentry.metrics.distribution === 'function') {
              Sentry.metrics.distribution(`web_vital.${metric.name}`, metric.value, {
                unit: metric.name === 'CLS' ? 'ratio' : 'millisecond',
              });
            }
          } catch (error) {
            // Sentry metrics not available or API changed, skip silently
          }
        })
        .catch(() => {
          // Sentry not available, skip silently
        });
    }
  }

  // Track Core Web Vitals
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onINP(sendToAnalytics); // INP replaces FID in 2024
}

/**
 * Track page load performance
 */
export function trackPageLoadPerformance() {
  if (typeof window === 'undefined') return;

  // Track Time to Interactive (TTI) approximation
  const perfData = window.performance;
  if (perfData && perfData.timing) {
    const timing = perfData.timing;
    const tti = timing.domInteractive - timing.navigationStart;
    const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
    const loadComplete = timing.loadEventEnd - timing.navigationStart;

    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'page_load_performance', {
        event_category: 'Performance',
        tti,
        dom_content_loaded: domContentLoaded,
        load_complete: loadComplete,
        non_interaction: true,
      });
    }
  }

  // Track Resource Timing
  if (perfData && perfData.getEntriesByType) {
    const resources = perfData.getEntriesByType('resource') as PerformanceResourceTiming[];
    const apiCalls = resources.filter((r) => r.name.includes('/api/'));
    
    if (apiCalls.length > 0) {
      const avgApiTime = apiCalls.reduce((sum, r) => sum + (r.responseEnd - r.requestStart), 0) / apiCalls.length;
      const totalApiTime = apiCalls.reduce((sum, r) => sum + (r.responseEnd - r.requestStart), 0);

      if (window.gtag) {
        window.gtag('event', 'api_performance', {
          event_category: 'Performance',
          api_call_count: apiCalls.length,
          avg_api_time: Math.round(avgApiTime),
          total_api_time: Math.round(totalApiTime),
          non_interaction: true,
        });
      }
    }
  }
}

