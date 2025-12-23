/**
 * Partner Portal Layout
 * Layout for B2B partner portal with mobile-first wrapper
 * Features: Partner branding, navigation, wallet balance display
 */

import { BarChart, FileText, Home, Menu, Settings, Wallet } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { RoleSwitcher } from '@/components/role-switcher';

type PartnerLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PartnerLayout({
  children,
  params,
}: PartnerLayoutProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Mobile-First Container */}
      <div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-xl">
        {/* Header - Sticky */}
        <header className="sticky top-0 z-50 border-b bg-orange-600 text-white">
          <div className="flex h-14 items-center justify-between px-4">
            <Link
              href={`/${locale}/partner/dashboard`}
              className="text-lg font-bold"
            >
              Partner Portal
            </Link>
            <div className="flex items-center gap-2">
              <RoleSwitcher
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              />
              <Link href={`/${locale}/partner/settings`}>
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="min-h-screen pb-20">{children}</main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
          <div className="mx-auto w-full max-w-md">
            <div className="flex h-16 items-center justify-around">
              <Link
                href={`/${locale}/partner/dashboard`}
                className="flex flex-col items-center gap-1 p-2 text-xs"
              >
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href={`/${locale}/partner/bookings`}
                className="flex flex-col items-center gap-1 p-2 text-xs"
              >
                <BarChart className="h-5 w-5" />
                <span>Bookings</span>
              </Link>
              <Link
                href={`/${locale}/partner/wallet`}
                className="flex flex-col items-center gap-1 p-2 text-xs"
              >
                <Wallet className="h-5 w-5" />
                <span>Wallet</span>
              </Link>
              <Link
                href={`/${locale}/partner/invoices`}
                className="flex flex-col items-center gap-1 p-2 text-xs"
              >
                <FileText className="h-5 w-5" />
                <span>Invoices</span>
              </Link>
              <Link
                href={`/${locale}/partner/menu`}
                className="flex flex-col items-center gap-1 p-2 text-xs"
              >
                <Menu className="h-5 w-5" />
                <span>Menu</span>
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
