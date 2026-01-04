/**
 * Dashboard Route Group Layout
 * Internal Admin Console - Full-Width Sidebar Layout (Desktop-First)
 */

import { setRequestLocale } from 'next-intl/server';
import React, { Suspense } from 'react';

import {
  ConsoleSidebar,
  ConsoleSidebarMobile,
} from '@/components/console/console-sidebar';
import { HeaderActions } from '@/components/console/header-actions';
import { ModuleGroupSwitcher } from '@/components/console/module-group-switcher';
import { getCurrentUser } from '@/lib/supabase/server';

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Get current user data for sidebar
  const user = await getCurrentUser();
  const userRole = user?.activeRole || null;
  const userName = user?.profile?.full_name || user?.email || 'Admin';
  const userEmail = user?.email || undefined;
  const userAvatar = user?.profile?.avatar_url || null;

  return (
    <div className="flex min-h-screen fm-gradient-bg">
      {/* Desktop Sidebar - Glassmorphism */}
      <Suspense fallback={<div className="hidden w-64 lg:block" />}>
        <ConsoleSidebar
          locale={locale}
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
        />
      </Suspense>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Header - Glassmorphism */}
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between glass-header px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <Suspense fallback={<div className="lg:hidden" />}>
              <ConsoleSidebarMobile
                locale={locale}
                userRole={userRole}
                userName={userName}
                userEmail={userEmail}
                userAvatar={userAvatar}
              />
            </Suspense>
            {/* Module Group Switcher */}
            <Suspense fallback={null}>
              <ModuleGroupSwitcher
                locale={locale}
                userRole={userRole}
                size="sm"
                variant="outline"
              />
            </Suspense>
          </div>
          <HeaderActions locale={locale} userRole={userRole} />
        </header>

        {/* Page Content - Breathable spacing */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
