/**
 * Mobile Route Group Layout
 * Field Guide PWA - Mobile-First Wrapper
 */

import { AlertTriangle, Calendar, Home, MapPin } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-200">
      {/* Mobile-First Container */}
      <div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-xl">
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b bg-green-600 text-white">
            <div className="flex h-14 items-center justify-between px-4">
              <span className="text-lg font-bold">Guide App</span>
              <Link
                href="/id/guide/sos"
                className="rounded-full bg-red-500 p-2"
              >
                <AlertTriangle className="h-4 w-4" />
              </Link>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 pb-20">{children}</main>

          {/* Bottom Navigation */}
          <nav className="absolute bottom-0 left-0 right-0 z-50 border-t bg-background">
            <div className="flex h-16 items-center justify-around">
              <Link
                href="/id/guide"
                className="flex flex-col items-center gap-1 p-2 text-xs"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
              <Link
                href="/id/guide/trips"
                className="flex flex-col items-center gap-1 p-2 text-xs"
              >
                <Calendar className="h-5 w-5" />
                <span>Trips</span>
              </Link>
              <Link
                href="/id/guide/attendance"
                className="flex flex-col items-center gap-1 p-2 text-xs"
              >
                <MapPin className="h-5 w-5" />
                <span>Absensi</span>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
