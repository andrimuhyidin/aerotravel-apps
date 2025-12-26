/**
 * Partner Team Page
 * Route: /[locale]/partner/team
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { getPartnerProfile, getTeamMembers } from '@/lib/partner/profile-service';
import { TeamManagementClient } from './team-management-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: 'Kelola Team - Partner Portal',
  description: 'Kelola anggota team dan permissions',
};

export default async function TeamPage({ params }: PageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Get partner profile to confirm access/ID
  const profile = await getPartnerProfile(supabase, user.id);
  
  if (!profile) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-lg font-bold">Profile Not Found</h1>
      </div>
    );
  }

  // Fetch team members
  const members = await getTeamMembers(supabase, profile.id);

  return <TeamManagementClient locale={locale} initialMembers={members} />;
}
