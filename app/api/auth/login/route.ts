import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

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

    console.log('[AUTH API] Attempting login for:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('[AUTH API] Login error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.user) {
      console.log('[AUTH API] No user returned');
      return NextResponse.json(
        { error: 'Login gagal, coba lagi.' },
        { status: 401 }
      );
    }

    console.log('[AUTH API] Login successful for user:', data.user.id);

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

    // Determine redirect based on user role
    const roleRedirectMap: Record<string, string> = {
      // Internal Staff -> Console
      super_admin: '/id/console',
      investor: '/id/console',
      finance_manager: '/id/console',
      marketing: '/id/console',
      ops_admin: '/id/console',
      // Guide -> Guide App
      guide: '/id/guide/attendance',
      // Partner/Mitra -> Partner Portal
      mitra: '/id/partner/dashboard',
      // Corporate -> Corporate Portal
      corporate: '/id/corporate',
      // Customer -> Home
      customer: '/id',
    };

    const redirectPath = roleRedirectMap[role ?? 'customer'] || '/id';

    console.log('[AUTH API] User role:', role, '-> redirect to:', redirectPath);

    // Return success with redirect path
    return NextResponse.json({
      success: true,
      redirectPath,
    });
  } catch (error) {
    console.error('[AUTH API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan, coba lagi.' },
      { status: 500 }
    );
  }
}
