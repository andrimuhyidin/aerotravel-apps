/**
 * Section Component
 * Consistent section spacing
 */

import { cn } from '@/lib/utils';

export type SectionProps = {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  id?: string;
};

export function Section({
  children,
  className,
  spacing = 'md',
  id,
}: SectionProps) {
  const spacingClasses = {
    sm: 'py-8 md:py-12',
    md: 'py-12 md:py-16 lg:py-20',
    lg: 'py-16 md:py-20 lg:py-24',
    xl: 'py-20 md:py-24 lg:py-32',
  };

  return (
    <section id={id} className={cn(spacingClasses[spacing], className)}>
      {children}
    </section>
  );
}

