/**
 * Partner Whitelabel Settings Page
 * Route: /[locale]/partner/whitelabel
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { getPartnerProfile, getWhitelabelSettings } from '@/lib/partner/profile-service';
import { WhitelabelSettingsClient } from './whitelabel-settings-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: 'Pengaturan Whitelabel - Partner Portal',
  description: 'Kustomisasi branding invoice Anda',
};

export default async function WhitelabelPage({ params }: PageProps) {
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
    return (
      <div className="p-4 text-center">
        <h1 className="text-lg font-bold">Profile Not Found</h1>
      </div>
    );
  }

  const settings = await getWhitelabelSettings(supabase, profile.id);
  
  const initialSettings = settings || {
    enabled: false,
    companyName: profile.companyName,
    logoUrl: null,
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    customDomain: null,
  };

  return <WhitelabelSettingsClient locale={locale} initialSettings={initialSettings} />;
}
