'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export type AuthResult = {
  error?: string;
  success?: boolean;
  redirectPath?: string;
};

/**
 * Sign up with email and password
 */
export async function signUp(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Sign in with email and password
 */
export async function signIn(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  console.log('[AUTH] Attempting login for:', email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log('[AUTH] Login error:', error.message);
    return { error: error.message };
  }

  if (!data.user) {
    console.log('[AUTH] No user returned');
    return { error: 'Login gagal, coba lagi.' };
  }

  console.log('[AUTH] Login successful for user:', data.user.id);

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

  console.log('[AUTH] User role:', role, '-> redirect to:', redirectPath);

  // Get the session to verify it's set
  const {
    data: { session },
  } = await supabase.auth.getSession();
  console.log('[AUTH] Session exists:', !!session, session?.user.id);

  revalidatePath('/', 'layout');
  revalidatePath(redirectPath, 'page');

  // Use server-side redirect to properly persist cookies
  redirect(redirectPath);
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/id/login');
}

/**
 * Resend email confirmation
 */
export async function resendConfirmation(email: string): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Reset password request
 */
export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Update password (after reset)
 */
export async function updatePassword(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const password = formData.get('password') as string;

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/id/login');
}
