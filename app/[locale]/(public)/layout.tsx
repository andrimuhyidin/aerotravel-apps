/**
 * Public Route Group Layout
 * Mobile-First PWA Wrapper (Instagram/Astro style)
 * Centered mobile container on desktop, full-width on mobile
 */

import { AppHeader } from '@/components/layout/app-header';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { getCurrentUser } from '@/lib/supabase/server';

type PublicLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PublicLayout({
  children,
  params,
}: PublicLayoutProps) {
  const { locale } = await params;
  
  // Get current user for header
  const user = await getCurrentUser();
  const profile = user?.profile as {
    full_name?: string;
    avatar_url?: string;
    role?: string;
  } | null;

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Mobile-First Container - Centered on desktop, full on mobile */}
      <div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-xl">
        {/* App Header - Sticky */}
        <AppHeader
          locale={locale}
          user={
            user
              ? {
                  name: profile?.full_name,
                  avatar: profile?.avatar_url,
                  role: profile?.role,
                }
              : null
          }
        />

        {/* Main Content - Native Scrolling */}
        <main className="min-h-screen pb-20">{children}</main>

        {/* Bottom Navigation - Fixed to container */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="mx-auto w-full max-w-md">
            <BottomNavigation locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
