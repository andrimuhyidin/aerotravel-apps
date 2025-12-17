/**
 * Auth Route Group Layout
 * Clean, centered layout for login/register pages
 * Mobile-First PWA Wrapper
 */

import { ChevronLeft, Plane } from 'lucide-react';
import Link from 'next/link';

type AuthLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AuthLayout({
  children,
  params,
}: AuthLayoutProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Mobile-First Container */}
      <div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-xl">
        <div className="flex min-h-screen flex-col">
          {/* Header with Back */}
          <header className="sticky top-0 z-50 bg-background">
            <div className="flex h-14 items-center justify-between px-4">
              <Link
                href={`/${locale}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
                  <Plane className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold">AeroTravel</span>
              </div>
              <div className="w-10" /> {/* Spacer for center alignment */}
            </div>
          </header>

          {/* Content */}
          <main className="flex flex-1 flex-col justify-center px-6 py-8">
            {children}
          </main>

          {/* Bottom Safe Area */}
          <div className="p-4 text-center text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Aero Travel. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
