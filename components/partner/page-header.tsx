/**
 * Page Header Component
 * Standardized page header untuk Partner Portal
 */

'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  /** URL to navigate back to */
  backLink?: string;
  /** Alias for backLink (for backward compatibility) */
  backHref?: string;
};

export function PageHeader({
  title,
  description,
  action,
  className,
  children,
  backLink,
  backHref,
}: PageHeaderProps) {
  const backUrl = backLink || backHref;

  return (
    <div className={cn('space-y-4 px-4 py-6', className)}>
      {backUrl && (
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}
