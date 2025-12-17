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

      // Determine redirect based on user role
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const role = (profile as { role?: string } | null)?.role;
      let redirectPath = '/id'; // Default homepage

      if (
        role === 'super_admin' ||
        role === 'owner' ||
        role === 'manager' ||
        role === 'admin' ||
        role === 'finance' ||
        role === 'cs'
      ) {
        redirectPath = '/id/console';
      } else if (role === 'guide') {
        redirectPath = '/id/guide';
      } else if (role === 'mitra' || role === 'nta') {
        redirectPath = '/id/mitra';
      }

      // For email confirmation, show success message
      if (type === 'email_confirm' || type === 'signup') {
        redirectPath = '/id?verified=true';
      }

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/id/login?error=auth_error`);
}
