/**
 * Guide Promos & Updates List Page
 * Route: /[locale]/guide/promos
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { PromosListClient } from './promos-list-client';

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
  themeColor: '#000000',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Promo & Update - Guide App',
    description: 'Lihat semua promo, update, dan pengumuman dari perusahaan',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/promos`,
    },
  };
}

export default async function GuidePromosPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Promo & Update</h1>
        <p className="mt-1 text-sm text-slate-600">
          Lihat semua promo, update, dan pengumuman dari perusahaan
        </p>
      </div>
      <PromosListClient locale={locale} />
    </Container>
  );
}

