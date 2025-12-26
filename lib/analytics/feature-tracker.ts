/**
 * Feature Analytics Tracker
 * Tracks user interactions with new features for data-driven decisions
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export type EventCategory =
  | 'page_view'
  | 'click'
  | 'form_submit'
  | 'feature_use'
  | 'search'
  | 'filter'
  | 'modal_open'
  | 'modal_close'
  | 'error';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export type FeatureName =
  | 'package_filter_sidebar'
  | 'package_quick_view'
  | 'booking_widget'
  | 'photo_gallery_lightbox'
  | 'similar_packages_carousel'
  | 'package_reviews'
  | 'package_faq'
  | 'availability_checker'
  | 'price_calculator'
  | 'share_package'
  | 'save_package';

interface TrackEventOptions {
  eventName: string;
  eventCategory: EventCategory;
  eventAction: string;
  eventLabel?: string;
  eventValue?: number;
  featureName?: FeatureName;
  featureVariant?: string;
  properties?: Record<string, unknown>;
}

interface PerformanceMetrics {
  pageLoadTime?: number;
  timeToInteractive?: number;
  firstContentfulPaint?: number;
}

class FeatureTracker {
  private sessionId: string;
  private deviceType: DeviceType;
  private browser: string;
  private os: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.deviceType = this.detectDeviceType();
    this.browser = this.detectBrowser();
    this.os = this.detectOS();
  }

  /**
   * Track a feature interaction event
   */
  async trackEvent(options: TrackEventOptions): Promise<void> {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const eventData = {
        user_id: user?.id || null,
        session_id: this.sessionId,
        event_name: options.eventName,
        event_category: options.eventCategory,
        event_action: options.eventAction,
        event_label: options.eventLabel || null,
        event_value: options.eventValue || null,
        feature_name: options.featureName || null,
        feature_variant: options.featureVariant || null,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
        page_title: typeof window !== 'undefined' ? document.title : null,
        referrer: typeof window !== 'undefined' ? document.referrer : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        device_type: this.deviceType,
        browser: this.browser,
        os: this.os,
        properties: options.properties || {},
      };

      const { error } = await supabase
        .from('feature_analytics_events')
        .insert(eventData);

      if (error) {
        logger.error('Failed to track event', error, { eventData });
      }
    } catch (error) {
      logger.error('Error tracking event', error, { options });
    }
  }

  /**
   * Track page view
   */
  async trackPageView(
    featureName?: FeatureName,
    metrics?: PerformanceMetrics
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'page_view',
      eventCategory: 'page_view',
      eventAction: 'view',
      featureName,
      properties: {
        pageLoadTime: metrics?.pageLoadTime,
        timeToInteractive: metrics?.timeToInteractive,
        firstContentfulPaint: metrics?.firstContentfulPaint,
      },
    });
  }

  /**
   * Track feature usage
   */
  async trackFeatureUse(
    featureName: FeatureName,
    action: string,
    label?: string,
    properties?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      eventName: `feature_${featureName}_${action}`,
      eventCategory: 'feature_use',
      eventAction: action,
      eventLabel: label,
      featureName,
      properties,
    });
  }

  /**
   * Track filter usage (for package filter sidebar)
   */
  async trackFilterUse(
    filterType: string,
    filterValue: unknown,
    resultCount: number
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'filter_applied',
      eventCategory: 'filter',
      eventAction: 'apply',
      eventLabel: filterType,
      eventValue: resultCount,
      featureName: 'package_filter_sidebar',
      properties: {
        filterType,
        filterValue,
        resultCount,
      },
    });
  }

  /**
   * Track search usage
   */
  async trackSearch(
    query: string,
    resultCount: number,
    filters?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'search_performed',
      eventCategory: 'search',
      eventAction: 'search',
      eventLabel: query,
      eventValue: resultCount,
      properties: {
        query,
        resultCount,
        filters,
      },
    });
  }

  /**
   * Track modal/dialog interactions
   */
  async trackModal(
    modalName: string,
    action: 'open' | 'close',
    featureName?: FeatureName
  ): Promise<void> {
    await this.trackEvent({
      eventName: `modal_${action}`,
      eventCategory: action === 'open' ? 'modal_open' : 'modal_close',
      eventAction: action,
      eventLabel: modalName,
      featureName,
    });
  }

  /**
   * Track form submissions
   */
  async trackFormSubmit(
    formName: string,
    success: boolean,
    properties?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'form_submit',
      eventCategory: 'form_submit',
      eventAction: success ? 'success' : 'error',
      eventLabel: formName,
      properties,
    });
  }

  /**
   * Track errors
   */
  async trackError(
    errorType: string,
    errorMessage: string,
    properties?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'error_occurred',
      eventCategory: 'error',
      eventAction: errorType,
      eventLabel: errorMessage,
      properties,
    });
  }

  // =====================================================
  // Private Helper Methods
  // =====================================================

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'ssr';

    const key = 'analytics_session_id';
    let sessionId = sessionStorage.getItem(key);

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem(key, sessionId);
    }

    return sessionId;
  }

  private detectDeviceType(): DeviceType {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private detectBrowser(): string {
    if (typeof navigator === 'undefined') return 'unknown';

    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('safari')) return 'Safari';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('edge')) return 'Edge';
    return 'Other';
  }

  private detectOS(): string {
    if (typeof navigator === 'undefined') return 'unknown';

    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) return 'Windows';
    if (userAgent.includes('mac')) return 'macOS';
    if (userAgent.includes('linux')) return 'Linux';
    if (userAgent.includes('android')) return 'Android';
    if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad'))
      return 'iOS';
    return 'Other';
  }
}

// Singleton instance
let trackerInstance: FeatureTracker | null = null;

export function getFeatureTracker(): FeatureTracker {
  if (!trackerInstance) {
    trackerInstance = new FeatureTracker();
  }
  return trackerInstance;
}

// Convenience export
export const featureTracker = typeof window !== 'undefined' ? getFeatureTracker() : null;

