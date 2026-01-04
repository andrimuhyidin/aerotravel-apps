/**
 * Middleware - Route Protection + i18n
 * Next.js 15.x compatible
 * Handles:
 * 1. Internationalization (locale detection & routing)
 * 2. Authentication (session check)
 * 3. Authorization (role-based access)
 * 4. Branch injection (multi-tenant)
 * 
 * PERFORMANCE OPTIMIZED:
 * - Single getActiveRole() call per request
 * - Single user profile query per request
 * - Parallel queries where possible
 * - Early exit for admin routes using user_metadata
 */

import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { defaultLocale, localeConfig } from './i18n';
import { getActiveRole } from './lib/session/active-role';
import { updateSession } from './lib/supabase/middleware';

// Create i18n middleware
const intlMiddleware = createMiddleware({
  locales: localeConfig.locales,
  defaultLocale: localeConfig.defaultLocale,
  localePrefix: localeConfig.localePrefix,
});

// Internal roles that can access console
const INTERNAL_ROLES = [
  'super_admin',
  'investor',
  'finance_manager',
  'marketing',
  'ops_admin',
];

export async function middleware(request: NextRequest) {
  // Extract locale from pathname
  const pathname = request.nextUrl.pathname;
  const pathnameHasLocale = localeConfig.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Handle i18n routing first
  if (
    !pathnameHasLocale &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/auth')
  ) {
    // Redirect to default locale if no locale in path
    const locale = defaultLocale;
    return NextResponse.redirect(
      new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url)
    );
  }

  // Update Supabase session first (this refreshes auth tokens)
  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Extract locale for route matching
  const locale = pathname.split('/')[1] || defaultLocale;
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  // Skip auth checks for API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth')
  ) {
    return supabaseResponse;
  }

  // Public landing pages (accessible without login)
  const publicLandingPages = ['/guide', '/partner', '/corporate', '/customer'];
  const isPublicLanding =
    publicLandingPages.some(
      (path) =>
        pathWithoutLocale === path ||
        pathWithoutLocale.startsWith(`${path}/apply`)
    ) ||
    pathWithoutLocale.startsWith('/guide/apply') ||
    pathWithoutLocale.startsWith('/partner/apply') ||
    pathWithoutLocale.startsWith('/corporate/apply');

  // Allow public landing pages without authentication
  if (isPublicLanding && !user) {
    return supabaseResponse;
  }

  // Protected routes (only check if not public landing page)
  const protectedPaths = [
    `/${locale}/console`,
    `/${locale}/partner/dashboard`,
    `/${locale}/partner/bookings`,
    `/${locale}/partner/invoices`,
    `/${locale}/partner/wallet`,
    `/${locale}/partner/whitelabel`,
    `/${locale}/guide/trips`,
    `/${locale}/guide/attendance`,
    `/${locale}/guide/manifest`,
    `/${locale}/guide/sos`,
    `/${locale}/corporate/employees`,
    `/${locale}/corporate/invoices`,
  ];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Role-based routing
  if (user) {
    // ========================================
    // PERFORMANCE: Get role from user_metadata first (no DB call)
    // ========================================
    const metaRole = (user.user_metadata?.role as string) || null;
    const metaActiveRole = (user.user_metadata?.active_role as string) || null;
    const metaBranchId = (user.user_metadata?.branch_id as string) || null;
    
    // ========================================
    // PERFORMANCE: Early exit for console routes with known admin roles
    // Uses user_metadata instead of DB queries (saves 200-400ms)
    // ========================================
    if (pathWithoutLocale.startsWith('/console')) {
      const effectiveRole = metaActiveRole || metaRole;
      if (effectiveRole && INTERNAL_ROLES.includes(effectiveRole)) {
        // Inject branch_id if available
        if (metaBranchId) {
          supabaseResponse.headers.set('x-branch-id', metaBranchId);
        }
        return supabaseResponse; // Fast path - skip expensive DB queries
      }
    }
    
    // ========================================
    // PERFORMANCE: Single parallel fetch for profile and active role
    // Previously: 4 separate queries, now: 1 parallel batch
    // ========================================
    const [profileResult, activeRole] = await Promise.all([
      supabase
        .from('users')
        .select('role, branch_id, is_contract_signed')
        .eq('id', user.id)
        .single(),
      getActiveRole(user.id),
    ]);

    const userProfile = profileResult.data as {
      role: string;
      branch_id: string | null;
      is_contract_signed: boolean | null;
    } | null;

    // Determine effective user role (activeRole > profile.role > metadata)
    const userRole = activeRole || userProfile?.role || metaRole;
    const branchId = userProfile?.branch_id || metaBranchId;
    // Super admin bypass consent check
    const hasConsent = metaRole === 'super_admin' || userProfile?.is_contract_signed;

    // Debug logging for role detection (only on home page)
    if (pathWithoutLocale === '/' || pathWithoutLocale === '') {
      const { logger } = await import('@/lib/utils/logger');
      try {
        logger.info('[PROXY] Home page access - Role detection', {
          userId: user.id,
          activeRole: String(activeRole || 'null'),
          profileRole: String(userProfile?.role || 'null'),
          finalRole: String(userRole || 'null'),
          branchId: String(branchId || 'null'),
          hasConsent: Boolean(hasConsent),
        });
      } catch (logError) {
        // Ignore log errors
        console.error('[PROXY] Logger error', logError);
      }
    }

    // Check consent - redirect to legal sign if not agreed
    const consentExemptPaths = [
      '/legal/sign',
      '/login',
      '/register',
      '/logout',
    ];
    const isConsentExempt = consentExemptPaths.some((p) =>
      pathWithoutLocale.startsWith(p)
    );

    if (!hasConsent && !isConsentExempt && userRole !== 'super_admin') {
      return NextResponse.redirect(
        new URL(`/${locale}/legal/sign`, request.url)
      );
    }

    // Handle landing page redirects for logged-in users
    // Redirect to their respective dashboards to prevent double header issue
    if (pathWithoutLocale === '/guide') {
      const isGuide = userRole === 'guide';
      if (isGuide) {
        return NextResponse.redirect(new URL(`/${locale}/guide/home`, request.url));
      }
    }

    if (pathWithoutLocale === '/partner') {
      const isMitra = userRole === 'mitra' || userRole === 'nta';
      if (isMitra) {
        return NextResponse.redirect(new URL(`/${locale}/partner/dashboard`, request.url));
      }
    }

    if (pathWithoutLocale === '/corporate') {
      const isCorporate = userRole === 'corporate';
      if (isCorporate) {
        return NextResponse.redirect(new URL(`/${locale}/corporate/dashboard`, request.url));
      }
    }

    // Role-based route protection (skip for public landing pages)
    if (!isPublicLanding) {
      // Guide routes - only allow if active role is guide
      if (
        pathWithoutLocale.startsWith('/guide') &&
        !pathWithoutLocale.startsWith('/guide/apply') &&
        userRole !== 'guide'
      ) {
        return NextResponse.redirect(new URL(`/${locale}/guide`, request.url));
      }

      // Partner routes - only allow if active role is mitra
      const partnerPublicPaths = [
        '/partner',
        '/partner/apply',
        '/partner/help',
        '/partner/legal',
        '/partner/about',
      ];
      const isPartnerPublicPath = partnerPublicPaths.some((path) =>
        pathWithoutLocale === path || pathWithoutLocale.startsWith(`${path}/`)
      );

      if (
        pathWithoutLocale.startsWith('/partner') &&
        !isPartnerPublicPath &&
        userRole !== 'mitra'
      ) {
        return NextResponse.redirect(new URL(`/${locale}/partner`, request.url));
      }

      // Corporate routes - only allow if active role is corporate
      if (
        pathWithoutLocale.startsWith('/corporate') &&
        !pathWithoutLocale.startsWith('/corporate/apply') &&
        userRole !== 'corporate'
      ) {
        return NextResponse.redirect(new URL(`/${locale}/corporate`, request.url));
      }

      // Mitra cannot access console
      if (userRole === 'mitra' && pathWithoutLocale.startsWith('/console')) {
        return NextResponse.redirect(new URL(`/${locale}/partner/dashboard`, request.url));
      }

      // Corporate cannot access console
      if (userRole === 'corporate' && pathWithoutLocale.startsWith('/console')) {
        return NextResponse.redirect(new URL(`/${locale}/corporate/employees`, request.url));
      }
    }

    // Console access only for internal roles
    if (
      pathWithoutLocale.startsWith('/console') &&
      !INTERNAL_ROLES.includes(userRole || '')
    ) {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    // Inject branch_id to headers for server components
    if (branchId) {
      supabaseResponse.headers.set('x-branch-id', branchId);
    }
  }

  // Return supabaseResponse which has properly set cookies
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
