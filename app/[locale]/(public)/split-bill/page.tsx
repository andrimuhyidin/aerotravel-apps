/**
 * Split Bill List Page
 * Route: /[locale]/split-bill
 * Lists all split bills for the current user
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { SplitBillListClient } from './split-bill-list-client';

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
    title: 'Split Bill - Aero Travel',
    description: 'Patungan bayar trip bareng teman dengan mudah',
    alternates: {
      canonical: `${baseUrl}/${locale}/split-bill`,
    },
    robots: { index: false, follow: false },
  };
}

export default async function SplitBillListPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?redirect=/split-bill`);
  }

  return (
    <Section>
      <Container>
        <SplitBillListClient locale={locale} />
      </Container>
    </Section>
  );
}

