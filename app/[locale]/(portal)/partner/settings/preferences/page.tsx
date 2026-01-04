/**
 * Partner Preferences Page - Language & Timezone Settings
 * Route: /[locale]/partner/settings/preferences
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PreferencesClient } from './preferences-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: 'Preferensi - Partner Portal',
  description: 'Atur bahasa dan zona waktu',
};

export default async function PreferencesPage({ params }: PageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  return <PreferencesClient locale={locale} />;
}

