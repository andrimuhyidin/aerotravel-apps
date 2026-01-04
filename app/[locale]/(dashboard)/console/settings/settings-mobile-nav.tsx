/**
 * Settings Mobile Navigation
 * Bottom sheet navigation for mobile devices
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SETTINGS_CATEGORIES } from '@/components/admin/settings/settings-sidebar';
import { cn } from '@/lib/utils';

type SettingsMobileNavProps = {
  locale: string;
};

export function SettingsMobileNav({ locale }: SettingsMobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;
    if (href === '/console/settings') {
      return pathname === fullPath;
    }
    return pathname.startsWith(fullPath);
  };

  // Find current category
  const currentCategory = SETTINGS_CATEGORIES.find((cat) => isActive(cat.href));

  return (
    <div className="lg:hidden border-b bg-background sticky top-0 z-10">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between h-14 rounded-none px-4"
          >
            <div className="flex items-center gap-2">
              {currentCategory && (
                <>
                  <currentCategory.icon className="h-4 w-4" />
                  <span className="font-medium">{currentCategory.label}</span>
                </>
              )}
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-1">
            {SETTINGS_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const active = isActive(category.href);

              return (
                <Link
                  key={category.id}
                  href={`/${locale}${category.href}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-start gap-3 rounded-lg p-3 transition-all',
                    'hover:bg-muted/80',
                    active && 'bg-primary/10 text-primary'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 mt-0.5 shrink-0',
                      active ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        active && 'text-primary'
                      )}
                    >
                      {category.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

