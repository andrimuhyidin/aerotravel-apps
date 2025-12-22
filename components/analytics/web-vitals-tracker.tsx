/**
 * Web Vitals Tracker Component
 * Initializes Web Vitals tracking on client-side
 */

'use client';

import { useEffect } from 'react';

export function WebVitalsTracker() {
  useEffect(() => {
    // Dynamically import web-vitals to avoid SSR issues
    // Note: Install web-vitals package: npm install web-vitals
    import('web-vitals')
      .then(({ onCLS, onFID, onLCP, onTTFB, onINP }) => {
        // Track Core Web Vitals
        onCLS((metric) => {
          // Send to GA4
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'web_vital', {
              event_category: 'Web Vitals',
              event_label: 'CLS',
              value: Math.round(metric.value * 1000),
              metric_id: metric.id,
              metric_value: metric.value,
              metric_rating: metric.rating,
            });
          }
        });

        onFID((metric) => {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'web_vital', {
              event_category: 'Web Vitals',
              event_label: 'FID',
              value: Math.round(metric.value),
              metric_id: metric.id,
              metric_value: metric.value,
              metric_rating: metric.rating,
            });
          }
        });

        onLCP((metric) => {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'web_vital', {
              event_category: 'Web Vitals',
              event_label: 'LCP',
              value: Math.round(metric.value),
              metric_id: metric.id,
              metric_value: metric.value,
              metric_rating: metric.rating,
            });
          }
        });

        onTTFB((metric) => {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'web_vital', {
              event_category: 'Web Vitals',
              event_label: 'TTFB',
              value: Math.round(metric.value),
              metric_id: metric.id,
              metric_value: metric.value,
              metric_rating: metric.rating,
            });
          }
        });

        onINP((metric) => {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'web_vital', {
              event_category: 'Web Vitals',
              event_label: 'INP',
              value: Math.round(metric.value),
              metric_id: metric.id,
              metric_value: metric.value,
              metric_rating: metric.rating,
            });
          }
        });
      })
      .catch(() => {
        // web-vitals package not installed, skip silently
        // To enable: npm install web-vitals
      });

    // Track page load performance
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance;
      if (perfData.timing) {
        const timing = perfData.timing;
        const tti = timing.domInteractive - timing.navigationStart;
        const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
        const loadComplete = timing.loadEventEnd - timing.navigationStart;

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
    }
  }, []);

  return null;
}

