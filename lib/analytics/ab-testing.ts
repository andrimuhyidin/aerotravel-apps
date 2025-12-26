/**
 * A/B Testing System
 * Allows running experiments to test different UI/UX variants
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface ABTestExperiment {
  id: string;
  experimentKey: string;
  experimentName: string;
  description: string | null;
  variants: Array<{
    key: string;
    weight: number;
    config?: Record<string, unknown>;
  }>;
  status: 'draft' | 'running' | 'paused' | 'completed';
  targetPages: string[] | null;
  startDate: string | null;
  endDate: string | null;
}

export interface ABTestVariant {
  key: string;
  config?: Record<string, unknown>;
}

class ABTestingService {
  private sessionId: string;
  private cache: Map<string, string> = new Map();

  constructor() {
    this.sessionId = this.getSessionId();
  }

  /**
   * Get the variant for a user in an experiment
   */
  async getVariant(experimentKey: string): Promise<string> {
    try {
      // Check cache first
      if (this.cache.has(experimentKey)) {
        return this.cache.get(experimentKey)!;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Call database function to get/assign variant
      const { data, error } = await supabase.rpc('get_ab_test_variant', {
        p_experiment_key: experimentKey,
        p_user_id: user?.id || null,
        p_session_id: this.sessionId,
      });

      if (error) {
        logger.error('Failed to get A/B test variant', error, { experimentKey });
        return 'control'; // Default to control on error
      }

      const variant = data as string || 'control';
      this.cache.set(experimentKey, variant);

      return variant;
    } catch (error) {
      logger.error('Error getting A/B test variant', error, { experimentKey });
      return 'control';
    }
  }

  /**
   * Check if a variant is active
   */
  async isVariant(experimentKey: string, variantKey: string): Promise<boolean> {
    const currentVariant = await this.getVariant(experimentKey);
    return currentVariant === variantKey;
  }

  /**
   * Get variant configuration
   */
  async getVariantConfig<T = Record<string, unknown>>(
    experimentKey: string
  ): Promise<T | null> {
    try {
      const supabase = createClient();
      const variant = await this.getVariant(experimentKey);

      const { data, error } = await supabase
        .from('ab_test_experiments')
        .select('variants')
        .eq('experiment_key', experimentKey)
        .eq('status', 'running')
        .single();

      if (error || !data) {
        return null;
      }

      const variants = data.variants as Array<{
        key: string;
        config?: T;
      }>;
      const variantConfig = variants.find((v) => v.key === variant);

      return variantConfig?.config || null;
    } catch (error) {
      logger.error('Error getting variant config', error, { experimentKey });
      return null;
    }
  }

  /**
   * Track experiment exposure (when user sees the variant)
   */
  async trackExposure(experimentKey: string, properties?: Record<string, unknown>): Promise<void> {
    try {
      const variant = await this.getVariant(experimentKey);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from('feature_analytics_events').insert({
        user_id: user?.id || null,
        session_id: this.sessionId,
        event_name: 'ab_test_exposure',
        event_category: 'feature_use',
        event_action: 'exposure',
        event_label: experimentKey,
        feature_name: null,
        feature_variant: variant,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
        properties: {
          experimentKey,
          variant,
          ...properties,
        },
      });
    } catch (error) {
      logger.error('Error tracking experiment exposure', error, { experimentKey });
    }
  }

  /**
   * Track conversion event for experiment
   */
  async trackConversion(
    experimentKey: string,
    conversionType: string,
    value?: number,
    properties?: Record<string, unknown>
  ): Promise<void> {
    try {
      const variant = await this.getVariant(experimentKey);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from('feature_analytics_events').insert({
        user_id: user?.id || null,
        session_id: this.sessionId,
        event_name: 'ab_test_conversion',
        event_category: 'feature_use',
        event_action: 'conversion',
        event_label: `${experimentKey}_${conversionType}`,
        event_value: value || null,
        feature_name: null,
        feature_variant: variant,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
        properties: {
          experimentKey,
          variant,
          conversionType,
          ...properties,
        },
      });
    } catch (error) {
      logger.error('Error tracking conversion', error, { experimentKey, conversionType });
    }
  }

  /**
   * Clear cache (useful when user logs in/out)
   */
  clearCache(): void {
    this.cache.clear();
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'ssr';

    const key = 'ab_test_session_id';
    let sessionId = sessionStorage.getItem(key);

    if (!sessionId) {
      sessionId = `ab_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem(key, sessionId);
    }

    return sessionId;
  }
}

// Singleton instance
let abTestingInstance: ABTestingService | null = null;

export function getABTestingService(): ABTestingService {
  if (!abTestingInstance) {
    abTestingInstance = new ABTestingService();
  }
  return abTestingInstance;
}

// React Hook for A/B Testing
import { useEffect, useState } from 'react';

export function useABTest(experimentKey: string): {
  variant: string;
  isLoading: boolean;
  isVariant: (variantKey: string) => boolean;
  trackConversion: (conversionType: string, value?: number) => Promise<void>;
} {
  const [variant, setVariant] = useState<string>('control');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const abService = getABTestingService();

  useEffect(() => {
    let mounted = true;

    async function fetchVariant() {
      const v = await abService.getVariant(experimentKey);
      if (mounted) {
        setVariant(v);
        setIsLoading(false);
        // Track exposure
        await abService.trackExposure(experimentKey);
      }
    }

    fetchVariant();

    return () => {
      mounted = false;
    };
  }, [experimentKey, abService]);

  const isVariant = (variantKey: string) => variant === variantKey;

  const trackConversion = async (conversionType: string, value?: number) => {
    await abService.trackConversion(experimentKey, conversionType, value);
  };

  return { variant, isLoading, isVariant, trackConversion };
}

// Convenience export
export const abTesting = typeof window !== 'undefined' ? getABTestingService() : null;

