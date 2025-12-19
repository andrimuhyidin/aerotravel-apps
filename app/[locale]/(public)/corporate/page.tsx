/**
 * Corporate Landing Page
 * Route: /[locale]/corporate
 * Public landing page for corporate travel program
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { CorporateLandingContent } from './corporate-landing-content';

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
    title: 'Program Corporate Travel - Aero Travel',
    description:
      'Kelola perjalanan bisnis karyawan dengan mudah dan efisien. Program corporate travel untuk perusahaan dengan sistem terintegrasi dan invoice otomatis.',
    keywords: [
      'corporate travel',
      'business travel',
      'perjalanan bisnis',
      'travel perusahaan',
      'B2B travel',
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/corporate`,
    },
    openGraph: {
      title: 'Program Corporate Travel - Aero Travel',
      description:
        'Kelola perjalanan bisnis karyawan dengan mudah dan efisien',
      url: `${baseUrl}/${locale}/corporate`,
      type: 'website',
    },
  };
}

export default async function CorporateLandingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  const hasCorporateRole = user?.roles?.includes('corporate') || false;
  const activeRole = user?.activeRole;

  // Debug logging
  const { logger } = await import('@/lib/utils/logger');
  logger.info('CorporateLandingPage - Role detection', {
    userId: user?.id,
    hasCorporateRole,
    activeRole,
    profileRole: (user?.profile as { role?: string } | null)?.role,
    allRoles: user?.roles,
  });

  // If user has corporate role and it's active, redirect to corporate dashboard
  const profileRole = (user?.profile as { role?: string } | null)?.role;
  const isCorporate = activeRole === 'corporate' || profileRole === 'corporate';
  
  if (isCorporate && hasCorporateRole) {
    logger.info('CorporateLandingPage - Redirecting corporate to /corporate/employees', { userId: user?.id });
    const { redirect } = await import('next/navigation');
    redirect(`/${locale}/corporate/employees`);
  }

  return (
    <CorporateLandingContent
      locale={locale}
      hasCorporateRole={hasCorporateRole}
    />
  );
}

