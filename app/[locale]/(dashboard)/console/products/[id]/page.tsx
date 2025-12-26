import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { PackageDetailClient } from './package-detail-client';

export const metadata: Metadata = {
  title: 'Package Detail | Admin Console',
  description: 'View package details',
};

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user role
  const client = supabase as unknown as any;
  const { data: userData } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  // Check if user has permission
  const allowedRoles = ['super_admin', 'marketing', 'ops_admin'];
  if (!userData || !allowedRoles.includes(userData.role)) {
    redirect('/console');
  }

  // Fetch package data
  const { data: packageData, error } = await client
    .from('packages')
    .select(`
      *,
      package_prices (
        id,
        min_pax,
        max_pax,
        price_publish,
        price_nta,
        price_weekend,
        valid_from,
        valid_until,
        is_active
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !packageData) {
    notFound();
  }

  return <PackageDetailClient packageData={packageData} />;
}

