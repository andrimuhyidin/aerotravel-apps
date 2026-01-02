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

  const title = `${t('app_name')} - Integrated Travel Ecosystem`;
  const description =
    'Best marine travel packages with high safety standards. Pahawang, Labuan Bajo, and other exotic destinations.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        id: `${baseUrl}/id`,
        en: `${baseUrl}/en`,
        'x-default': `${baseUrl}/id`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName: 'MyAeroTravel ID',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.jpg`],
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

  // Guest: Show marketing page with featured packages from database
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  const { data: featuredPackages } = await supabase
    .from('packages')
    .select(`
      id,
      slug,
      name,
      destination,
      province,
      average_rating,
      review_count,
      package_prices (
        price_publish
      )
    `)
    .eq('status', 'published')
    .order('review_count', { ascending: false })
    .limit(3);

  const formattedPackages = (featuredPackages || []).map((pkg, idx) => {
    const prices = pkg.package_prices as { price_publish: number }[] | null;
    const lowestPrice = prices?.[0]?.price_publish || 0;
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-teal-500 to-emerald-500',
      'from-purple-500 to-pink-500',
    ];
    const tags = ['Populer', 'Best Seller', 'Premium'];
    const emojis: Record<string, string> = {
      'Pulau Pahawang': '🏝️',
      'Teluk Kiluan': '🐬',
      'Labuan Bajo': '🦎',
      'Raja Ampat': '🪸',
    };
    
    return {
      name: pkg.name,
      location: pkg.province || 'Indonesia',
      price: lowestPrice,
      rating: pkg.average_rating || 0,
      reviews: pkg.review_count || 0,
      emoji: emojis[pkg.destination] || '🌊',
      tag: tags[idx] || 'Populer',
      gradient: gradients[idx] || 'from-blue-500 to-cyan-500',
      slug: pkg.slug,
    };
  });

  return <GuestHomepage locale={locale} featuredPackages={formattedPackages} />;
}
