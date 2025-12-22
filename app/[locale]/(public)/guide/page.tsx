/**
 * Guide Landing Page
 * Route: /[locale]/guide
 * Public landing page for guide recruitment
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { GuideLandingContent } from './guide-landing-content';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Jadilah Guide Profesional - Aero Travel',
    description:
      'Bergabunglah sebagai tour guide profesional di Aero Travel. Dapatkan penghasilan fleksibel, jadwal yang sesuai kebutuhan, dan dukungan teknologi terbaik.',
    keywords: [
      'guide travel',
      'tour guide',
      'kerja guide',
      'lowongan guide',
      'karir guide',
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/guide`,
    },
    openGraph: {
      title: 'Jadilah Guide Profesional - Aero Travel',
      description:
        'Bergabunglah sebagai tour guide profesional dan dapatkan penghasilan fleksibel',
      url: `${baseUrl}/${locale}/guide`,
      type: 'website',
    },
  };
}

export default async function GuideLandingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  const hasGuideRole = user?.roles?.includes('guide') || false;
  const activeRole = user?.activeRole;
  const profileRole = (user?.profile as { role?: string } | null)?.role;
  
  // Debug logging
  const { logger } = await import('@/lib/utils/logger');
  logger.info('GuideLandingPage - Role detection', {
    userId: user?.id,
    hasGuideRole,
    activeRole,
    profileRole,
    allRoles: user?.roles,
  });

  // If user has guide role and it's active, show dashboard with GuideShell (has navigation)
  // Also check profile.role as fallback
  const isGuide = activeRole === 'guide' || profileRole === 'guide';
  
  if (isGuide && hasGuideRole) {
    logger.info('GuideLandingPage - Showing guide dashboard with GuideShell', { userId: user?.id });
    const { GuideDashboardClient } = await import('@/app/[locale]/(mobile)/guide/guide-dashboard-client');
    const { GuideShell } = await import('@/components/layout/guide-shell');
    const { Container } = await import('@/components/layout/container');
    const { fetchGuideDashboardData } = await import('@/lib/guide/server-data');
    const userName = user?.profile?.full_name || user?.email?.split('@')[0] || 'Guide';
    
    // Prefetch critical dashboard data di server untuk faster initial render
    let initialData;
    try {
      if (user?.id) {
        initialData = await fetchGuideDashboardData(user.id);
        logger.info('GuideLandingPage - Prefetched dashboard data', { userId: user.id });
      }
    } catch (error) {
      logger.error('GuideLandingPage - Failed to prefetch dashboard data', error, { userId: user?.id });
      // Continue without initialData - client will fetch
    }
    
    // Use GuideShell which has its own layout with guide navigation
    // This will replace the PublicLayout wrapper
    return (
      <GuideShell
        locale={locale}
        user={{
          name: userName,
          avatar: user?.profile?.avatar_url ?? undefined,
        }}
      >
        <Container className="py-4">
          <GuideDashboardClient 
            userName={userName} 
            locale={locale} 
            initialData={initialData}
          />
        </Container>
      </GuideShell>
    );
  }

  logger.info('GuideLandingPage - Showing landing page', { 
    userId: user?.id, 
    isGuide, 
    hasGuideRole,
    activeRole,
    profileRole,
  });
  return <GuideLandingContent locale={locale} hasGuideRole={hasGuideRole} />;
}

