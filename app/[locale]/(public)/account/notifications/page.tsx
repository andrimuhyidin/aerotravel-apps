/**
 * Customer Notifications Page
 * Route: /[locale]/account/notifications
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { CustomerNotificationsClient } from './notifications-client';

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
    title: 'Notifikasi - Aero Travel',
    description: 'Lihat notifikasi dan update booking Anda',
    alternates: {
      canonical: `${baseUrl}/${locale}/account/notifications`,
    },
  };
}

export default async function CustomerNotificationsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?redirect=/account/notifications`);
  }

  return (
    <Section>
      <Container>
        <CustomerNotificationsClient locale={locale} />
      </Container>
    </Section>
  );
}

