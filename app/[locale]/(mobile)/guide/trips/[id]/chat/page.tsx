/**
 * Trip Chat Page
 * Route: /[locale]/guide/trips/[id]/chat
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { TripChatClient } from './trip-chat-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
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
    title: 'Chat Trip - Guide App',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/trips/[id]/chat`,
    },
  };
}

export default async function TripChatPage({ params }: PageProps) {
  const { locale, id: tripId } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <TripChatClient locale={locale} tripId={tripId} />
    </Container>
  );
}
