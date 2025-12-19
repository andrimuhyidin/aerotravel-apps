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
  
  // Get active role to determine navigation
  const activeRole = user?.activeRole || profile?.role;
  
  // Don't show customer navigation for non-customer roles
  // Guide, partner, corporate, and internal staff should use their own layouts
  // Note: Guide pages will use GuideShell which has its own navigation and layout
  // Partner and Corporate use PortalLayout which has its own navigation
  const showCustomerNav = !activeRole || activeRole === 'customer';
  
  // Skip PublicLayout wrapper for roles that have their own complete layouts
  // to avoid double wrapper
  if (activeRole === 'guide') {
    // Guide uses GuideShell with its own layout
    return <>{children}</>;
  }
  
  if (activeRole === 'mitra' || activeRole === 'nta') {
    // Partner uses PortalLayout with its own navigation
    return <>{children}</>;
  }
  
  if (activeRole === 'corporate') {
    // Corporate uses PortalLayout (corporate) with its own navigation
    return <>{children}</>;
  }
  
  // Internal staff (console) uses DashboardLayout with its own navigation
  const internalRoles = [
    'super_admin',
    'owner',
    'manager',
    'admin',
    'finance',
    'cs',
    'ops_admin',
    'finance_manager',
    'marketing',
    'investor',
  ];
  if (activeRole && internalRoles.includes(activeRole)) {
    return <>{children}</>;
  }

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

        {/* Bottom Navigation - Only show for customer role */}
        {showCustomerNav && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto w-full max-w-md">
              <BottomNavigation locale={locale} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
