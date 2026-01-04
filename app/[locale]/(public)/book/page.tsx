/**
 * Booking Wizard - Customer Booking Flow
 * PRD 2.8.A - Customer, CSR for fast interaction
 * PRD 4.3.A - Smart Booking Wizard & Tax Logic
 * 
 * Route: /[locale]/book
 * Access: Public (Customer)
 */

import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { BookingWizardClient } from './booking-wizard-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('booking');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  const title = `${t('title')} - Aero Travel`;
  const description = 'Book your travel package with our easy booking wizard.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/book`,
      languages: {
        id: `${baseUrl}/id/book`,
        en: `${baseUrl}/en/book`,
        'x-default': `${baseUrl}/id/book`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/book`,
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

export default async function BookingWizardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BookingWizardClient />;
}
