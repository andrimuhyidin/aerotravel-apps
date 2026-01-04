/**
 * Active Role Session Management
 * Server-side session storage for active role (NOT cookie-based)
 * 
 * CRITICAL: Never store active role in cookie for security reasons
 * Use Supabase session metadata or server-side storage
 * 
 * PERFORMANCE OPTIMIZED:
 * - Prioritizes user_metadata (no DB call)
 * - Single DB query fallback
 * - Removed redundant role verification on read
 * - In-memory request cache to prevent duplicate calls
 * 
 * NOTE: Cannot use 'server-only' here because proxy.ts (middleware) imports this file
 * and middleware runs in Edge Runtime, not Server Components context.
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

// ============================================
// REQUEST-SCOPED CACHE (prevents duplicate DB calls in same request)
// Uses Map for Edge Runtime compatibility (async_hooks not available in Edge)
// ============================================
let requestCacheStore: Map<string, unknown> | null = null;

/**
 * Run function with request-scoped cache
 * Use in middleware/proxy to enable caching for the entire request
 * Note: Simplified for Edge Runtime compatibility (no AsyncLocalStorage)
 */
export function withRequestCache<T>(fn: () => Promise<T>): Promise<T> {
  requestCacheStore = new Map();
  return fn().finally(() => {
    requestCacheStore = null;
  });
}

/**
 * Get active role for user (with request-level caching)
 * 
 * PERFORMANCE: Optimized query order
 * 1. Check request cache (0ms)
 * 2. user_metadata.active_role (0ms - already in JWT)
 * 3. user_metadata.role (0ms - already in JWT)
 * 4. Database fallback - single query (100-200ms)
 */
export async function getActiveRole(userId: string): Promise<UserRole | null> {
  // Check request-scoped cache first
  const cache = requestCacheStore;
  const cacheKey = `activeRole:${userId}`;
  
  if (cache?.has(cacheKey)) {
    return cache.get(cacheKey) as UserRole | null;
  }
  
  try {
    const supabase = await createClient();
    
    // Get user from session (this is fast - data is in JWT)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && user.id === userId) {
      // Priority 1: active_role from session metadata (set when switching roles)
      // This is trusted because it was set by our setActiveRole() function
      const sessionActiveRole = user.user_metadata?.active_role as UserRole | undefined;
      if (sessionActiveRole) {
        logger.debug('Active role from session metadata', { userId, role: sessionActiveRole });
        cache?.set(cacheKey, sessionActiveRole);
        return sessionActiveRole;
      }
      
      // Priority 2: role from user_metadata (set at registration)
      const metadataRole = user.user_metadata?.role as UserRole | undefined;
      if (metadataRole) {
        logger.debug('Active role from user_metadata.role', { userId, role: metadataRole });
        cache?.set(cacheKey, metadataRole);
        return metadataRole;
      }
    }
    
    // Priority 3: Database fallback - single optimized query
    // Only reached if user_metadata doesn't have role info
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('is_primary', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (roleData?.role) {
      logger.debug('Active role from database', { userId, role: roleData.role });
      const role = roleData.role as UserRole;
      cache?.set(cacheKey, role);
      return role;
    }
    
    logger.warn('No role found for user', { userId });
    cache?.set(cacheKey, null);
    return null;
  } catch (error) {
    logger.error('Failed to get active role', error, { userId });
    return null;
  }
}

/**
 * Set active role for user
 * Store in Supabase session metadata (server-side, NOT cookie)
 */
export async function setActiveRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Verify user actually has this role
    const hasRoleVerified = await verifyUserHasRole(userId, role);
    if (!hasRoleVerified) {
      logger.warn('User does not have role', { userId, role });
      return false;
    }
    
    // Update Supabase user metadata (stored in JWT, server-side)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Update user metadata via Supabase
    const { error } = await supabase.auth.updateUser({
      data: {
        active_role: role,
        active_role_updated_at: new Date().toISOString(),
      },
    });
    
    if (error) {
      logger.error('Failed to set active role', error, { userId, role });
      return false;
    }
    
    logger.info('Active role set', { userId, role });
    return true;
  } catch (error) {
    logger.error('Failed to set active role', error, { userId, role });
    return false;
  }
}

/**
 * Get primary role for user (OPTIMIZED - single query)
 * @deprecated Use getActiveRole() instead which prioritizes user_metadata
 */
async function getPrimaryRole(userId: string): Promise<UserRole | null> {
  try {
    const supabase = await createClient();
    
    // Single optimized query - get primary or first active role
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('is_primary', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data?.role) {
      logger.debug('Primary role found', { userId, role: data.role });
      return data.role as UserRole;
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to get primary role', error, { userId });
    return null;
  }
}

/**
 * Verify user has role
 */
export async function verifyUserHasRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Query user_roles table directly
    const roleResult = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', role)
      .eq('status', 'active')
      .maybeSingle();
    
    // If found in user_roles, user has the role
    if (!roleResult.error && roleResult.data) {
      return true;
    }
    
    // Fallback: check user_metadata.role (avoids RLS issues)
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      return user.user_metadata?.role === role;
    }
    
    return false;
  } catch (error) {
    logger.error('Failed to verify user role', error, { userId, role });
    // On error, fallback to checking user_metadata.role (avoids RLS issues)
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === userId) {
        return user.user_metadata?.role === role;
      }
      return false;
    } catch {
      return false;
    }
  }
}

/**
 * Get all active roles for user (OPTIMIZED with request cache)
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  // Check request-scoped cache first
  const cache = requestCacheStore;
  const cacheKey = `userRoles:${userId}`;
  
  if (cache?.has(cacheKey)) {
    return cache.get(cacheKey) as UserRole[];
  }
  
  try {
    const supabase = await createClient();
    
    // Get user from session first (fast - from JWT)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Query user_roles table
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
    
    if (rolesData && rolesData.length > 0) {
      const roles = rolesData.map((r) => r.role as UserRole);
      cache?.set(cacheKey, roles);
      return roles;
    }
    
    // Fallback: return user_metadata.role (avoids RLS issues)
    if (user && user.id === userId && user.user_metadata?.role) {
      const roles = [user.user_metadata.role as UserRole];
      cache?.set(cacheKey, roles);
      return roles;
    }
    
    cache?.set(cacheKey, []);
    return [];
  } catch (error) {
    logger.error('Failed to get user roles', error, { userId });
    
    // On error, fallback to user_metadata.role
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === userId && user.user_metadata?.role) {
        return [user.user_metadata.role as UserRole];
      }
      return [];
    } catch {
      return [];
    }
  }
}

/**
 * Check if current user has any of the specified roles
 * @param allowedRoles - Array of roles to check
 * @returns true if user has any of the allowed roles
 */
export async function hasRole(allowedRoles: UserRole[]): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    // Get active role
    const activeRole = await getActiveRole(user.id);
    if (!activeRole) {
      return false;
    }
    
    // Check if active role is in allowed roles
    return allowedRoles.includes(activeRole);
  } catch (error) {
    logger.error('Failed to check user role', error);
    return false;
  }
}
