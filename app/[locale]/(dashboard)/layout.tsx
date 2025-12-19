/**
 * Dashboard Route Group Layout
 * Internal Admin Console - Full-Width Sidebar Layout (Desktop-First)
 */

import {
    Brain,
    Calendar,
    CreditCard,
    FileText,
    Home,
    Package,
    Settings,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { RoleSwitcher } from '@/components/role-switcher';

const sidebarItems = [
  { href: '/id/console', label: 'Dashboard', icon: Home },
  { href: '/id/console/bookings', label: 'Bookings', icon: Calendar },
  { href: '/id/console/products', label: 'Products', icon: Package },
  { href: '/id/console/finance', label: 'Finance', icon: CreditCard },
  { href: '/id/console/users', label: 'Users', icon: Users },
  { href: '/id/console/ai-documents', label: 'AI Documents', icon: Brain },
  { href: '/id/console/reports', label: 'Reports', icon: FileText },
  { href: '/id/console/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 flex-col border-r bg-background lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-xl font-bold text-primary">AeroConsole</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold lg:hidden">AeroConsole</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Role Switcher - Only show if user has multiple roles (internal roles cannot switch) */}
            <RoleSwitcher size="sm" variant="outline" />
            <span className="text-sm text-muted-foreground">Admin</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
        <div className="flex h-16 items-center justify-around">
          <Link
            href="/id/console"
            className="flex flex-col items-center gap-1 p-2 text-xs"
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/id/console/bookings"
            className="flex flex-col items-center gap-1 p-2 text-xs"
          >
            <Calendar className="h-5 w-5" />
            <span>Bookings</span>
          </Link>
          <Link
            href="/id/console/users"
            className="flex flex-col items-center gap-1 p-2 text-xs"
          >
            <Users className="h-5 w-5" />
            <span>Users</span>
          </Link>
          <Link
            href="/id/console/settings"
            className="flex flex-col items-center gap-1 p-2 text-xs"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
