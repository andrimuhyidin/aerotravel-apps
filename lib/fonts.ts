/**
 * Font Configuration
 * Centralized font setup using Next.js Font Optimization
 * Prevents Layout Shift (CLS) and optimizes font loading
 */

import { Inter, Roboto_Mono } from 'next/font/google';

/**
 * Primary sans-serif font
 * Optimized by Next.js (self-hosted, no external requests)
 */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

/**
 * Monospace font for code
 * Optimized by Next.js
 */
export const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  fallback: ['Fira Code', 'Courier New', 'monospace'],
});

/**
 * Font class names for Tailwind
 */
export const fontVariables = `${inter.variable} ${robotoMono.variable}`;

/**
 * Usage in layout.tsx:
 * 
 * import { fontVariables } from '@/lib/fonts';
 * 
 * <html lang="id" className={fontVariables}>
 *   ...
 * </html>
 */

