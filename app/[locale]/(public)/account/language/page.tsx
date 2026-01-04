/**
 * Language Settings Page
 * Route: /[locale]/account/language
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';

import { LanguageClient } from './language-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Pilih Bahasa - Aero Travel',
    description: 'Ubah bahasa aplikasi',
    alternates: {
      canonical: `${baseUrl}/${locale}/account/language`,
    },
    robots: { index: false, follow: false },
  };
}

export default async function LanguagePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <LanguageClient currentLocale={locale} />
      </Container>
    </Section>
  );
}

