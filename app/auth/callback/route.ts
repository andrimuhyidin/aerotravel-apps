import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

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
      const { getActiveRole } = await import('@/lib/session/active-role');
      const activeRole = await getActiveRole(data.user.id);
      
      // Fallback to profile role if no active role
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const profileRole = (profile as { role?: string } | null)?.role;
      const finalRole = activeRole || profileRole;
      
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
