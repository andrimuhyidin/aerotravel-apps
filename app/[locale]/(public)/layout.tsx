/**
 * Public Route Group Layout
 * Mobile-First PWA Wrapper (Instagram/Astro style)
 * Centered mobile container on desktop, full-width on mobile
 * 
 * IMPORTANT: Public pages ALWAYS use mobile wrapper regardless of user role.
 * This is because public pages (packages, booking, etc.) are customer-facing
 * and should have consistent mobile experience for ALL users.
 */

import { ScrollDepthTracker } from '@/components/analytics/scroll-depth-tracker';
import { AppHeader } from '@/components/layout/app-header';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { AerobotWidget } from '@/components/public/aerobot-widget';
import { JsonLd } from '@/components/seo/json-ld';
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
} from '@/lib/seo/structured-data';
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
  
  // Show customer navigation only for customer role or unauthenticated users
  // Other roles can browse public pages but won't see customer-specific nav
  const showCustomerNav = !activeRole || activeRole === 'customer';

  return (
    <>
      {/* Global SEO Structured Data */}
      <JsonLd data={generateOrganizationSchema()} />
      <JsonLd data={generateWebsiteSchema()} />

      <div className="min-h-screen bg-gray-200">
        {/* Skip Link for Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-1/2 focus:-translate-x-1/2 focus:z-[100] focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:rounded-b-md"
        >
          Langsung ke konten utama
        </a>
      
      {/* Mobile-First Container - Centered on desktop, full on mobile */}
      <div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-xl">
        {/* App Header - Sticky */}
        <header role="banner">
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
        </header>

        {/* Main Content - Native Scrolling */}
        <main 
          id="main-content" 
          role="main" 
          className="min-h-screen pb-20"
          tabIndex={-1}
        >
          {children}
        </main>

        {/* AeroBot Widget - AI Chat Assistant */}
        <aside role="complementary" aria-label="AI Chat Assistant">
          <AerobotWidget />
        </aside>

        {/* Scroll Depth Tracker - Analytics */}
        <ScrollDepthTracker />

        {/* Bottom Navigation - Only show for customer role */}
        {showCustomerNav && (
          <nav 
            role="navigation" 
            aria-label="Navigasi utama"
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="mx-auto w-full max-w-md">
              <BottomNavigation locale={locale} />
            </div>
          </nav>
        )}
      </div>
    </div>
    </>
  );
}
