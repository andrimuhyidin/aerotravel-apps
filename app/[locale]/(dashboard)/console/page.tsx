/**
 * Dashboard ERP Page
 * Route: /[locale]/console
 * Future Minimalist 2026 - Personalized Dashboard
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { PersonalizedDashboard } from '@/components/console/personalized-dashboard';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';
  
  return {
    title: 'Dashboard ERP - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/console`,
    },
  };
}

export default async function ConsolePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Get current user for personalized dashboard
  const user = await getCurrentUser();
  const userRole = user?.activeRole || null;
  const userName = user?.profile?.full_name || user?.email || 'Admin';

  return (
    <PersonalizedDashboard
      userRole={userRole}
      userName={userName}
      locale={locale}
    />
  );
}
