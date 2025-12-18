'use client';

/**
 * Google Analytics 4 Integration
 * Sesuai PRD 2.2.E - Analytics & Experimentation
 */

declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

export function initGA4(measurementId: string) {
  if (typeof window === 'undefined') return;

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  window.gtag = function (...args: unknown[]) {
    if (window.dataLayer) {
      window.dataLayer.push(...args);
    }
  };

  window.gtag('js', new Date().toISOString());
  window.gtag('config', measurementId, {
    page_path: window.location.pathname,
  });
}

export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

export function trackPageView(path: string) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!, {
    page_path: path,
  });
}

