/**
 * Performance Monitoring
 * Tracks Core Web Vitals and other performance metrics
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface WebVitalsMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  fcp?: number; // First Contentful Paint
  tti?: number; // Time to Interactive
}

export interface PerformanceReport {
  pageUrl: string;
  pageType?: string;
  metrics: WebVitalsMetrics;
  resourceCount?: number;
  domLoadTime?: number;
  pageLoadTime?: number;
  connectionInfo?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
}

class PerformanceMonitor {
  private sessionId: string;
  private metrics: Partial<WebVitalsMetrics> = {};
  private hasReported = false;

  constructor() {
    this.sessionId = this.getSessionId();
    this.initializeObservers();
  }

  /**
   * Initialize Web Vitals observers
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // LCP (Largest Contentful Paint)
    this.observeLCP();

    // FID (First Input Delay)
    this.observeFID();

    // CLS (Cumulative Layout Shift)
    this.observeCLS();

    // Navigation Timing API
    this.observeNavigationTiming();

    // Report on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.reportMetrics();
      });
    }
  }

  /**
   * Observe Largest Contentful Paint
   */
  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime: number;
          loadTime: number;
        };
        this.metrics.lcp = (lastEntry.renderTime || lastEntry.loadTime) / 1000; // Convert to seconds
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      logger.debug('LCP observer not supported', error);
    }
  }

  /**
   * Observe First Input Delay
   */
  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          this.metrics.fid = fidEntry.processingStart - fidEntry.startTime; // In milliseconds
        });
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      logger.debug('FID observer not supported', error);
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private observeCLS(): void {
    try {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as LayoutShift;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
            this.metrics.cls = clsValue;
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      logger.debug('CLS observer not supported', error);
    }
  }

  /**
   * Observe Navigation Timing
   */
  private observeNavigationTiming(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      // Wait a bit for all metrics to be collected
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        if (navigation) {
          this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
          this.metrics.fcp = this.getFCP();
          this.metrics.tti = this.getTTI(navigation);

          // Report after page load
          this.reportMetrics();
        }
      }, 3000); // Wait 3s after load
    });
  }

  /**
   * Get First Contentful Paint
   */
  private getFCP(): number | undefined {
    try {
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      return fcpEntry ? fcpEntry.startTime : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Estimate Time to Interactive
   */
  private getTTI(navigation: PerformanceNavigationTiming): number | undefined {
    try {
      return navigation.domInteractive - navigation.fetchStart;
    } catch {
      return undefined;
    }
  }

  /**
   * Get connection info
   */
  private getConnectionInfo() {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return {};
    }

    const connection = (navigator as Navigator & { connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
    } }).connection;

    return {
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    };
  }

  /**
   * Get device type
   */
  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Get browser name
   */
  private getBrowser(): string {
    if (typeof navigator === 'undefined') return 'unknown';

    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('safari')) return 'Safari';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('edge')) return 'Edge';
    return 'Other';
  }

  /**
   * Report metrics to database
   */
  async reportMetrics(pageType?: string): Promise<void> {
    if (this.hasReported) return;
    this.hasReported = true;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource');

      const metricsData = {
        page_url: typeof window !== 'undefined' ? window.location.href : null,
        page_type: pageType || null,
        lcp: this.metrics.lcp || null,
        fid: this.metrics.fid || null,
        cls: this.metrics.cls || null,
        ttfb: this.metrics.ttfb || null,
        fcp: this.metrics.fcp || null,
        tti: this.metrics.tti || null,
        dom_load_time: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart) : null,
        page_load_time: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : null,
        resource_count: resources.length,
        connection_type: this.getConnectionInfo().effectiveType || null,
        effective_type: this.getConnectionInfo().effectiveType || null,
        downlink: this.getConnectionInfo().downlink || null,
        rtt: this.getConnectionInfo().rtt || null,
        user_id: user?.id || null,
        session_id: this.sessionId,
        device_type: this.getDeviceType(),
        browser: this.getBrowser(),
      };

      const { error } = await supabase.from('performance_metrics').insert(metricsData);

      if (error) {
        logger.error('Failed to report performance metrics', error, { metricsData });
      } else {
        logger.info('Performance metrics reported', metricsData);
      }
    } catch (error) {
      logger.error('Error reporting performance metrics', error);
    }
  }

  /**
   * Get current metrics (for debugging)
   */
  getMetrics(): Partial<WebVitalsMetrics> {
    return { ...this.metrics };
  }

  /**
   * Reset for new page
   */
  reset(): void {
    this.metrics = {};
    this.hasReported = false;
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'ssr';

    const key = 'perf_session_id';
    let sessionId = sessionStorage.getItem(key);

    if (!sessionId) {
      sessionId = `perf_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem(key, sessionId);
    }

    return sessionId;
  }
}

// Singleton instance
let performanceMonitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitorInstance && typeof window !== 'undefined') {
    performanceMonitorInstance = new PerformanceMonitor();
  }
  return performanceMonitorInstance!;
}

// React Hook for performance monitoring
import { useEffect } from 'react';

export function usePerformanceMonitoring(pageType?: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const monitor = getPerformanceMonitor();
    monitor.reset();

    // Report metrics when component unmounts or after 10 seconds
    const timeout = setTimeout(() => {
      monitor.reportMetrics(pageType);
    }, 10000);

    return () => {
      clearTimeout(timeout);
      monitor.reportMetrics(pageType);
    };
  }, [pageType]);
}

// Convenience export
export const performanceMonitor =
  typeof window !== 'undefined' ? getPerformanceMonitor() : null;

