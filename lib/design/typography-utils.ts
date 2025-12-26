/**
 * Typography Utilities
 * Helper functions untuk consistent typography
 */

import { designTokens } from './tokens';

export type FontSizeKey = keyof typeof designTokens.typography.fontSize;
export type FontWeightKey = keyof typeof designTokens.typography.fontWeight;

/**
 * Get font size dengan line height
 */
export function getFontSize(key: FontSizeKey): {
  fontSize: string;
  lineHeight: string;
} {
  const [fontSize, { lineHeight }] = designTokens.typography.fontSize[key];
  return { fontSize, lineHeight };
}

/**
 * Get font weight
 */
export function getFontWeight(key: FontWeightKey): string {
  return designTokens.typography.fontWeight[key];
}

/**
 * Convert font size key ke Tailwind class
 */
export function fontSizeToTailwind(key: FontSizeKey): string {
  const map: Record<FontSizeKey, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
  };
  return map[key] || 'text-base';
}

/**
 * Convert font weight key ke Tailwind class
 */
export function fontWeightToTailwind(key: FontWeightKey): string {
  const map: Record<FontWeightKey, string> = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };
  return map[key] || 'font-normal';
}

