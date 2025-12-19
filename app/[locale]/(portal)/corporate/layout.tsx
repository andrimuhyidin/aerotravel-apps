/**
 * Corporate Layout
 * Layout khusus untuk corporate portal dengan navigation
 */

import { Building2, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { RoleSwitcher } from '@/components/role-switcher';

export default function CorporateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hybrid Container - wider than mobile, narrower than full */}
      <div className="relative mx-auto min-h-screen w-full max-w-lg bg-background shadow-lg lg:max-w-2xl">
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b bg-blue-600 text-white">
            <div className="flex h-14 items-center justify-between px-4">
              <span className="text-lg font-bold">Corporate Portal</span>
              <div className="flex items-center gap-2">
                {/* Role Switcher - Only show if user has multiple roles */}
                <RoleSwitcher size="sm" variant="ghost" className="text-white hover:bg-white/20" />
                <Link href="/id/corporate/employees">
                  <Users className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 pb-20 lg:pb-4">{children}</main>

          {/* Bottom Navigation - Mobile Only */}
          <nav className="absolute bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
            <div className="flex h-16 items-center justify-around">
              <Link
                href="/id/corporate/employees"
                className="flex flex-col items-center gap-1 p-2 text-xs"
              >
                <Users className="h-5 w-5" />
                <span>Employees</span>
              </Link>
              <Link
                href="/id/corporate/invoices"
                className="flex flex-col items-center gap-1 p-2 text-xs"
              >
                <FileText className="h-5 w-5" />
                <span>Invoices</span>
              </Link>
              <Link
                href="/id/corporate"
                className="flex flex-col items-center gap-1 p-2 text-xs"
              >
                <Building2 className="h-5 w-5" />
                <span>Home</span>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

