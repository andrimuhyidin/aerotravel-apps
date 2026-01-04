/**
 * Settings Sidebar Component
 * Navigation sidebar for settings pages with 6 main categories
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  DollarSign,
  FileText,
  Palette,
  Settings,
  Shield,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export type SettingsCategory = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
};

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Dashboard & quick actions',
    icon: Settings,
    href: '/console/settings',
  },
  {
    id: 'branding',
    label: 'Branding & Company',
    description: 'Logo, contact, social media',
    icon: Palette,
    href: '/console/settings/branding',
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Geofencing, validation, approvals',
    icon: Wrench,
    href: '/console/settings/operations',
  },
  {
    id: 'financial',
    label: 'Financial',
    description: 'Finance, loyalty, rewards',
    icon: DollarSign,
    href: '/console/settings/financial',
  },
  {
    id: 'technical',
    label: 'Technical',
    description: 'AI, Maps, Weather, Rate Limits',
    icon: Briefcase,
    href: '/console/settings/technical',
  },
  {
    id: 'content',
    label: 'Content',
    description: 'Templates, Legal, FAQs',
    icon: FileText,
    href: '/console/settings/content',
  },
  {
    id: 'security',
    label: 'Security & System',
    description: 'Feature flags, system config',
    icon: Shield,
    href: '/console/settings/security',
  },
];

type SettingsSidebarProps = {
  locale: string;
};

export function SettingsSidebar({ locale }: SettingsSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;
    if (href === '/console/settings') {
      return pathname === fullPath;
    }
    return pathname.startsWith(fullPath);
  };

  return (
    <aside className="hidden lg:block w-64 border-r bg-muted/30 shrink-0">
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="p-4 space-y-1">
          {SETTINGS_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const active = isActive(category.href);

            return (
              <Link
                key={category.id}
                href={`/${locale}${category.href}`}
                className={cn(
                  'flex items-start gap-3 rounded-lg p-3 transition-all',
                  'hover:bg-muted/80',
                  active && 'bg-primary/10 text-primary border-l-2 border-primary'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 mt-0.5 shrink-0',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium truncate',
                      active && 'text-primary'
                    )}
                  >
                    {category.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {category.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}

