/**
 * Inbox Page - Pesan & Notifikasi
 * Central untuk semua komunikasi
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { InboxClient } from './inbox-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Inbox - Aero Travel',
    description: 'Pesan dan notifikasi Anda',
    alternates: {
      canonical: `${baseUrl}/${locale}/inbox`,
      languages: {
        id: `${baseUrl}/id/inbox`,
        en: `${baseUrl}/en/inbox`,
        'x-default': `${baseUrl}/id/inbox`,
      },
    },
    robots: { index: false, follow: false }, // Private page
  };
}

export default async function InboxPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  const isLoggedIn = !!user;

  return <InboxClient locale={locale} isLoggedIn={isLoggedIn} />;
}
