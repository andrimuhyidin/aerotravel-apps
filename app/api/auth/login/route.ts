import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { logFailedLogin } from '@/lib/audit/security-events';
import type { Database } from '@/types/supabase';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type UserRole = Database['public']['Enums']['user_role'];

/**
 * Get active role directly from database without relying on session metadata
 * This is safer to use right after login when session might not be fully propagated
 * 
 * Strategy:
 * 1. Try to query user_roles table (may fail due to RLS if session not ready)
 * 2. If that fails, fallback to users.role (which should always work)
 * 3. Always return a valid role or null
 */
async function getActiveRoleDirect(
  userId: string,
  supabase: SupabaseClient
): Promise<UserRole | null> {
  try {
    // First, try to get primary role from user_roles table
    // Note: This may fail due to RLS if session is not fully established
    const primaryResult = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('is_primary', true)
      .maybeSingle();

    // If RLS blocks or no data, check error
    if (primaryResult.error) {
      // RLS might block this - that's OK, we'll use fallback
      logger.debug('Primary role query blocked or failed (RLS?)', { 
        userId, 
        error: primaryResult.error.message 
      });
    } else if (primaryResult.data) {
      return primaryResult.data.role as UserRole;
    }

    // If no primary role, try to get any active role
    const anyRoleResult = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (anyRoleResult.error) {
      // RLS might block this - that's OK, we'll use fallback
      logger.debug('Any role query blocked or failed (RLS?)', { 
        userId, 
        error: anyRoleResult.error.message 
      });
    } else if (anyRoleResult.data) {
      return anyRoleResult.data.role as UserRole;
    }

    // Fallback to users.role (this should always work as users can read their own data)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError) {
      logger.warn('Failed to get user role from users table', { userId, error: userError.message });
      return null;
    }

    return (userData?.role as UserRole) || null;
  } catch (error) {
    logger.error('Failed to get active role directly', error, { userId });
    // Final fallback: query users table
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      return (userData?.role as UserRole) || null;
    } catch (fallbackError) {
      logger.error('Final fallback failed', fallbackError, { userId });
      return null;
    }
  }
}

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

    // Create a new client to ensure session cookies are properly set
    const supabaseWithSession = await createClient();

    // Check if user profile exists, create if not
    const { data: profile } = await supabaseWithSession
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    let role = (profile as { role?: string } | null)?.role;

    // Auto-create profile if doesn't exist
    if (!profile) {
      await supabaseWithSession.from('users').insert({
        id: data.user.id,
        email: data.user.email || email,
        full_name: data.user.user_metadata?.full_name || email.split('@')[0],
        role: 'customer',
        is_active: true,
      } as never);
      role = 'customer';
    }

    // Get active role (multi-role support)
    let activeRole: string | null = null;
    try {
      activeRole = await getActiveRoleDirect(data.user.id, supabaseWithSession);
    } catch (getActiveRoleError) {
      logger.warn('[AUTH API] getActiveRoleDirect failed, using profile role', { 
        userId: data.user.id, 
        error: getActiveRoleError instanceof Error ? getActiveRoleError.message : String(getActiveRoleError) 
      });
    }
    
    const finalRole = activeRole || role || 'customer';

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

    return NextResponse.json({
      success: true,
      redirectPath,
      userId: data.user.id,
    });
  } catch (error) {
    logger.error('[AUTH API] Unexpected error', error, { email: 'unknown' });
    
    // Return detailed error in development for debugging
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? `${error.name}: ${error.message}` : String(error))
      : 'Terjadi kesalahan, coba lagi.';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
