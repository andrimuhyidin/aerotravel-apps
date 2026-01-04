/**
 * Command Palette Client Component
 * Wrapper for client-side command palette
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { CommandPalette } from './command-palette';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

type CommandPaletteClientProps = {
  locale: string;
  userRole: UserRole | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CommandPaletteClient({
  locale,
  userRole,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CommandPaletteClientProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (isControlled && controlledOnOpenChange) {
      controlledOnOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  }, [isControlled, controlledOnOpenChange]);

  // Handle keyboard shortcut
  useEffect(() => {
    if (isControlled) return; // Skip if controlled

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setInternalOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isControlled]);

  return (
    <CommandPalette
      locale={locale}
      userRole={userRole}
      open={open}
      onOpenChange={handleOpenChange}
    />
  );
}

