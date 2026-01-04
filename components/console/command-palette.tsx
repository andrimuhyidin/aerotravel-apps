/**
 * Command Palette Component
 * Cmd+K quick navigation and actions
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  FileText,
  Package,
  Users,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  getAllMenuItemsForRole,
  type ConsoleMenuItem,
} from '@/lib/config/console-menu-config';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

type CommandPaletteProps = {
  locale: string;
  userRole: UserRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({
  locale,
  userRole,
  open,
  onOpenChange,
}: CommandPaletteProps) {
  const router = useRouter();
  const menuItems = getAllMenuItemsForRole(locale, userRole);

  // Group menu items by category
  const groupedItems = menuItems.reduce(
    (acc, item) => {
      const group = item.group.title;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    },
    {} as Record<string, ConsoleMenuItem[]>
  );

  const handleSelect = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {Object.entries(groupedItems).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item.href)}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                  {item.description && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleSelect(`/${locale}/console/bookings/new`)}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>New Booking</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(`/${locale}/console/products/new`)}>
            <Package className="mr-2 h-4 w-4" />
            <span>New Package</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(`/${locale}/console/users/new`)}>
            <Users className="mr-2 h-4 w-4" />
            <span>New User</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(`/${locale}/console/reports`)}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Generate Report</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Hook to use command palette with keyboard shortcut
 */
export function useCommandPalette(locale: string, userRole: UserRole | null = null) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return {
    open,
    setOpen,
    CommandPalette: () => (
      <CommandPalette
        locale={locale}
        userRole={userRole}
        open={open}
        onOpenChange={setOpen}
      />
    ),
  };
}

