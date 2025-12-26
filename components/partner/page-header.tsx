/**
 * Page Header Component
 * Standardized page header untuk Partner Portal
 */

import { cn } from '@/lib/utils';

export type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  action,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4 px-4 py-6', className)}>
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
