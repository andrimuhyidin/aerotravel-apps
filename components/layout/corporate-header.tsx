'use client';

/**
 * Corporate Header
 * Client component untuk corporate portal header dengan dynamic color
 */

import { Settings } from 'lucide-react';
import Link from 'next/link';

import { RoleSwitcher } from '@/components/role-switcher';
import { useAppSettings } from '@/hooks/use-settings';

type CorporateHeaderProps = {
  locale: string;
};

export function CorporateHeader({ locale }: CorporateHeaderProps) {
  const appSettings = useAppSettings('corporate');
  const headerColor = appSettings?.header_color || '#2563eb';

  return (
    <header
      className="sticky top-0 z-50 border-b text-white"
      style={{ backgroundColor: headerColor }}
    >
      <div className="flex h-14 items-center justify-between px-4">
        <Link
          href={`/${locale}/corporate/dashboard`}
          className="text-lg font-bold"
        >
          Corporate Portal
        </Link>
        <div className="flex items-center gap-2">
          {/* Role Switcher - Only show if user has multiple roles */}
          <RoleSwitcher
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
          />
          <Link href={`/${locale}/corporate/settings`}>
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

