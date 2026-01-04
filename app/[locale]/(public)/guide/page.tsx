/**
 * Guide Landing Page
 * Route: /[locale]/guide
 * Public landing page for guide recruitment
 * 
 * NOTE: If user is a guide, they are redirected to /(mobile)/guide 
 * which has proper GuideShell layout without public header
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
  
  // If user is a guide, redirect to the guide dashboard in (mobile) route group
  // This avoids double header issue (public layout header + guide header)
  const isGuide = activeRole === 'guide' || profileRole === 'guide';
  
  if (isGuide && hasGuideRole) {
    // Guide users are already in the right place
    // This page will NOT be rendered due to proxy.ts routing rules
    // But as a fallback, we just show the landing with guide info
    // The proxy.ts will handle redirecting /guide paths to (mobile)/guide for guides
  }

  // Show landing page for non-guides
  return <GuideLandingContent locale={locale} hasGuideRole={hasGuideRole} />;
}

