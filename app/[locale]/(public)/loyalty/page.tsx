/**
 * Loyalty Program Page
 * Route: /[locale]/loyalty
 * AeroPoints dashboard for customers
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';

import { LoyaltyDashboardClient } from './loyalty-dashboard-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  const title = 'AeroPoints - Program Loyalitas | Aero Travel';
  const description =
    'Kumpulkan poin dari setiap booking dan tukarkan dengan diskon. 1 Poin = Rp 1. Dapatkan bonus poin dari referral dan review.';

  return {
    title,
    description,
    keywords: [
      'aeropoints',
      'loyalty program',
      'program loyalitas',
      'poin reward',
      'diskon travel',
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/loyalty`,
      languages: {
        id: `${baseUrl}/id/loyalty`,
        en: `${baseUrl}/en/loyalty`,
        'x-default': `${baseUrl}/id/loyalty`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/loyalty`,
      siteName: 'MyAeroTravel ID',
      images: [{ url: `${baseUrl}/og-image.jpg`, width: 1200, height: 630 }],
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.jpg`],
    },
  };
}

export default async function LoyaltyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">AeroPoints</h1>
        <p className="text-sm text-muted-foreground">
          Program loyalitas untuk traveler setia
        </p>
      </div>

      {/* Dashboard */}
      <LoyaltyDashboardClient locale={locale} />
    </Container>
  );
}
