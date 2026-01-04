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
  
  // Get packages with their prices and rating stats
  const { data: featuredPackages } = await supabase
    .from('packages')
    .select(`
      id,
      slug,
      name,
      destination,
      province
    `)
    .eq('status', 'published')
    .limit(10);

  if (!featuredPackages || featuredPackages.length === 0) {
    return <GuestHomepage locale={locale} featuredPackages={[]} />;
  }

  // Get package prices for featured packages
  const packageIds = featuredPackages.map(p => p.id);
  const { data: packagePrices } = await supabase
    .from('package_prices')
    .select('package_id, price_publish')
    .in('package_id', packageIds)
    .eq('is_active', true)
    .order('price_publish', { ascending: true });

  // Get rating stats from materialized view
  // Note: package_rating_stats is a materialized view, not in generated types
  type RatingStatsRow = {
    package_id: string;
    average_rating: number | null;
    total_reviews: number | null;
  };
  const { data: ratingStats } = await (supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        in: (column: string, values: string[]) => Promise<{ data: RatingStatsRow[] | null }>;
      };
    };
  })
    .from('package_rating_stats')
    .select('package_id, average_rating, total_reviews')
    .in('package_id', packageIds);

  // Create maps for quick lookup
  const pricesMap = new Map<string, number>();
  (packagePrices || []).forEach(pp => {
    const current = pricesMap.get(pp.package_id);
    if (!current || pp.price_publish < current) {
      pricesMap.set(pp.package_id, pp.price_publish);
    }
  });

  const ratingMap = new Map<string, { rating: number; reviews: number }>();
  if (ratingStats && Array.isArray(ratingStats)) {
    ratingStats.forEach(rs => {
      if (rs && rs.package_id) {
        ratingMap.set(rs.package_id, {
          rating: rs.average_rating || 0,
          reviews: rs.total_reviews || 0,
        });
      }
    });
  }

  // Format packages with prices and ratings
  const formattedPackages = featuredPackages
    .map((pkg, idx) => {
      const lowestPrice = pricesMap.get(pkg.id) || 0;
      const stats = ratingMap.get(pkg.id) || { rating: 0, reviews: 0 };
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
        rating: stats.rating,
        reviews: stats.reviews,
        emoji: emojis[pkg.destination] || '🌊',
        tag: tags[idx] || 'Populer',
        gradient: gradients[idx] || 'from-blue-500 to-cyan-500',
        slug: pkg.slug,
      };
    })
    .filter(pkg => pkg.price > 0) // Only show packages with prices
    .sort((a, b) => b.reviews - a.reviews) // Sort by review count
    .slice(0, 3); // Take top 3

  return <GuestHomepage locale={locale} featuredPackages={formattedPackages} />;
}
