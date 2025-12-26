/**
 * Data Card Component
 * Standardized card untuk displaying data dengan consistent styling
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';

export type DataCardProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  variant?: 'default' | 'outlined' | 'elevated';
  hover?: boolean;
};

export function DataCard({
  title,
  description,
  children,
  className,
  headerClassName,
  contentClassName,
  variant = 'default',
  hover = false,
}: DataCardProps) {
  return (
    <Card
      className={cn(
        'transition-all-base',
        variant === 'outlined' && 'border-2',
        variant === 'elevated' && 'shadow-md',
        hover && 'hover-elevate-md cursor-pointer',
        className
      )}
    >
      {(title || description) && (
        <CardHeader className={cn('p-4 md:p-6', headerClassName)}>
          {title && (
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          )}
          {description && (
            <p className="text-sm text-foreground/70 mt-1">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent className={cn('p-4 md:p-6', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

