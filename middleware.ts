/**
 * Middleware - Route Protection + i18n
 * Handles:
 * 1. Internationalization (locale detection & routing)
 * 2. Authentication (session check)
 * 3. Authorization (role-based access)
 * 4. Branch injection (multi-tenant)
 */

import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { defaultLocale, localeConfig } from './i18n';
import { updateSession } from './lib/supabase/middleware';

// Create i18n middleware
const intlMiddleware = createMiddleware({
  locales: localeConfig.locales,
  defaultLocale: localeConfig.defaultLocale,
  localePrefix: localeConfig.localePrefix,
});

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

  // Protected routes
  const protectedPaths = [
    `/${locale}/console`,
    `/${locale}/partner`,
    `/${locale}/guide`,
    `/${locale}/corporate`,
  ];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Role-based routing
  if (user) {
    // Get user profile for role and consent
    const { data: profile } = await supabase
      .from('users')
      .select('role, branch_id, consent_agreed')
      .eq('id', user.id)
      .single();

    const userProfile = profile as {
      role: string;
      branch_id: string | null;
      consent_agreed: boolean | null;
    } | null;
    const userRole = userProfile?.role;
    const branchId = userProfile?.branch_id;
    const hasConsent = userProfile?.consent_agreed;

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

    // Guide can only access /guide
    if (userRole === 'guide' && !pathWithoutLocale.startsWith('/guide')) {
      return NextResponse.redirect(new URL(`/${locale}/guide`, request.url));
    }

    // Mitra can only access /partner (not /console)
    if (userRole === 'mitra' && pathWithoutLocale.startsWith('/console')) {
      return NextResponse.redirect(
        new URL(`/${locale}/partner/dashboard`, request.url)
      );
    }

    // Corporate can only access /corporate
    if (userRole === 'corporate' && pathWithoutLocale.startsWith('/console')) {
      return NextResponse.redirect(
        new URL(`/${locale}/corporate`, request.url)
      );
    }

    // Console access only for internal roles
    const internalRoles = [
      'super_admin',
      'investor',
      'finance_manager',
      'marketing',
      'ops_admin',
    ];
    if (
      pathWithoutLocale.startsWith('/console') &&
      !internalRoles.includes(userRole || '')
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
