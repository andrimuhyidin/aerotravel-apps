import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { warmUserCache } from '@/lib/cache/redis-cache';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const type = searchParams.get('type'); // email_confirm, recovery, etc.

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // If explicit next path provided, use it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Get active role (multi-role support)
      const { getActiveRole, getUserRoles } = await import('@/lib/session/active-role');
      
      // Parallel fetch for better performance
      const [activeRole, roles, profileResult] = await Promise.all([
        getActiveRole(data.user.id),
        getUserRoles(data.user.id),
        supabase.from('users').select('*').eq('id', data.user.id).single(),
      ]);
      
      const profile = profileResult.data as Record<string, unknown> | null;
      const profileRole = profile?.role as string | null;
      const finalRole = activeRole || profileRole;
      
      // PERFORMANCE: Warm user cache for faster first page load
      try {
        await warmUserCache(
          data.user.id,
          profile,
          activeRole,
          roles
        );
        logger.info('User cache warmed on login', { userId: data.user.id, role: finalRole });
      } catch (cacheError) {
        // Don't block login if cache warming fails
        logger.error('Failed to warm user cache', cacheError, { userId: data.user.id });
      }
      
      // Role-based redirect map
      const roleRedirectMap: Record<string, string> = {
        super_admin: '/id/console',
        investor: '/id/console',
        finance_manager: '/id/console',
        marketing: '/id/console',
        ops_admin: '/id/console',
        guide: '/id/guide',
        mitra: '/id/partner/dashboard',
        nta: '/id/partner/dashboard',
        corporate: '/id/corporate/employees',
        customer: '/id',
      };

      let redirectPath = roleRedirectMap[finalRole ?? 'customer'] || '/id';

      // For email confirmation, show success message
      if (type === 'email_confirm' || type === 'signup') {
        redirectPath = '/id?verified=true';
      }

      // For password recovery, redirect to reset password page
      if (type === 'recovery') {
        redirectPath = '/id/reset-password';
      }

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/id/login?error=auth_error`);
}
