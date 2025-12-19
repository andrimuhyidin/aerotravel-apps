/**
 * React Hooks for Multi-Role System
 * useRoles, useActiveRole, useSwitchRole
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import queryKeys from '@/lib/queries/query-keys';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

type UserRoleDetail = {
  role: UserRole;
  status: string;
  is_primary: boolean;
  applied_at: string;
  approved_at: string | null;
};

type RolesResponse = {
  roles: UserRole[];
  userRoles: UserRoleDetail[];
};

type ActiveRoleResponse = {
  activeRole: UserRole | null;
};

type SwitchRoleResponse = {
  success: boolean;
  activeRole: UserRole;
  previousRole: UserRole | null;
};

/**
 * Hook to get all user roles
 */
export function useRoles() {
  return useQuery<RolesResponse>({
    queryKey: queryKeys.user.roles(),
    queryFn: async () => {
      const res = await fetch('/api/user/roles');
      if (!res.ok) {
        throw new Error('Failed to fetch roles');
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get current active role
 */
export function useActiveRole() {
  return useQuery<ActiveRoleResponse>({
    queryKey: queryKeys.user.activeRole(),
    queryFn: async () => {
      const res = await fetch('/api/user/roles/active');
      if (!res.ok) {
        throw new Error('Failed to fetch active role');
      }
      return res.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to switch active role
 */
export function useSwitchRole() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<SwitchRoleResponse, Error, UserRole>({
    mutationFn: async (role: UserRole) => {
      const res = await fetch('/api/user/roles/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to switch role');
      }

      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.user.activeRole() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.roles() });
      
      // Invalidate user query if exists
      queryClient.invalidateQueries({ queryKey: ['user'] });

      toast.success(`Switched to ${data.activeRole} role`);
      
      // Redirect to appropriate page based on new role
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

      const redirectPath = roleRedirectMap[data.activeRole] || '/id';
      
      // Redirect to new role's home page
      router.push(redirectPath);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to switch role');
    },
  });
}

/**
 * Hook to apply for new role
 */
export function useApplyRole() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; application: unknown; autoApproved: boolean },
    Error,
    { role: UserRole; message?: string }
  >({
    mutationFn: async ({ role, message }) => {
      const res = await fetch('/api/user/roles/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, message }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to apply for role');
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.roles() });
      
      if (data.autoApproved) {
        toast.success('Role application approved automatically');
      } else {
        toast.success('Role application submitted successfully');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to apply for role');
    },
  });
}

/**
 * Hook to get role applications
 */
export function useRoleApplications() {
  return useQuery<{ applications: unknown[] }>({
    queryKey: queryKeys.user.roleApplications(),
    queryFn: async () => {
      const res = await fetch('/api/user/roles/apply');
      if (!res.ok) {
        throw new Error('Failed to fetch applications');
      }
      return res.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

