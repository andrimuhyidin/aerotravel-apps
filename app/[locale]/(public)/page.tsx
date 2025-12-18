/**
 * Homepage - Superapps Style
 * Guest: Marketing page
 * Customer: Personalized dashboard
 * Other roles: Redirect to respective dashboards
 */

import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { CustomerDashboard } from './customer-dashboard';
import { GuestHomepage } from './guest-homepage';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('common');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: `${t('app_name')} - Integrated Travel Ecosystem`,
    description:
      'Best marine travel packages with high safety standards. Pahawang, Labuan Bajo, and other exotic destinations.',
    alternates: {
      canonical: `${baseUrl}/${locale}`,
    },
  };
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Get current user
  const user = await getCurrentUser();
  const profile = user?.profile as {
    role?: string;
    full_name?: string;
  } | null;
  const userRole = profile?.role;
  const userName = profile?.full_name?.split(' ')[0] || 'Traveler';

  // Redirect other roles to their dashboards
  if (userRole === 'guide') {
    redirect(`/${locale}/guide`);
  }
  if (userRole === 'mitra' || userRole === 'nta') {
    redirect(`/${locale}/mitra`);
  }
  if (
    userRole === 'super_admin' ||
    userRole === 'owner' ||
    userRole === 'manager' ||
    userRole === 'admin' ||
    userRole === 'finance' ||
    userRole === 'cs'
  ) {
    redirect(`/${locale}/console`);
  }

  // If logged in as customer, show superapps dashboard
  if (user && (!userRole || userRole === 'customer')) {
    return <CustomerDashboard locale={locale} userName={userName} />;
  }

  // Guest: Show marketing page
  return <GuestHomepage locale={locale} />;
}
