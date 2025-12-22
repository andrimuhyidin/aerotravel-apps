import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/types/supabase';
import { getActiveRole, getUserRoles } from '@/lib/session/active-role';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: unknown;
          }>
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = options as
                | Record<string, unknown>
                | undefined;
              cookieStore.set(name, value, {
                ...cookieOptions,
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              });
            });
          } catch (error) {
            console.error('[SUPABASE] Failed to set cookies:', error);
          }
        },
      },
    }
  );
}

/**
 * Get current user with profile and multi-role support
 * Optimized with caching for better performance
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Cache user data for 5 minutes to reduce database queries
  const { getCached, cacheKeys, cacheTTL } = await import('@/lib/cache/redis-cache');
  const cacheKey = `user:${user.id}:full`;
  
  const cachedUser = await getCached(
    cacheKey,
    300, // 5 minutes TTL
    async () => {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      const profile = profileData as
        | Database['public']['Tables']['users']['Row']
        | null;

      // Get active role (server-side session)
      const activeRole = await getActiveRole(user.id);

      // Get all user roles
      const roles = await getUserRoles(user.id);

      return {
        profile,
        activeRole,
        roles,
      };
    }
  );

  return {
    ...user,
    profile: cachedUser.profile,
    activeRole: cachedUser.activeRole,
    roles: cachedUser.roles,
  };
}

/**
 * Check if user has required role
 * Supports both active role and all roles
 */
export async function hasRole(
  requiredRoles: Database['public']['Enums']['user_role'][]
) {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Check active role first
  if (user.activeRole && requiredRoles.includes(user.activeRole)) {
    return true;
  }
  
  // Check all roles
  if (user.roles && user.roles.some((role) => requiredRoles.includes(role))) {
    return true;
  }
  
  // Fallback: check profile.role for backward compatibility
  if (user.profile?.role && requiredRoles.includes(user.profile.role)) {
    return true;
  }
  
  return false;
}
