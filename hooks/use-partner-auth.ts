/**
 * Partner Auth Hook
 * Client-side hook untuk get partner authentication context
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export type PartnerAuthData = {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role?: string;
  branchId?: string;
};

export function usePartnerAuth() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['partner-auth'],
    queryFn: async (): Promise<PartnerAuthData> => {
      // Try to get from Supabase client first (faster)
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Unauthorized');
      }

      // Try to get profile from database
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('id, email, full_name, phone, role, branch_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          return {
            id: profile.id,
            email: profile.email || user.email || '',
            fullName: profile.full_name || undefined,
            phone: profile.phone || undefined,
            role: profile.role || undefined,
            branchId: profile.branch_id || undefined,
          };
        }
      } catch (profileError) {
        logger.warn('Failed to fetch profile from database, using auth user', profileError);
      }

      // Fallback to auth user only
      return {
        id: user.id,
        email: user.email || '',
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return {
    partner: data,
    isLoading,
    error,
    refetch,
    partnerId: data?.id,
  };
}

