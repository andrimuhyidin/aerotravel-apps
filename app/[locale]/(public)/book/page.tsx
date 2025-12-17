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
  
  return {
    title: `${t('title')} - Aero Travel`,
    description: 'Book your travel package with our easy booking wizard.',
    alternates: {
      canonical: `${baseUrl}/${locale}/book`,
    },
  };
}

export default async function BookingWizardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BookingWizardClient />;
}
