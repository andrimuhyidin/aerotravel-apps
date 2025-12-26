/**
 * Partner Onboarding Page
 * Route: /[locale]/partner/onboarding
 * Guides new partners through initial setup
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { OnboardingClient } from './onboarding-client';

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
  
  return {
    title: 'Onboarding - Partner Portal',
    description: 'Setup awal untuk partner baru',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/onboarding`,
    },
  };
}

export default async function OnboardingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <OnboardingClient locale={locale} />
      </Container>
    </Section>
  );
}

