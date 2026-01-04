import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ScheduledNotificationsClient } from './scheduled-notifications-client';

export const metadata: Metadata = {
  title: 'Scheduled Notifications | Admin Console',
  description: 'Manage automated scheduled notifications',
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ScheduledNotificationsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ScheduledNotificationsClient locale={locale} />;
}

