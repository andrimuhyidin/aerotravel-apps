/**
 * Corporate Layout
 * Layout khusus untuk corporate portal dengan navigation
 */

import { Building2, FileText, Menu, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { RoleSwitcher } from '@/components/role-switcher';

type CorporateLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function CorporateLayout({
  children,
  params,
}: CorporateLayoutProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Mobile-First Container - Consistent with other portals */}
      <div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-xl">
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b bg-blue-600 text-white">
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

          {/* Content */}
          <main className="flex-1 pb-20">{children}</main>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
            <div className="mx-auto w-full max-w-md">
              <div className="flex h-16 items-center justify-around">
                <Link
                  href={`/${locale}/corporate/dashboard`}
                  className="flex flex-col items-center gap-1 p-2 text-xs"
                >
                  <Building2 className="h-5 w-5" />
                  <span>Home</span>
                </Link>
                <Link
                  href={`/${locale}/corporate/employees`}
                  className="flex flex-col items-center gap-1 p-2 text-xs"
                >
                  <Users className="h-5 w-5" />
                  <span>Employees</span>
                </Link>
                <Link
                  href={`/${locale}/corporate/invoices`}
                  className="flex flex-col items-center gap-1 p-2 text-xs"
                >
                  <FileText className="h-5 w-5" />
                  <span>Invoices</span>
                </Link>
                <Link
                  href={`/${locale}/corporate/menu`}
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
    </div>
  );
}
