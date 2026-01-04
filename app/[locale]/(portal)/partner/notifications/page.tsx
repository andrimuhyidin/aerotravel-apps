/**
 * Partner Notifications Page
 */

import { Metadata } from 'next';
import { NotificationsClient } from './notifications-client';

export const metadata: Metadata = {
  title: 'Notifikasi | Partner Portal',
  description: 'Notifikasi dan pengumuman untuk partner',
};

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <NotificationsClient locale={locale} />;
}

