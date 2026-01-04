/**
 * Notifications Center Page
 * Route: /[locale]/console/notifications
 * View and manage all notifications
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { NotificationsCenterClient } from './notifications-center-client';

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
    title: 'Notifications - Aero Travel',
    description: 'View and manage your notifications',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/notifications`,
    },
  };
}

export default async function NotificationsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Section>
      <Container>
        <div className="py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              View and manage all your notifications
            </p>
          </div>

          <NotificationsCenterClient locale={locale} userId={user.id} />
        </div>
      </Container>
    </Section>
  );
}

