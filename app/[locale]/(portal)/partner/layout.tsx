/**
 * Partner Portal Layout
 * Mobile-First PWA Wrapper (Native Mobile Apps Style)
 * Consistent with Guide Apps and Public Apps structure
 */

import React from 'react';

import { SkipLink, LiveRegion } from '@/components/accessibility';
import { PartnerErrorBoundary } from '@/components/partner/partner-error-boundary';
import { PartnerBottomNavigation } from '@/components/partner/partner-bottom-navigation';
import { PartnerHeader } from '@/components/partner/partner-header';
import { PushNotificationInit } from '@/components/partner/push-notification-init';
import { FloatingActionButton } from '@/components/partner/floating-action-button';
import { AiChatWidget } from '@/components/partner/ai-chat-widget';
import { getCurrentUser } from '@/lib/supabase/server';

type PartnerLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PartnerLayout({
  children,
  params,
}: PartnerLayoutProps) {
  const { locale } = await params;
  const user = await getCurrentUser();
  const profile = user?.profile as {
    full_name?: string;
    avatar_url?: string;
  } | null;

  return (
    <PartnerErrorBoundary>
      <SkipLink href="#main-content" />
      <LiveRegion id="partner-live-region" message="" />
      <div className="min-h-screen bg-muted/30">
        {/* Mobile-First Container - Centered on desktop, full on mobile */}
        <div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-xl">
          {/* App Header - Sticky */}
          <PartnerHeader
            user={
              user
                ? {
                    name: profile?.full_name || user.email?.split('@')[0],
                    avatar: profile?.avatar_url ?? undefined,
                  }
                : null
            }
          />

          {/* Main Content - Native Scrolling */}
          <main id="main-content" className="min-h-screen pb-20" tabIndex={-1}>
            {children}
          </main>

          {/* Push Notification Init */}
          <PushNotificationInit />

          {/* Floating Action Button */}
          <FloatingActionButton />

          {/* AI Chat Widget */}
          <AiChatWidget />

          {/* Bottom Navigation - Fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto w-full max-w-md">
              <PartnerBottomNavigation locale={locale} />
            </div>
          </div>
        </div>
      </div>
    </PartnerErrorBoundary>
  );
}
