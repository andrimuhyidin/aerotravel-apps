import { redirect } from 'next/navigation';

import { getDashboardData } from '@/lib/partner/dashboard-service';
import { createClient } from '@/lib/supabase/server';
import { getPartnerProfile } from '@/lib/partner/profile-service';

import { PartnerDashboardClient } from './partner-dashboard-client';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Use getPartnerProfile service to fetch from correct table ('users')
  const profile = await getPartnerProfile(supabase, user.id);

  // If branch_id is missing (incomplete profile), we use a dummy UUID
  // to allow the dashboard to render in "Preview Mode"
  const isProfileIncomplete = !profile?.branchId;
  const branchId = profile?.branchId || '00000000-0000-0000-0000-000000000000';

  // Fetch dashboard data server-side
  const dashboardData = await getDashboardData(
    supabase,
    user.id,
    branchId
  );

  // Prepare profile data for client
  const profileData = {
    name: profile?.companyName || profile?.name || 'Partner',
    tier: (profile?.tier || 'bronze') as 'bronze' | 'silver' | 'gold' | 'platinum',
    avatar: profile?.avatar || null,
  };

  return (
    <PartnerDashboardClient
      initialData={dashboardData}
      initialProfile={profileData}
      isProfileIncomplete={isProfileIncomplete}
    />
  );
}
