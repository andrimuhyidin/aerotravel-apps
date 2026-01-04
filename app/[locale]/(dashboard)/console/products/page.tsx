/**
 * Products Management Page
 * Route: /[locale]/console/products
 */

import { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { ProductsManagementClient } from './products-management-client';

type PageProps = {
  params: Promise<{ locale: string }>;
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
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Package Management | Admin Console',
    description: 'Manage travel packages - create, edit, and publish packages',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/products`,
    },
  };
}

export default async function ProductsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if user has permission (admin, marketing, ops_admin)
  const allowedRoles = ['super_admin', 'marketing', 'ops_admin'];
  if (!user.activeRole || !allowedRoles.includes(user.activeRole)) {
    redirect(`/${locale}/console`);
  }

  return (
    <ProductsManagementClient
      userBranchId={user.profile?.branch_id ?? null}
      userRole={user.activeRole}
    />
  );
}
