/**
 * Notification Preferences Page
 * User settings for notification channels
 */

import { Metadata } from 'next';

import { NotificationPreferencesClient } from './notification-preferences-client';

export const metadata: Metadata = {
  title: 'Pengaturan Notifikasi | MyAeroTravel',
  description: 'Kelola preferensi notifikasi Anda',
};

export default function NotificationPreferencesPage() {
  return <NotificationPreferencesClient />;
}

