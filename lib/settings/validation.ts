/**
 * Validation Settings
 * Fetch validation limits from database with fallbacks
 * 
 * SERVER-ONLY - Do not import in client components
 * For client components, use '@/lib/settings/validation-types' instead
 */

import 'server-only';

import { getSetting } from '.';
import { logger } from '@/lib/utils/logger';
import { DEFAULT_VALIDATION_SETTINGS, type ValidationSettings } from './validation-types';

// Re-export types for server consumers
export { DEFAULT_VALIDATION_SETTINGS, type ValidationSettings } from './validation-types';

// ============================================
// CACHE
// ============================================

let cachedSettings: ValidationSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isCacheValid(): boolean {
  return cachedSettings !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

/**
 * Clear validation settings cache
 */
export function clearValidationSettingsCache(): void {
  cachedSettings = null;
  cacheTimestamp = 0;
}

// ============================================
// GETTER
// ============================================

function parseNumber(value: unknown, defaultValue: number): number {
  if (value === null || value === undefined) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get validation settings from database with fallback to defaults
 */
export async function getValidationSettings(): Promise<ValidationSettings> {
  // Check cache
  if (isCacheValid() && cachedSettings) {
    return cachedSettings;
  }

  try {
    const [
      packageCodeMinLength,
      packageCodeMaxLength,
      packageNameMinLength,
      packageNameMaxLength,
      slugMinLength,
      slugMaxLength,
      shortDescriptionMaxLength,
      minPaxMinimum,
      maxPaxMinimum,
    ] = await Promise.all([
      getSetting('validation.package_code_min_length'),
      getSetting('validation.package_code_max_length'),
      getSetting('validation.package_name_min_length'),
      getSetting('validation.package_name_max_length'),
      getSetting('validation.slug_min_length'),
      getSetting('validation.slug_max_length'),
      getSetting('validation.short_description_max_length'),
      getSetting('validation.min_pax_minimum'),
      getSetting('validation.max_pax_minimum'),
    ]);

    cachedSettings = {
      packageCodeMinLength: parseNumber(packageCodeMinLength, DEFAULT_VALIDATION_SETTINGS.packageCodeMinLength),
      packageCodeMaxLength: parseNumber(packageCodeMaxLength, DEFAULT_VALIDATION_SETTINGS.packageCodeMaxLength),
      packageNameMinLength: parseNumber(packageNameMinLength, DEFAULT_VALIDATION_SETTINGS.packageNameMinLength),
      packageNameMaxLength: parseNumber(packageNameMaxLength, DEFAULT_VALIDATION_SETTINGS.packageNameMaxLength),
      slugMinLength: parseNumber(slugMinLength, DEFAULT_VALIDATION_SETTINGS.slugMinLength),
      slugMaxLength: parseNumber(slugMaxLength, DEFAULT_VALIDATION_SETTINGS.slugMaxLength),
      shortDescriptionMaxLength: parseNumber(shortDescriptionMaxLength, DEFAULT_VALIDATION_SETTINGS.shortDescriptionMaxLength),
      minPaxMinimum: parseNumber(minPaxMinimum, DEFAULT_VALIDATION_SETTINGS.minPaxMinimum),
      maxPaxMinimum: parseNumber(maxPaxMinimum, DEFAULT_VALIDATION_SETTINGS.maxPaxMinimum),
    };

    cacheTimestamp = Date.now();
    return cachedSettings;
  } catch (error) {
    logger.error('Failed to fetch validation settings', error);
    return DEFAULT_VALIDATION_SETTINGS;
  }
}

