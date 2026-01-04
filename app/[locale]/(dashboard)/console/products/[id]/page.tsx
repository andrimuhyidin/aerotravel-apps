/**
 * Package Detail Page
 * Route: /[locale]/console/products/[id]
 */

import { Metadata, Viewport } from 'next';
import { redirect, notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { getCurrentUser, createAdminClient } from '@/lib/supabase/server';

import { PackageDetailClient } from './package-detail-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Package Detail | Admin Console',
    description: 'View package details',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/products/${id}`,
    },
  };
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if user has permission
  const allowedRoles = ['super_admin', 'marketing', 'ops_admin'];
  if (!user.activeRole || !allowedRoles.includes(user.activeRole)) {
    redirect(`/${locale}/console`);
  }

  // Fetch package data using admin client
  const supabase = await createAdminClient();
  const { data: packageData, error } = await supabase
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

  return <PackageDetailClient packageData={packageData as unknown as Parameters<typeof PackageDetailClient>[0]['packageData']} />;
}

