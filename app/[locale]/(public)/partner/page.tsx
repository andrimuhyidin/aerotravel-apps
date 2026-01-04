/**
 * Partner Landing Page
 * Route: /[locale]/partner
 * Public landing page for B2B partner recruitment
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { PartnerLandingContent } from './partner-landing-content';

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
    title: 'Program Mitra B2B - Aero Travel',
    description:
      'Bergabunglah sebagai mitra B2B Aero Travel. Dapatkan komisi menarik, akses ke sistem booking terintegrasi, dan dukungan penuh untuk bisnis travel Anda.',
    keywords: [
      'mitra travel',
      'agen travel',
      'reseller travel',
      'B2B travel',
      'komisi travel',
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/partner`,
    },
    openGraph: {
      title: 'Program Mitra B2B - Aero Travel',
      description:
        'Dapatkan komisi menarik dengan menjadi mitra B2B Aero Travel',
      url: `${baseUrl}/${locale}/partner`,
      type: 'website',
    },
  };
}

export default async function PartnerLandingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  // Note: 'nta' is alias for 'mitra' (Net Travel Agent), handle as string comparison
  const hasMitraRole = user?.roles?.includes('mitra') || (user?.roles as string[])?.includes('nta') || false;
  const activeRole = user?.activeRole;
  const profileRole = (user?.profile as { role?: string } | null)?.role;
  
  // Debug logging
  const { logger } = await import('@/lib/utils/logger');
  logger.info('PartnerLandingPage - Role detection', {
    userId: user?.id,
    hasMitraRole,
    activeRole,
    profileRole,
    allRoles: user?.roles,
  });

  // If user has mitra/nta role and it's active, redirect to dashboard
  // Note: 'nta' is treated as 'mitra' (same portal access)
  const isMitra = activeRole === 'mitra' || 
    (activeRole as string) === 'nta' || 
    profileRole === 'mitra' || 
    (profileRole as string) === 'nta';
  
  if (isMitra && hasMitraRole) {
    logger.info('PartnerLandingPage - Redirecting partner to /partner/dashboard', { userId: user?.id });
    const { redirect } = await import('next/navigation');
    redirect(`/${locale}/partner/dashboard`);
  }

  logger.info('PartnerLandingPage - Showing landing page', { 
    userId: user?.id, 
    isMitra, 
    hasMitraRole,
    activeRole,
    profileRole,
  });
  return <PartnerLandingContent locale={locale} hasMitraRole={hasMitraRole} />;
}

