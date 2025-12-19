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
  
  if (user) {
    const profile = user?.profile as {
      role?: string;
      full_name?: string;
    } | null;
    
    // CRITICAL: Use activeRole for multi-role support, fallback to profile.role
    // activeRole comes from getActiveRole() which checks:
    // 1. Session metadata (if user switched role)
    // 2. Primary role from user_roles table
    // 3. Fallback to users.role
    const userRole = user?.activeRole || profile?.role;
    
    // Debug logging
    const { logger } = await import('@/lib/utils/logger');
    logger.info('HomePage - Role detection', {
      userId: user.id,
      activeRole: user?.activeRole,
      profileRole: profile?.role,
      allRoles: user?.roles,
      finalRole: userRole,
    });
    
    // IMPORTANT: Redirect based on active role BEFORE showing any dashboard
    // This ensures guide users go to /guide, not customer dashboard
    if (userRole === 'guide') {
      logger.info('HomePage - Redirecting guide to /guide', { userId: user.id });
      redirect(`/${locale}/guide`);
    }
    if (userRole === 'mitra' || userRole === 'nta') {
      logger.info('HomePage - Redirecting partner to /partner/dashboard', { userId: user.id });
      redirect(`/${locale}/partner/dashboard`);
    }
    if (
      userRole === 'super_admin' ||
      userRole === 'owner' ||
      userRole === 'manager' ||
      userRole === 'admin' ||
      userRole === 'finance' ||
      userRole === 'cs' ||
      userRole === 'ops_admin' ||
      userRole === 'finance_manager' ||
      userRole === 'marketing' ||
      userRole === 'investor'
    ) {
      logger.info('HomePage - Redirecting internal staff to /console', { userId: user.id, role: userRole });
      redirect(`/${locale}/console`);
    }
    if (userRole === 'corporate') {
      logger.info('HomePage - Redirecting corporate to /corporate/employees', { userId: user.id });
      redirect(`/${locale}/corporate/employees`);
    }

    // Only show customer dashboard if role is customer or null/undefined
    if (!userRole || userRole === 'customer') {
      logger.info('HomePage - Showing customer dashboard', { userId: user.id, role: userRole });
      const userName = profile?.full_name?.split(' ')[0] || 'Traveler';
      return <CustomerDashboard locale={locale} userName={userName} />;
    }
    
    // Fallback: if role is detected but not handled above, log warning
    logger.warn('HomePage - Unhandled role, showing customer dashboard', { 
      userId: user.id, 
      role: userRole,
      activeRole: user?.activeRole,
      profileRole: profile?.role,
    });
    const userName = profile?.full_name?.split(' ')[0] || 'Traveler';
    return <CustomerDashboard locale={locale} userName={userName} />;
  }

  // Guest: Show marketing page
  return <GuestHomepage locale={locale} />;
}
