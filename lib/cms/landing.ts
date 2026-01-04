/**
 * Landing Pages Library
 * Functions to fetch landing page content from settings
 */

import 'server-only';

import { getSettings } from '@/lib/settings';
import { parseJsonOrDefault } from '@/lib/settings/utils';
import { logger } from '@/lib/utils/logger';

export interface LandingBenefit {
  icon: string;
  title: string;
  description: string;
}

export interface LandingStat {
  icon: string;
  value: string;
  label: string;
}

export interface LandingContent {
  benefits: LandingBenefit[];
  requirements?: string[];
  features?: string[];
  stats?: LandingStat[];
}

/**
 * Get landing page content by type
 */
export async function getLandingContent(
  type: 'guide' | 'partner' | 'corporate'
): Promise<LandingContent> {
  try {
    const settings = await getSettings();

    const benefitsKey = `landing.${type}.benefits`;
    const requirementsKey = `landing.${type}.requirements`;
    const featuresKey = `landing.${type}.features`;
    const statsKey = `landing.${type}.stats`;

    const benefits = parseJsonOrDefault<LandingBenefit[]>(
      settings[benefitsKey],
      []
    );
    const requirements =
      type === 'guide'
        ? parseJsonOrDefault<string[]>(settings[requirementsKey], [])
        : undefined;
    const features =
      type !== 'guide'
        ? parseJsonOrDefault<string[]>(settings[featuresKey], [])
        : undefined;
    const stats =
      type === 'guide'
        ? parseJsonOrDefault<LandingStat[]>(settings[statsKey], [])
        : undefined;

    return {
      benefits,
      requirements,
      features,
      stats,
    };
  } catch (error) {
    logger.error(`Error fetching landing content: ${type}`, error);
    return {
      benefits: [],
      requirements: type === 'guide' ? [] : undefined,
      features: type !== 'guide' ? [] : undefined,
      stats: type === 'guide' ? [] : undefined,
    };
  }
}

