/**
 * Gallery List Page
 * Route: /[locale]/gallery
 * Lists all trips with photos for the current user
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { GalleryListClient } from './gallery-list-client';

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
    title: 'Galeri Foto Trip - Aero Travel',
    description: 'Lihat koleksi foto dari trip Anda',
    alternates: {
      canonical: `${baseUrl}/${locale}/gallery`,
    },
    robots: { index: false, follow: false },
  };
}

export default async function GalleryListPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?redirect=/gallery`);
  }

  return (
    <Section>
      <Container>
        <GalleryListClient locale={locale} />
      </Container>
    </Section>
  );
}

