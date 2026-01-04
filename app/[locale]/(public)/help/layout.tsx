/**
 * Help Page Layout
 * Force mobile-first wrapper for all roles
 */

import { AppHeader } from '@/components/layout/app-header';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { getCurrentUser } from '@/lib/supabase/server';

type HelpLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function HelpLayout({
  children,
  params,
}: HelpLayoutProps) {
  const { locale } = await params;
  const user = await getCurrentUser();
  const profile = user?.profile as {
    full_name?: string;
    avatar_url?: string;
    role?: string;
  } | null;

  const activeRole = user?.activeRole || profile?.role;

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
                  role: activeRole || profile?.role,
                }
              : null
          }
        />

        {/* Main Content - Native Scrolling */}
        <main className="min-h-screen pb-20">{children}</main>

        {/* Bottom Navigation - Show for all roles */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="mx-auto w-full max-w-md">
            <BottomNavigation locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
