/**
 * Header Actions Client Component
 * Contains command palette trigger, chat, notifications and other header actions
 * 
 * PERFORMANCE OPTIMIZED:
 * - Dynamic import for CommandPaletteClient (heavy component)
 * - Only loads when user opens the palette
 */

'use client';

import dynamic from 'next/dynamic';
import { useState, Suspense } from 'react';
import { Command, Search, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ChatTrigger } from './chat-trigger';
import { NotificationsDropdown } from './notifications-dropdown';
import { RoleSwitcher } from '@/components/role-switcher';
import type { Database } from '@/types/supabase';

// PERFORMANCE: Lazy load CommandPaletteClient (heavy component with many dependencies)
const CommandPaletteClient = dynamic(
  () => import('./command-palette-client').then((m) => ({ default: m.CommandPaletteClient })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

type UserRole = Database['public']['Enums']['user_role'];

type HeaderActionsProps = {
  locale: string;
  userRole?: UserRole | null;
};

export function HeaderActions({ locale, userRole }: HeaderActionsProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Command Palette Trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={() => setCommandPaletteOpen(true)}
          title="Command Palette (Cmd+K)"
        >
          <Command className="h-5 w-5" />
          <span className="sr-only">Command palette</span>
        </Button>
        {/* Search */}
        <div className="hidden lg:flex lg:items-center lg:gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Chat */}
        <ChatTrigger locale={locale} />
        {/* Notifications */}
        <NotificationsDropdown locale={locale} />
        {/* Role Switcher */}
        <RoleSwitcher size="sm" variant="outline" />
      </div>
      {/* Command Palette - Lazy loaded */}
      {commandPaletteOpen && (
        <Suspense fallback={null}>
          <CommandPaletteClient
            locale={locale}
            userRole={userRole || null}
            open={commandPaletteOpen}
            onOpenChange={setCommandPaletteOpen}
          />
        </Suspense>
      )}
    </>
  );
}

