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
    let redirectPath = '/id';

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
