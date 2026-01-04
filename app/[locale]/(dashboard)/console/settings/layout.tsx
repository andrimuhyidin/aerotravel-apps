/**
 * Settings Layout
 * Layout with sidebar navigation for settings pages
 */

import { setRequestLocale } from 'next-intl/server';
import { SettingsSidebar } from '@/components/admin/settings/settings-sidebar';
import { SettingsMobileNav } from './settings-mobile-nav';

type SettingsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function SettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      <SettingsSidebar locale={locale} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile Navigation */}
        <SettingsMobileNav locale={locale} />

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

