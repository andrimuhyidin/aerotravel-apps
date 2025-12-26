/**
 * Partner Account Page
 * Entry point untuk account/profile dengan proper server-side data
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { getPartnerProfile } from '@/lib/partner/profile-service';
import { AccountClient } from './account-client';

type AccountPageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: 'Account | Partner Portal',
  description: 'Kelola akun dan pengaturan Partner Portal',
};

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const profile = await getPartnerProfile(supabase, user.id);

  // If profile fails, we might still want to show account with basic user info
  const initialProfile = profile || {
    id: user.id,
    name: user.email?.split('@')[0] || 'Partner',
    email: user.email || '',
    phone: '',
    companyName: 'Partner',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    siup: '',
    npwp: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    tier: 'bronze' as const,
    isVerified: false,
    logoUrl: null,
    avatar: null,
    memberSince: new Date().getFullYear().toString(),
    points: 0,
    nextTierPoints: 1000,
    branchId: null,
  };

  return <AccountClient locale={locale} initialProfile={initialProfile} />;
}
