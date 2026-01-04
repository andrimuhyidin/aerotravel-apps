/**
 * Console Breadcrumb Navigation
 * Auto-generates breadcrumbs based on current path
 */

'use client';

import { usePathname } from 'next/navigation';

import { Breadcrumb } from '@/components/ui/breadcrumb';

type BreadcrumbItem = {
  label: string;
  href: string;
  isLast?: boolean;
};

type ConsoleBreadcrumbProps = {
  locale: string;
};

export function ConsoleBreadcrumb({ locale }: ConsoleBreadcrumbProps) {
  const pathname = usePathname();
  
  // Remove locale from pathname
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
  const segments = pathWithoutLocale.split('/').filter(Boolean);

  // Don't show breadcrumb for dashboard home
  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'console')) {
    return null;
  }

  // Build breadcrumb items for the Breadcrumb component
  const items: Array<{ label: string; href?: string }> = [
    {
      label: 'Dashboard',
      href: `/${locale}/console`,
    },
    ...segments.slice(1).map((segment, index) => {
      const isLast = index === segments.length - 2;
      const href = `/${locale}/${segments.slice(0, index + 2).join('/')}`;
      const label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return {
        label,
        href: isLast ? undefined : href,
      };
    }),
  ];

  return (
    <Breadcrumb
      items={items}
      showHome={false}
      className="mb-4"
    />
  );
}

