/**
 * Partner Auth Utility
 * Server-side utility untuk get partner authentication context
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type PartnerAuthData = {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role?: string;
  branchId?: string;
};

/**
 * Get current partner auth data (server-side)
 */
export async function getPartnerAuth(): Promise<PartnerAuthData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  try {
    const client = supabase as unknown as any;
    const { data: profile, error: profileError } = await client
      .from('users')
      .select('id, email, full_name, phone, role, branch_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.warn('Failed to fetch partner profile', {
        userId: user.id,
        error: profileError instanceof Error ? profileError.message : String(profileError),
      });
      // Fallback to auth user only
      return {
        id: user.id,
        email: user.email || '',
      };
    }

    return {
      id: profile.id,
      email: profile.email || user.email || '',
      fullName: profile.full_name || undefined,
      phone: profile.phone || undefined,
      role: profile.role || undefined,
      branchId: profile.branch_id || undefined,
    };
  } catch (error) {
    logger.error('Failed to get partner auth', error, { userId: user.id });
    // Fallback to auth user only
    return {
      id: user.id,
      email: user.email || '',
    };
  }
}

