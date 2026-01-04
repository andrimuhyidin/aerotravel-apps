/**
 * Guide Dashboard Home Page
 * Route: /[locale]/guide/home
 * Main dashboard untuk guide yang sudah login
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { fetchGuideDashboardData } from '@/lib/guide/server-data';
import { getCurrentUser } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import { GuideDashboardClient } from '../guide-dashboard-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Dashboard Guide',
  description: 'Dashboard untuk tour guide Aero Travel',
};

export default async function GuideDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect(`/${locale}/login`);
  }
  
  // Check if user has guide role
  const hasGuideRole = user.roles?.includes('guide') || false;
  const activeRole = user.activeRole;
  const profileRole = (user.profile as { role?: string } | null)?.role;
  const isGuide = activeRole === 'guide' || profileRole === 'guide';
  
  // Redirect to guide landing page if not a guide
  if (!isGuide && !hasGuideRole) {
    redirect(`/${locale}/guide`);
  }
  
  const userName = user.profile?.full_name || user.email?.split('@')[0] || 'Guide';
  
  // Prefetch dashboard data for faster initial render
  let initialData;
  try {
    initialData = await fetchGuideDashboardData(user.id);
    logger.info('GuideDashboardPage - Prefetched dashboard data', { userId: user.id });
  } catch (error) {
    logger.error('GuideDashboardPage - Failed to prefetch dashboard data', error, { userId: user.id });
    // Continue without initialData - client will fetch
  }
  
  return (
    <Container className="py-4">
      <GuideDashboardClient 
        userName={userName} 
        locale={locale} 
        initialData={initialData}
      />
    </Container>
  );
}

