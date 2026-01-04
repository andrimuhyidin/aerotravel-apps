'use client';

/**
 * useValidationSettings Hook
 * Fetch validation settings from API for dynamic form validation
 */

import { useQuery } from '@tanstack/react-query';

import { DEFAULT_VALIDATION_SETTINGS, type ValidationSettings } from '@/lib/settings/validation-types';

/**
 * Fetch validation settings from API
 */
async function fetchValidationSettings(): Promise<ValidationSettings> {
  const response = await fetch('/api/settings?prefix=validation.');

  if (!response.ok) {
    throw new Error('Failed to fetch validation settings');
  }

  const data = await response.json();
  const settings = data.settings || {};

  // Parse settings from API response
  const parseNumber = (key: string, defaultValue: number): number => {
    const value = settings[key];
    if (value === null || value === undefined) return defaultValue;
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  return {
    packageCodeMinLength: parseNumber('validation.package_code_min_length', DEFAULT_VALIDATION_SETTINGS.packageCodeMinLength),
    packageCodeMaxLength: parseNumber('validation.package_code_max_length', DEFAULT_VALIDATION_SETTINGS.packageCodeMaxLength),
    packageNameMinLength: parseNumber('validation.package_name_min_length', DEFAULT_VALIDATION_SETTINGS.packageNameMinLength),
    packageNameMaxLength: parseNumber('validation.package_name_max_length', DEFAULT_VALIDATION_SETTINGS.packageNameMaxLength),
    slugMinLength: parseNumber('validation.slug_min_length', DEFAULT_VALIDATION_SETTINGS.slugMinLength),
    slugMaxLength: parseNumber('validation.slug_max_length', DEFAULT_VALIDATION_SETTINGS.slugMaxLength),
    shortDescriptionMaxLength: parseNumber('validation.short_description_max_length', DEFAULT_VALIDATION_SETTINGS.shortDescriptionMaxLength),
    minPaxMinimum: parseNumber('validation.min_pax_minimum', DEFAULT_VALIDATION_SETTINGS.minPaxMinimum),
    maxPaxMinimum: parseNumber('validation.max_pax_minimum', DEFAULT_VALIDATION_SETTINGS.maxPaxMinimum),
  };
}

/**
 * Hook to fetch validation settings
 * Returns validation settings with default fallback
 */
export function useValidationSettings() {
  const query = useQuery({
    queryKey: ['settings', 'validation'],
    queryFn: fetchValidationSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    settings: query.data ?? DEFAULT_VALIDATION_SETTINGS,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export { DEFAULT_VALIDATION_SETTINGS };
export type { ValidationSettings };

