/**
 * Spacing Components
 * Utility components untuk consistent spacing
 */

import { cn } from '@/lib/utils';
import type { SpacingKey } from '@/lib/design/spacing-utils';

export type SpacingProps = {
  children?: React.ReactNode;
  size?: SpacingKey;
  className?: string;
};

/**
 * Vertical Spacing Component
 */
export function VStack({ children, size = 'md', className }: SpacingProps) {
  const sizeClasses: Record<SpacingKey, string> = {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
    '2xl': 'space-y-12',
    '3xl': 'space-y-16',
    '4xl': 'space-y-24',
  };

  return (
    <div className={cn(sizeClasses[size], className)}>
      {children}
    </div>
  );
}

/**
 * Horizontal Spacing Component
 */
export function HStack({ children, size = 'md', className }: SpacingProps) {
  const sizeClasses: Record<SpacingKey, string> = {
    xs: 'space-x-1',
    sm: 'space-x-2',
    md: 'space-x-4',
    lg: 'space-x-6',
    xl: 'space-x-8',
    '2xl': 'space-x-12',
    '3xl': 'space-x-16',
    '4xl': 'space-x-24',
  };

  return (
    <div className={cn('flex items-center', sizeClasses[size], className)}>
      {children}
    </div>
  );
}

/**
 * Padding Component
 */
export function Padding({ children, size = 'md', className }: SpacingProps) {
  const sizeClasses: Record<SpacingKey, string> = {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
    '2xl': 'p-12',
    '3xl': 'p-16',
    '4xl': 'p-24',
  };

  return (
    <div className={cn(sizeClasses[size], className)}>
      {children}
    </div>
  );
}

/**
 * Margin Component
 */
export function Margin({ children, size = 'md', className }: SpacingProps) {
  const sizeClasses: Record<SpacingKey, string> = {
    xs: 'm-1',
    sm: 'm-2',
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
    '2xl': 'm-12',
    '3xl': 'm-16',
    '4xl': 'm-24',
  };

  return (
    <div className={cn(sizeClasses[size], className)}>
      {children}
    </div>
  );
}

