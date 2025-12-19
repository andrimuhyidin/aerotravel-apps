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
  const hasMitraRole = user?.roles?.includes('mitra') || false;
  const activeRole = user?.activeRole;

  return <PartnerLandingContent locale={locale} hasMitraRole={hasMitraRole} />;
}

