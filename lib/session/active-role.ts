/**
 * Active Role Session Management
 * Server-side session storage for active role (NOT cookie-based)
 * 
 * CRITICAL: Never store active role in cookie for security reasons
 * Use Supabase session metadata or server-side storage
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

/**
 * Get active role for user
 * Priority:
 * 1. Server-side session: active_role (set saat switch role)
 * 2. Primary role dari user_roles
 * 3. Fallback: users.role (backward compatibility)
 */
export async function getActiveRole(userId: string): Promise<UserRole | null> {
  try {
    const supabase = await createClient();
    
    // Try to get from Supabase session metadata first
    // Supabase stores session in JWT, we can use user metadata
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== userId) {
      logger.warn('User not found or ID mismatch in getActiveRole', { 
        userId, 
        userExists: !!user,
        userAuthId: user?.id 
      });
      return null;
    }
    
    // Check session metadata for active role (set when user switches role)
    const sessionActiveRole = user.user_metadata?.active_role as UserRole | undefined;
    
    if (sessionActiveRole) {
      // Verify user actually has this role
      const hasRole = await verifyUserHasRole(userId, sessionActiveRole);
      if (hasRole) {
        logger.info('Active role from session metadata', { userId, role: sessionActiveRole });
        return sessionActiveRole;
      } else {
        logger.warn('Session active role not verified', { userId, role: sessionActiveRole });
      }
    }
    
    // Get primary role from user_roles table (multi-role system)
    const primaryRole = await getPrimaryRole(userId);
    if (primaryRole) {
      logger.info('Active role from primary role', { userId, role: primaryRole });
      return primaryRole;
    }
    
    // Fallback to users.role (backward compatibility for users not yet migrated)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    const fallbackRole = (userData?.role as UserRole) || null;
    if (fallbackRole) {
      logger.info('Active role from users.role (fallback)', { userId, role: fallbackRole });
    } else {
      logger.warn('No role found for user', { userId });
    }
    
    return fallbackRole;
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
    const hasRole = await verifyUserHasRole(userId, role);
    if (!hasRole) {
      logger.warn('User does not have role', { userId, role });
      return false;
    }
    
    // Update Supabase user metadata (stored in JWT, server-side)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Update user metadata via Supabase Admin API or direct update
    // Note: This requires service role or admin access
    // For now, we'll use a workaround with user metadata
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
 * Get primary role for user
 */
async function getPrimaryRole(userId: string): Promise<UserRole | null> {
  try {
    const supabase = await createClient();
    
    // Query user_roles table for primary active role
    const { data: primaryData, error: primaryError } = await (supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('is_primary', true)
      .maybeSingle() as unknown as Promise<{
        data: { role: UserRole } | null;
        error: Error | null;
      }>);
    
    if (!primaryError && primaryData) {
      logger.info('Primary role found', { userId, role: primaryData.role });
      return primaryData.role as UserRole;
    }
    
    // If no primary role found, try to get any active role (first one)
    const { data: anyRoleData, error: anyRoleError } = await (supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle() as unknown as Promise<{
        data: { role: UserRole } | null;
        error: Error | null;
      }>);
    
    if (!anyRoleError && anyRoleData) {
      logger.info('Active role found (no primary)', { userId, role: anyRoleData.role });
      return anyRoleData.role as UserRole;
    }
    
    logger.info('No role found in user_roles table', { userId });
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
    
    // Type assertion needed until types are regenerated after migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: unknown) => {
            eq: (column: string, value: unknown) => {
              eq: (column: string, value: unknown) => {
                single: () => Promise<{
                  data: { id: string } | null;
                  error: Error | null;
                }>;
              };
            };
          };
        };
      };
    })
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', role)
      .eq('status', 'active')
      .single();
    
    if (error || !data) {
      // Fallback: check users.role for backward compatibility
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      return userData?.role === role;
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to verify user role', error, { userId, role });
    return false;
  }
}

/**
 * Get all active roles for user
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  try {
    const supabase = await createClient();
    
    // Type assertion needed until types are regenerated after migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: unknown) => {
            eq: (column: string, value: unknown) => {
              order: (column: string, options: { ascending: boolean }) => {
                order: (column: string, options: { ascending: boolean }) => Promise<{
                  data: Array<{ role: UserRole }> | null;
                  error: Error | null;
                }>;
              };
            };
          };
        };
      };
    })
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
    
    if (error || !data) {
      // Fallback: return users.role for backward compatibility
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      return userData?.role ? [userData.role as UserRole] : [];
    }
    
    return data.map((r: { role: UserRole }) => r.role as UserRole);
  } catch (error) {
    logger.error('Failed to get user roles', error, { userId });
    return [];
  }
}

