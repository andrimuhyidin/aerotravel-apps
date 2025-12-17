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

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'Login gagal, coba lagi.' };
  }

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

  revalidatePath('/', 'layout');

  // Return success with redirect path instead of calling redirect()
  // This allows client to show success message before redirecting
  return { success: true, redirectPath };
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
