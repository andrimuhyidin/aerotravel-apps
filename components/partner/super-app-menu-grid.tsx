'use client';

/**
 * Partner Super App Menu Grid
 * Categorized menu grid untuk dashboard dengan icon-based navigation
 * Maksimal 2 baris (8 items), item terakhir "Lainnya" untuk menu lengkap
 * Match Superapp pattern (Gojek, Traveloka, Grab)
 * 
 * Refactored to use central config from lib/config/partner-menu-config.ts
 */

import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// Import from central config
import {
  getDashboardMenuItems,
  getSuperAppMenuItems,
  PARTNER_MENU_CATEGORIES,
} from '@/lib/config/partner-menu-config';

type SuperAppMenuGridProps = {
  locale: string;
};

export function SuperAppMenuGrid({ locale }: SuperAppMenuGridProps) {
  const [showAllMenus, setShowAllMenus] = useState(false);

  // Get dashboard items from central config (top 7 items)
  const dashboardItems = useMemo(() => getDashboardMenuItems(locale), [locale]);
  
  // Get LAYANAN items only for Super App Menu (no Account/Profile items)
  const allItemsByCategory = useMemo(() => getSuperAppMenuItems(locale), [locale]);

  return (
    <>
      <Card className="border-0 shadow-md">
        <CardContent className="p-3">
          {/* Menu Grid - Maksimal 2 baris (8 items: 4x2) */}
          <div className="grid grid-cols-4 gap-2">
            {/* 7 Menu Items from central config */}
            {dashboardItems.map((item) => {
              const IconComponent = item.icon;
              const category = PARTNER_MENU_CATEGORIES[item.category];

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex flex-col items-center gap-1 rounded-lg p-1.5 transition-all hover:bg-slate-50 active:scale-95"
                  aria-label={item.label}
                >
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-active:scale-110',
                      category.bgColor
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <p className="text-center text-[10px] font-medium text-slate-900 leading-tight line-clamp-2 min-h-[26px] flex items-center justify-center">
                    {item.label}
                  </p>
                </Link>
              );
            })}

            {/* Item ke-8: Lainnya */}
            <button
              onClick={() => setShowAllMenus(true)}
              className="group flex flex-col items-center gap-1 rounded-lg p-1.5 transition-all hover:bg-slate-50 active:scale-95"
              aria-label="Lainnya"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-slate-600 shadow-sm transition-transform group-active:scale-110">
                <MoreHorizontal className="h-5 w-5" />
              </div>
              <p className="text-center text-[10px] font-medium text-slate-900 leading-tight line-clamp-2 min-h-[26px] flex items-center justify-center">
                Lainnya
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Sheet untuk Menu Lengkap */}
      <Sheet open={showAllMenus} onOpenChange={setShowAllMenus}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-10 max-h-[80vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Semua Menu</SheetTitle>
            <SheetDescription>Pilih menu yang ingin Anda akses</SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {Object.entries(PARTNER_MENU_CATEGORIES)
              .sort(([, a], [, b]) => a.priority - b.priority)
              .map(([categoryId, category]) => {
                const items = allItemsByCategory[categoryId] || [];
                if (items.length === 0) return null;

                const CategoryIcon = category.icon;
                return (
                  <div key={categoryId}>
                    <div className="mb-3 flex items-center gap-2">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', category.bgColor)}>
                        <CategoryIcon className="h-4 w-4 text-white" />
                      </div>
                      <h3 className={cn('text-sm font-bold', category.textColor)}>
                        {category.title}
                      </h3>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {items.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setShowAllMenus(false)}
                            className="group flex flex-col items-center gap-1.5 rounded-lg p-2 transition-all hover:bg-slate-50 active:scale-95"
                            aria-label={item.label}
                          >
                            <div
                              className={cn(
                                'relative flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-active:scale-110',
                                category.bgColor
                              )}
                            >
                              <IconComponent className="h-5 w-5" />
                              {item.badge && (
                                <span className="absolute -right-1 -top-1 rounded-md bg-green-500 px-1.5 py-0.5 text-[9px] font-bold text-white ring-1 ring-background">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-center text-[10px] font-medium text-slate-900 leading-tight line-clamp-2 min-h-[28px]">
                              {item.label}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

