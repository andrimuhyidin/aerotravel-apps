/**
 * Responsive Design Utilities
 * Helper functions for responsive design patterns
 */

/**
 * Get responsive class names based on breakpoint
 */
export function responsive(
  base: string,
  sm?: string,
  md?: string,
  lg?: string,
  xl?: string
): string {
  const classes = [base];
  if (sm) classes.push(`sm:${sm}`);
  if (md) classes.push(`md:${md}`);
  if (lg) classes.push(`lg:${lg}`);
  if (xl) classes.push(`xl:${xl}`);
  return classes.join(' ');
}

/**
 * Container width utilities
 */
export const container = {
  full: 'w-full',
  sm: 'max-w-screen-sm mx-auto',
  md: 'max-w-screen-md mx-auto',
  lg: 'max-w-screen-lg mx-auto',
  xl: 'max-w-screen-xl mx-auto',
  '2xl': 'max-w-screen-2xl mx-auto',
  custom: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
} as const;

/**
 * Grid column utilities
 */
export const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
} as const;

/**
 * Spacing utilities
 */
export const spacing = {
  section: 'py-12 md:py-16 lg:py-20',
  container: 'px-4 sm:px-6 lg:px-8',
  card: 'p-4 sm:p-6',
} as const;

