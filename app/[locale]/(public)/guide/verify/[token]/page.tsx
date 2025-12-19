/**
 * Public Guide Verification Page
 * Verify guide ID card via QR code token
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';

import { GuideVerificationClient } from './guide-verification-client';

type PageProps = {
  params: Promise<{ locale: string; token: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Verifikasi Guide AeroTravel',
    description: 'Verifikasi ID Card Guide AeroTravel',
  };
}

export default async function GuideVerificationPage({ params }: PageProps) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  return (
    <Section spacing="lg">
      <Container>
        <GuideVerificationClient token={token} locale={locale} />
      </Container>
    </Section>
  );
}
