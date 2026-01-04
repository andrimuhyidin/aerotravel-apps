/**
 * Partner Tier Detail Page
 * Route: /[locale]/partner/tier
 */

import { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPartnerProfile } from '@/lib/partner/profile-service';
import { TierDetailClient } from './tier-detail-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ea580c',
};

export const metadata: Metadata = {
  title: 'Partner Level - Partner Portal',
  description: 'Detail level partnership dan benefits',
};

export default async function PartnerTierPage({ params }: PageProps) {
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

  return <TierDetailClient locale={locale} initialProfile={profile} />;
}

