/**
 * Spacing Utilities
 * Helper functions untuk consistent spacing menggunakan 4px grid system
 */

import { designTokens } from './tokens';

export type SpacingKey = keyof typeof designTokens.spacing;

/**
 * Get spacing value dari design tokens
 */
export function getSpacing(key: SpacingKey): string {
  return designTokens.spacing[key];
}

/**
 * Convert spacing key ke Tailwind padding class
 */
export function spacingToPadding(key: SpacingKey): string {
  const map: Record<SpacingKey, string> = {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
    '2xl': 'p-12',
    '3xl': 'p-16',
    '4xl': 'p-24',
  };
  return map[key] || 'p-4';
}

/**
 * Convert spacing key ke Tailwind margin class
 */
export function spacingToMargin(key: SpacingKey): string {
  const map: Record<SpacingKey, string> = {
    xs: 'm-1',
    sm: 'm-2',
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
    '2xl': 'm-12',
    '3xl': 'm-16',
    '4xl': 'm-24',
  };
  return map[key] || 'm-4';
}

/**
 * Convert spacing key ke Tailwind gap class
 */
export function spacingToGap(key: SpacingKey): string {
  const map: Record<SpacingKey, string> = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    '2xl': 'gap-12',
    '3xl': 'gap-16',
    '4xl': 'gap-24',
  };
  return map[key] || 'gap-4';
}

