/**
 * Referral Program Page
 * Route: /[locale]/referral
 * Member-Get-Member referral program
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';

import { ReferralClient } from './referral-client';

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

  const title = 'Referral Program - Ajak Teman Dapat Bonus | Aero Travel';
  const description =
    'Ajak teman booking trip dan dapatkan bonus 10.000 poin. Teman Anda dapat diskon Rp 50.000 untuk booking pertama.';

  return {
    title,
    description,
    keywords: [
      'referral program',
      'ajak teman',
      'bonus referral',
      'diskon travel',
      'poin reward',
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/referral`,
      languages: {
        id: `${baseUrl}/id/referral`,
        en: `${baseUrl}/en/referral`,
        'x-default': `${baseUrl}/id/referral`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/referral`,
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

export default async function ReferralPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Referral Program</h1>
        <p className="text-sm text-muted-foreground">
          Ajak teman, dapat bonus bersama
        </p>
      </div>

      {/* Client Component */}
      <ReferralClient locale={locale} />
    </Container>
  );
}
