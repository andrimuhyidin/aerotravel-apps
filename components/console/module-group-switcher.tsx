/**
 * Module Group Switcher Component
 * Allows users to switch between menu module groups (similar to ERPNext/Odoo)
 */

'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  getAvailableGroupsForRole,
  shouldShowGroupSwitcher,
} from '@/lib/config/console-menu-config';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

type ModuleGroupSwitcherProps = {
  locale: string;
  userRole: UserRole | null;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
};

export function ModuleGroupSwitcher({
  locale,
  userRole,
  className,
  variant = 'outline',
  size = 'default',
}: ModuleGroupSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  // Check if switcher should be shown
  if (!shouldShowGroupSwitcher(userRole)) {
    return null;
  }

  const availableGroups = getAvailableGroupsForRole(userRole);
  const activeModule = searchParams.get('module');
  const activeGroup = availableGroups.find((g) => g.id === activeModule) || availableGroups[0];

  const handleGroupChange = (groupId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (groupId === availableGroups[0]?.id) {
      // If selecting first group (default), remove module param
      params.delete('module');
    } else {
      params.set('module', groupId);
    }

    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    
    router.push(newUrl);
    setOpen(false);
  };

  if (!activeGroup) {
    return null;
  }

  const GroupIcon = activeGroup.icon;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('justify-between', className)}
        >
          <span className="flex items-center gap-2">
            <GroupIcon className="h-4 w-4" />
            <span className="font-medium">{activeGroup.title}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch Module</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableGroups.length === 0 ? (
          <DropdownMenuItem disabled>No modules available</DropdownMenuItem>
        ) : (
          availableGroups.map((group) => {
            const isActive = group.id === activeGroup.id;
            const ItemIcon = group.icon;

            return (
              <DropdownMenuItem
                key={group.id}
                onClick={() => handleGroupChange(group.id)}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <ItemIcon className="h-4 w-4" />
                  <span>{group.title}</span>
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

