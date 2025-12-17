'use client';

import { useEffect, useState } from 'react';

import {
  canApproveAmount,
  formatApprovalLimit,
  getApprovalLimit,
  getPermissions,
  hasPermission,
} from '@/lib/auth/authority-matrix';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

export function usePermissions() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const userData = data as { role: string } | null;
        if (userData) {
          setRole(userData.role as UserRole);
        }
      }
      setLoading(false);
    }

    fetchRole();
  }, []);

  return {
    role,
    loading,
    hasPermission: (permission: string) =>
      role ? hasPermission(role, permission) : false,
    canApprove: (amount: number) =>
      role ? canApproveAmount(role, amount) : false,
    permissions: role ? getPermissions(role) : [],
    approvalLimit: role ? getApprovalLimit(role) : 0,
    approvalLimitFormatted: role ? formatApprovalLimit(role) : 'N/A',
  };
}
