/**
 * Supabase Server Client
 * NOTE: Cannot use 'server-only' because this is imported by:
 * - proxy.ts (middleware, Edge Runtime)
 * - lib/session/active-role.ts (used by middleware)
 * The cookies() call will fail at runtime if called from client, which is safe.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/types/supabase';
import { getActiveRole, getUserRoles } from '@/lib/session/active-role';
// PERFORMANCE: Static import instead of dynamic import
import { getCached } from '@/lib/cache/redis-cache';

/**
 * Create admin client with service role key
 * Use only for webhooks, cron jobs, and admin operations
 * WARNING: Bypasses RLS policies
 */
export async function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

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
 * 
 * PERFORMANCE OPTIMIZED:
 * - Static import for redis-cache (no dynamic import latency)
 * - Parallel fetching of profile, activeRole, and roles
 * - Redis caching with 5 minute TTL
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Cache user data for 5 minutes to reduce database queries
  const cacheKey = `user:${user.id}:full`;
  
  const cachedUser = await getCached(
    cacheKey,
    300, // 5 minutes TTL
    async () => {
      // PERFORMANCE: Parallel fetching instead of sequential
      const [profileResult, activeRole, roles] = await Promise.all([
        supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single(),
        getActiveRole(user.id),
        getUserRoles(user.id),
      ]);

      const profile = profileResult.data as
        | Database['public']['Tables']['users']['Row']
        | null;

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
