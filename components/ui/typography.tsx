/**
 * Typography Components
 * Utility components untuk consistent typography
 */

import { cn } from '@/lib/utils';
import type { FontSizeKey, FontWeightKey } from '@/lib/design/typography-utils';

export type TypographyProps = {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
};

export type HeadingProps = TypographyProps & {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: FontWeightKey;
};

export type TextProps = TypographyProps & {
  size?: FontSizeKey;
  weight?: FontWeightKey;
  color?: 'default' | 'muted' | 'primary' | 'destructive' | 'success' | 'warning';
};

/**
 * Heading Component
 */
export function Heading({
  children,
  size = 'lg',
  weight = 'bold',
  className,
  as,
}: HeadingProps) {
  const Component = as || 'h2';
  const sizeClasses: Record<HeadingProps['size'], string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  };

  const weightClasses: Record<FontWeightKey, string> = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  return (
    <Component
      className={cn(
        sizeClasses[size],
        weightClasses[weight],
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Text Component
 */
export function Text({
  children,
  size = 'base',
  weight = 'normal',
  color = 'default',
  className,
  as,
}: TextProps) {
  const Component = as || 'p';
  const sizeClasses: Record<FontSizeKey, string> = {
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

  const weightClasses: Record<FontWeightKey, string> = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const colorClasses: Record<TextProps['color'], string> = {
    default: 'text-foreground',
    muted: 'text-foreground/70',
    primary: 'text-primary',
    destructive: 'text-destructive',
    success: 'text-success',
    warning: 'text-warning',
  };

  return (
    <Component
      className={cn(
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Label Component
 */
export function Label({
  children,
  className,
  as,
}: TypographyProps) {
  const Component = as || 'label';
  return (
    <Component
      className={cn(
        'text-sm font-medium',
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Caption Component
 */
export function Caption({
  children,
  className,
  as,
}: TypographyProps) {
  const Component = as || 'span';
  return (
    <Component
      className={cn(
        'text-xs text-foreground/70',
        className
      )}
    >
      {children}
    </Component>
  );
}

