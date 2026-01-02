import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { logFailedLogin } from '@/lib/audit/security-events';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    logger.info('[AUTH API] Attempting login', { email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn('[AUTH API] Login error', { email, error: error.message });
      
      // Log failed login attempt for security monitoring
      await logFailedLogin(email, error.message, request);
      
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.user) {
      logger.warn('[AUTH API] No user returned', { email });
      
      // Log failed login attempt
      await logFailedLogin(email, 'No user returned from auth', request);
      
      return NextResponse.json(
        { error: 'Login gagal, coba lagi.' },
        { status: 401 }
      );
    }

    logger.info('[AUTH API] Login successful', { userId: data.user.id, email });

    // Check if user profile exists, create if not
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    let role = (profile as { role?: string } | null)?.role;

    // Auto-create profile if doesn't exist
    if (!profile) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email || email,
        full_name: data.user.user_metadata?.full_name || email.split('@')[0],
        role: 'customer',
        is_active: true,
      } as never);
      role = 'customer';
    }

    // Get active role (multi-role support)
    const { getActiveRole } = await import('@/lib/session/active-role');
    const activeRole = await getActiveRole(data.user.id);
    const finalRole = activeRole || role; // Use active role, fallback to profile role

    // Determine redirect based on active role
    const roleRedirectMap: Record<string, string> = {
      // Internal Staff -> Console
      super_admin: '/id/console',
      investor: '/id/console',
      finance_manager: '/id/console',
      marketing: '/id/console',
      ops_admin: '/id/console',
      // Guide -> Guide App
      guide: '/id/guide',
      // Partner/Mitra -> Partner Portal
      mitra: '/id/partner/dashboard',
      nta: '/id/partner/dashboard',
      // Corporate -> Corporate Portal
      corporate: '/id/corporate/employees',
      // Customer -> Home
      customer: '/id',
    };

    const redirectPath = roleRedirectMap[finalRole ?? 'customer'] || '/id';

    logger.info('[AUTH API] User role determined', { userId: data.user.id, role, activeRole: finalRole, redirectPath });

    // Return success with redirect path
    return NextResponse.json({
      success: true,
      redirectPath,
    });
  } catch (error) {
    const emailFromForm = typeof request.formData === 'function' ? 'unknown' : 'unknown';
    logger.error('[AUTH API] Unexpected error', error, { email: emailFromForm });
    return NextResponse.json(
      { error: 'Terjadi kesalahan, coba lagi.' },
      { status: 500 }
    );
  }
}
