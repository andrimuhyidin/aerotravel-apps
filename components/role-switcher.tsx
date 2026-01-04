/**
 * Role Switcher Component
 * Allows users to switch between their active roles
 */

'use client';

import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useActiveRole, useRoles, useSwitchRole } from '@/hooks/use-roles';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  investor: 'Investor',
  finance_manager: 'Finance Manager',
  marketing: 'Marketing',
  ops_admin: 'Ops Admin',
  guide: 'Guide',
  mitra: 'Mitra',
  customer: 'Customer',
  corporate: 'Corporate',
};

const roleColors: Record<UserRole, string> = {
  super_admin: 'text-red-600',
  investor: 'text-purple-600',
  finance_manager: 'text-blue-600',
  marketing: 'text-pink-600',
  ops_admin: 'text-orange-600',
  guide: 'text-emerald-600',
  mitra: 'text-cyan-600',
  customer: 'text-slate-600',
  corporate: 'text-indigo-600',
};

type RoleSwitcherProps = {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
};

export function RoleSwitcher({
  className,
  variant = 'outline',
  size = 'default',
}: RoleSwitcherProps) {
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { data: activeRoleData, isLoading: activeRoleLoading } = useActiveRole();
  const switchRole = useSwitchRole();
  const [open, setOpen] = useState(false);

  const roles = rolesData?.roles || [];
  const activeRole = activeRoleData?.activeRole;

  // Internal roles cannot switch (security & separation of duties)
  const INTERNAL_ROLES: UserRole[] = [
    'super_admin',
    'investor',
    'finance_manager',
    'marketing',
    'ops_admin',
  ];
  
  const isInternalRole = activeRole && INTERNAL_ROLES.includes(activeRole);
  
  // Debug logging (only in development)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[RoleSwitcher] Debug:', {
      rolesCount: roles.length,
      roles,
      activeRole,
      isInternalRole,
      rolesLoading,
      activeRoleLoading,
    });
  }
  
  // Filter out internal roles from available roles (non-internal users cannot switch to internal roles)
  const availableRoles = roles.filter(role => !INTERNAL_ROLES.includes(role));
  
  // Don't show if user has only one role (after filtering internal roles)
  // Don't show for internal roles (they cannot switch for security reasons)
  // Wait for loading to complete before hiding
  if (rolesLoading || activeRoleLoading) {
    // Show loading state
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    );
  }
  
  // Don't show if user has only one role (after filtering)
  if (availableRoles.length <= 1) {
    return null;
  }
  
  // Don't show for internal roles (they cannot switch for security reasons)
  if (isInternalRole) {
    return null;
  }

  const handleSwitch = (role: UserRole) => {
    if (role === activeRole) {
      setOpen(false);
      return;
    }

    switchRole.mutate(role, {
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('justify-between', className)}
          disabled={switchRole.isPending}
        >
          <span className="flex items-center gap-2">
            {activeRole && (
              <span className={cn('font-medium', roleColors[activeRole])}>
                {roleLabels[activeRole] || activeRole}
              </span>
            )}
            {!activeRole && <span>Select Role</span>}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableRoles.length === 0 ? (
          <DropdownMenuItem disabled>No roles available</DropdownMenuItem>
        ) : (
          availableRoles.map((role) => {
            const isActive = role === activeRole;
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => handleSwitch(role)}
                disabled={switchRole.isPending}
                className="flex items-center justify-between"
              >
                <span className={cn(isActive && roleColors[role])}>
                  {roleLabels[role] || role}
                </span>
                {isActive && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

