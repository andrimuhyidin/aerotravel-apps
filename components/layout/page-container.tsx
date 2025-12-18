/**
 * Page Container - Standard wrapper untuk semua pages
 * Ensures consistent padding, spacing, and max-width
 */

import { cn } from '@/lib/utils';

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  noPadding?: boolean;
  variant?: 'default' | 'centered' | 'full';
};

const maxWidthClasses = {
  sm: 'max-w-screen-sm', // 640px
  md: 'max-w-screen-md', // 768px
  lg: 'max-w-screen-lg', // 1024px
  xl: 'max-w-screen-xl', // 1280px
  full: 'max-w-full',
};

export function PageContainer({
  children,
  className,
  maxWidth = 'lg',
  noPadding = false,
  variant = 'default',
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        !noPadding && 'px-4 py-4',
        variant === 'centered' && 'flex min-h-[60vh] items-center justify-center',
        variant === 'full' && 'min-h-screen',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Section - For organizing content within a page
 */
type SectionProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
};

export function Section({
  children,
  className,
  title,
  subtitle,
  action,
  noPadding = false,
}: SectionProps) {
  return (
    <section className={cn(!noPadding && 'py-6', className)}>
      {(title || subtitle || action) && (
        <div className="mb-4 flex items-start justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
