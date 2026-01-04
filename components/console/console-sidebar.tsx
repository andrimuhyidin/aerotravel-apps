/**
 * Console Sidebar Component
 * Main navigation sidebar for admin console with collapsible groups
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Settings,
  User,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  getMenuGroups,
  getMenuItemsForRole,
} from '@/lib/config/console-menu-config';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

type ConsoleSidebarProps = {
  locale: string;
  userRole?: UserRole | null;
  userName?: string;
  userEmail?: string;
  userAvatar?: string | null;
};

export function ConsoleSidebar({
  locale,
  userRole,
  userName = 'Admin',
  userEmail,
  userAvatar,
}: ConsoleSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get active group from URL query param
  const activeGroupId = searchParams.get('module');
  
  // Get all menu groups for user role
  const allMenuGroups = useMemo(
    () => getMenuGroups(userRole || null),
    [userRole]
  );
  
  // Filter menu groups: if activeGroupId is set, only show that group; otherwise show all
  const menuGroups = useMemo(() => {
    return activeGroupId
      ? allMenuGroups.filter((group) => group.id === activeGroupId)
      : allMenuGroups;
  }, [activeGroupId, allMenuGroups]);
  
  const menuItems = getMenuItemsForRole(locale, userRole || null);
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Initialize and update openGroups when activeGroupId or menuGroups change
  useEffect(() => {
    const updated: Record<string, boolean> = {};
    menuGroups.forEach((group, index) => {
      if (activeGroupId) {
        updated[group.id] = group.id === activeGroupId;
      } else {
        updated[group.id] = index === 0; // Open first group by default
      }
    });
    setOpenGroups(updated);
  }, [activeGroupId, menuGroups]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      // Accordion behavior: close all groups, then open the clicked one (if it was closed)
      const wasOpen = prev[groupId];
      const newState: Record<string, boolean> = {};
      menuGroups.forEach((group) => {
        newState[group.id] = false;
      });
      if (!wasOpen) {
        newState[groupId] = true;
      }
      return newState;
    });
  };

  const isActive = (href: string) => {
    // Remove locale from pathname for comparison
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    const itemPath = href.replace(`/${locale}`, '');
    
    // Exact match for dashboard
    if (itemPath === '/console') {
      return pathWithoutLocale === '/console';
    }
    
    // Check if pathname starts with item href
    return pathWithoutLocale.startsWith(itemPath);
  };

  return (
    <aside className="hidden w-64 flex-col glass-sidebar lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href={`/${locale}/console`} className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-gradient-to-br from-blue-500 to-indigo-600">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AeroConsole
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="space-y-2 p-4">
          {menuGroups.map((group, index) => {
            const items = menuItems[group.id] || [];
            if (items.length === 0) return null;

            const GroupIcon = group.icon;
            const isOpen = openGroups[group.id] ?? false;

            const isActiveGroup = activeGroupId === group.id;

            return (
              <div key={group.id}>
                {/* Separator between groups */}
                {index > 0 && <Separator className="my-2.5 opacity-40" />}
                
                <Collapsible
                  open={isOpen}
                  onOpenChange={() => toggleGroup(group.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all duration-200',
                        isOpen
                          ? 'bg-muted text-foreground border-l-2 border-blue-500'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                        isActiveGroup && 'border-l-2 border-blue-500'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          'p-1.5 rounded-md transition-colors',
                          isOpen ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'
                        )}>
                          <GroupIcon className={cn(
                            'h-3.5 w-3.5 transition-colors',
                            isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                          )} />
                        </div>
                        <span>{group.title}</span>
                      </div>
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 text-muted-foreground transition-transform duration-200',
                          isOpen && 'rotate-90 text-blue-600'
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="relative ml-[18px] pl-4 pt-1.5 pb-1 space-y-0.5 border-l border-muted-foreground/20">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                            active
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm font-medium'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground font-normal'
                          )}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className={cn(
                              'ml-auto rounded-full px-2 py-0.5 text-xs font-medium',
                              active 
                                ? 'bg-white/20 text-white' 
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Profile Section */}
      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-2 py-2.5 rounded-xl hover:bg-muted/70"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={userAvatar || undefined} alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-medium">
                  {userName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start overflow-hidden">
                <span className="text-sm font-medium truncate w-full">
                  {userName}
                </span>
                {userEmail && (
                  <span className="text-xs text-muted-foreground truncate w-full">
                    {userEmail}
                  </span>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56 mb-2">
            {/* User Info Header */}
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                {userEmail && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Account Section */}
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/profile`} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/console/settings`} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Help & Support Section */}
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/console/tickets`} className="cursor-pointer">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Help & Support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/docs`} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                Documentation
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Logout */}
            <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

/**
 * Mobile Sidebar Trigger
 */
export function ConsoleSidebarMobile({
  locale,
  userRole,
  userName = 'Admin',
  userEmail,
  userAvatar,
}: ConsoleSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get active group from URL query param
  const activeGroupId = searchParams.get('module');
  
  // Get all menu groups for user role
  const allMenuGroups = useMemo(
    () => getMenuGroups(userRole || null),
    [userRole]
  );
  
  // Filter menu groups: if activeGroupId is set, only show that group; otherwise show all
  const menuGroups = useMemo(() => {
    return activeGroupId
      ? allMenuGroups.filter((group) => group.id === activeGroupId)
      : allMenuGroups;
  }, [activeGroupId, allMenuGroups]);
  
  const menuItems = getMenuItemsForRole(locale, userRole || null);

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    const itemPath = href.replace(`/${locale}`, '');
    
    if (itemPath === '/console') {
      return pathWithoutLocale === '/console';
    }
    
    return pathWithoutLocale.startsWith(itemPath);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 glass-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6">
            <Link href={`/${locale}/console`} className="flex items-center gap-2">
              <div className="rounded-xl p-2 bg-gradient-to-br from-blue-500 to-indigo-600">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AeroConsole
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <nav className="space-y-2 p-4">
              {menuGroups.map((group, index) => {
                const items = menuItems[group.id] || [];
                if (items.length === 0) return null;

                const GroupIcon = group.icon;

                return (
                  <div key={group.id}>
                    {/* Separator between groups */}
                    {index > 0 && <Separator className="my-2.5 opacity-40" />}
                    
                    {/* Group Header */}
                    <div className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <div className="p-1.5 rounded-md bg-muted">
                        <GroupIcon className="h-3.5 w-3.5" />
                      </div>
                      <span>{group.title}</span>
                    </div>
                    
                    {/* Menu Items with left border */}
                    <div className="relative ml-[18px] pl-4 space-y-0.5 border-l border-muted-foreground/20">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                              active
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm font-medium'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground font-normal'
                            )}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User Profile with Dropdown */}
          <div className="p-4 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-2 py-2.5 rounded-xl hover:bg-muted/70"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userAvatar || undefined} alt={userName} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-medium">
                      {userName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col items-start overflow-hidden">
                    <span className="text-sm font-medium truncate w-full">
                      {userName}
                    </span>
                    {userEmail && (
                      <span className="text-xs text-muted-foreground truncate w-full">
                        {userEmail}
                      </span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56 mb-2">
                {/* User Info Header */}
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    {userEmail && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {userEmail}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Account Section */}
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/profile`} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/console/settings`} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Help & Support Section */}
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/console/tickets`} className="cursor-pointer">
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    Help & Support
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/docs`} className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    Documentation
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Logout */}
                <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

