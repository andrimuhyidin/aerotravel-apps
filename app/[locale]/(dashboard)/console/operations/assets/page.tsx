/**
 * Assets Page
 * Route: /[locale]/console/operations/assets
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';

import { AssetsClient } from './assets-client';

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
    title: 'Assets - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/operations/assets`,
    },
  };
}

export default async function ConsoleOperationsAssetsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <div className="py-6">
          <AssetsClient />
        </div>
      </Container>
    </Section>
  );
}
