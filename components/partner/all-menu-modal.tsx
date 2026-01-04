/**
 * All Menu Modal - Superapp Drawer Style
 * Bottom Sheet Drawer dengan grid menu yang rapi (Gojek/Tokopedia style)
 * 
 * HANYA MENAMPILKAN LAYANAN (Operasional, Finansial, Analytics)
 * TIDAK MENAMPILKAN Account/Profile items (Program, Komunikasi, Dukungan, Akun, Legal)
 * 
 * Refactored to use central config from lib/config/partner-menu-config.ts
 */

'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';

// Import from central config
import {
  searchSuperAppMenuItems,
  getSuperAppMenuItems,
  PARTNER_MENU_CATEGORIES,
} from '@/lib/config/partner-menu-config';

type AllMenuModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AllMenuModal({ open, onOpenChange }: AllMenuModalProps) {
  const params = useParams();
  const locale = params.locale as string;
  const [searchQuery, setSearchQuery] = useState('');

  // Use central config with search - ONLY LAYANAN items
  const filteredItems = searchQuery 
    ? searchSuperAppMenuItems(searchQuery, locale)
    : null;

  const allItemsByCategory = getSuperAppMenuItems(locale); // ONLY LAYANAN

  // Group filtered items by category if search is active
  const filteredByCategory = filteredItems 
    ? filteredItems.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category]!.push(item);
        return acc;
      }, {} as Record<string, typeof filteredItems>)
    : allItemsByCategory;

  const displayCategories = Object.entries(PARTNER_MENU_CATEGORIES)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .filter(([categoryId]) => {
      const items = filteredByCategory[categoryId];
      return items && items.length > 0;
    });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] max-w-md mx-auto flex flex-col">
        <div className="mx-auto w-full max-w-md flex flex-col h-full overflow-hidden">
          {/* Header & Search */}
          <div className="flex-none sticky top-0 z-10 bg-background pb-2 pt-2">
            <DrawerHeader className="pb-2 pt-0 text-left">
              <DrawerTitle className="text-lg font-bold">Semua Menu</DrawerTitle>
            </DrawerHeader>

            <div className="px-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-xl bg-muted/50 pl-10 focus-visible:bg-background focus-visible:ring-primary/20"
                />
              </div>
            </div>
            {/* Divider shadow */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
          </div>

          {/* Menu Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
            {displayCategories.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
                <Search className="mb-2 h-8 w-8 opacity-20" />
                <p className="text-sm">Menu tidak ditemukan</p>
              </div>
            ) : (
              <div className="space-y-6">
                {displayCategories.map(([categoryId, category]) => {
                  const items = filteredByCategory[categoryId] || [];
                  return (
                    <div key={categoryId}>
                      <h3 className="mb-3 pl-1 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                        {category.title}
                      </h3>
                      <div className="grid grid-cols-4 sm:grid-cols-4 gap-y-4 gap-x-2">
                        {items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => onOpenChange(false)}
                              className="group flex flex-col items-center gap-2"
                            >
                              {/* Icon Circle */}
                              <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground transition-all duration-200 group-hover:scale-105 group-hover:bg-primary/5 group-hover:text-primary active:scale-95 active:bg-primary/10">
                                <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
                                {item.badge && (
                                  <span className="absolute -right-1 -top-1 z-10 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-background">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              
                              {/* Label */}
                              <span className="max-w-[80px] text-center text-[10px] sm:text-[11px] font-medium leading-tight text-foreground group-hover:text-primary line-clamp-2">
                                {item.label}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
