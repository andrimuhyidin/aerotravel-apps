/**
 * Partner Settings Page
 * Route: /[locale]/partner/settings
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { getPartnerProfile } from '@/lib/partner/profile-service';
import { SettingsClient } from './settings-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: 'Pengaturan - Partner Portal',
  description: 'Kelola profil, keamanan, dan preferensi akun',
};

export default async function PartnerSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const profile = await getPartnerProfile(supabase, user.id);

  if (!profile) {
    // Should handle this case better, maybe redirect to onboarding
    return (
      <div className="p-4 text-center">
        <h1 className="text-lg font-bold">Profile Not Found</h1>
        <p>Please contact support.</p>
      </div>
    );
  }

  return <SettingsClient locale={locale} initialProfile={profile} />;
}
