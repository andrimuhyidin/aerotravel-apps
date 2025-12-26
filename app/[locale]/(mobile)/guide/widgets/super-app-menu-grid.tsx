'use client';

/**
 * Super App Menu Grid
 * Menu grid ala super app - 2 baris (8 items) + "Lainnya" button yang buka sheet dengan semua menu
 */

import {
    Award,
    BarChart3,
    BookOpen,
    Calendar,
    ClipboardList,
    Coins,
    CreditCard,
    FileText,
    Gift,
    GraduationCap,
    HelpCircle,
    Info,
    MapPin,
    Megaphone,
    MoreHorizontal,
    Settings,
    Shield,
    Star,
    User,
    Users,
    Wallet
} from 'lucide-react';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useGuideMenuItems } from '@/hooks/use-guide-common';
import { cn } from '@/lib/utils';

type SuperAppMenuGridProps = {
  locale: string;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  User: User,
  Star: Star,
  BarChart3: BarChart3,
  Megaphone: Megaphone,
  FileText: FileText,
  Settings: Settings,
  Shield: Shield,
  HelpCircle: HelpCircle,
  Info: Info,
  Wallet: Wallet,
  GraduationCap: GraduationCap,
  Award: Award,
  Calendar: Calendar,
  ClipboardList: ClipboardList,
  MapPin: MapPin,
  BookOpen: BookOpen,
  Users: Users,
  CreditCard: CreditCard,
  Gift: Gift,
  Coins: Coins,
};

// Filter: Menu yang TIDAK seharusnya ada di Super App Menu
// (Menu seperti Edit Profile, Settings, Preferences seharusnya ada di Profile page)
const isSuperAppMenuEligible = (href: string): boolean => {
  // Exclude profile/settings menus (should be in Profile page)
  // Exclude manifest (now integrated in trip detail)
  const excludedPatterns = [
    '/guide/profile/edit',
    '/guide/profile/password',
    '/guide/settings',
    '/guide/preferences',
    '/guide/documents',
    '/guide/id-card',
    '/guide/ratings',
    '/guide/manifest', // Manifest sekarang ada di trip detail
    '/legal/privacy',
    '/legal/terms',
    '/help', // Help bisa tetap, tapi lebih tepat di Support section atau Settings
  ];

  return !excludedPatterns.some((pattern) => href.includes(pattern));
};

// Category mapping untuk mengelompokkan menu items
const getCategoryForHref = (href: string): string => {
  if (href.includes('/attendance') || href.includes('/trips') || href.includes('/status') || href.includes('/insights') || href.includes('/crew')) {
    return 'operasional';
  }
  if (href.includes('/wallet') || href.includes('/earnings') || href.includes('/rewards')) {
    return 'finansial';
  }
  if (href.includes('/training') || href.includes('/certifications') || href.includes('/learning')) {
    return 'pengembangan';
  }
  if (href.includes('/sos') || href.includes('/notifications')) {
    return 'dukungan';
  }
  return 'lainnya';
};

const categoryConfig = {
  operasional: {
    title: 'Operasional',
    icon: ClipboardList,
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-700',
  },
  finansial: {
    title: 'Finansial',
    icon: Wallet,
    bgColor: 'bg-emerald-500',
    textColor: 'text-emerald-700',
  },
  pengembangan: {
    title: 'Pengembangan',
    icon: GraduationCap,
    bgColor: 'bg-purple-500',
    textColor: 'text-purple-700',
  },
  dukungan: {
    title: 'Dukungan',
    icon: HelpCircle,
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-700',
  },
  lainnya: {
    title: 'Lainnya',
    icon: Settings,
    bgColor: 'bg-slate-500',
    textColor: 'text-slate-700',
  },
};

type MenuItem = {
  href: string;
  label: string;
  icon_name: string;
  description?: string;
};

export function SuperAppMenuGrid({ locale }: SuperAppMenuGridProps) {
  const [showAllMenus, setShowAllMenus] = useState(false);
  const { data: menuItemsData, isLoading, error: menuError } = useGuideMenuItems();

  // Flatten all menu items dan group by category
  const { allItems, categorizedItems } = useMemo(() => {
    if (!menuItemsData?.menuItems || !Array.isArray(menuItemsData.menuItems)) {
      return { allItems: [], categorizedItems: {} };
    }

    const items: MenuItem[] = [];
    const categories: Record<string, MenuItem[]> = {};

    // Collect all items from menu items API (only eligible for super app menu)
    menuItemsData.menuItems.forEach((section) => {
      // Safety check: ensure section and items exist
      if (!section || !section.items || !Array.isArray(section.items)) {
        return;
      }
      
      section.items.forEach((item: MenuItem) => {
        // Safety check: ensure item has required fields
        if (!item || !item.href || !item.label || !item.icon_name) {
          return;
        }
        
        // Filter: Only include items eligible for super app menu
        if (!isSuperAppMenuEligible(item.href)) {
          return;
        }
        // Avoid duplicates
        if (!items.find((i) => i.href === item.href)) {
          items.push(item);
          const category = getCategoryForHref(item.href);
          if (!categories[category]) {
            categories[category] = [];
          }
          categories[category]!.push(item);
        }
      });
    });

    // Essential items constant (used as fallback)
    const essentialItemsList: MenuItem[] = [
      // Operasional
      { href: '/guide/attendance', label: 'Absensi', icon_name: 'MapPin', description: 'Check-in/out lokasi' },
      { href: '/guide/trips', label: 'Jadwal Trip', icon_name: 'Calendar', description: 'Daftar trip' },
      { href: '/guide/crew/directory', label: 'Crew Directory', icon_name: 'Users', description: 'Direktori guide' },
      // Finansial
      { href: '/guide/wallet', label: 'Dompet', icon_name: 'Wallet', description: 'Pendapatan & transaksi' },
      { href: '/guide/rewards', label: 'Reward Points', icon_name: 'Gift', description: 'Poin reward & katalog' },
      // Pengembangan
      { href: '/guide/training', label: 'Pelatihan', icon_name: 'GraduationCap', description: 'Modul pelatihan' },
      { href: '/guide/certifications', label: 'Sertifikasi', icon_name: 'Award', description: 'Kelola sertifikasi' },
      { href: '/guide/learning', label: 'Learning Hub', icon_name: 'BookOpen', description: 'FAQ & SOP' },
      // Dukungan
      { href: '/guide/sos', label: 'SOS', icon_name: 'Shield', description: 'Emergency button' },
      { href: '/guide/notifications', label: 'Notifikasi', icon_name: 'Megaphone', description: 'Pemberitahuan' },
    ];

    essentialItemsList.forEach((item) => {
      if (!items.find((i) => i.href === item.href)) {
        items.push(item);
        const category = getCategoryForHref(item.href);
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category]!.push(item);
      }
    });

    return { allItems: items, categorizedItems: categories };
  }, [menuItemsData]);

  // Get first 7 items untuk ditampilkan di home (prioritaskan operasional dan finansial)
  // Button "Lainnya" akan menjadi item ke-8 jika ada lebih dari 7 menu items
  const displayedItems = useMemo(() => {
    const priority = [
      ...(Array.isArray(categorizedItems.operasional) ? categorizedItems.operasional : []).slice(0, 4),
      ...(Array.isArray(categorizedItems.finansial) ? categorizedItems.finansial : []).slice(0, 2),
      ...(Array.isArray(categorizedItems.pengembangan) ? categorizedItems.pengembangan : []).slice(0, 1),
      ...(Array.isArray(categorizedItems.dukungan) ? categorizedItems.dukungan : []).slice(0, 1),
    ];
    // Filter out any invalid items
    return priority
      .filter((item): item is MenuItem => {
        return !!item && !!item.href && !!item.label && !!item.icon_name;
      })
      .slice(0, 7);
  }, [categorizedItems]);

  const hasMoreItems = allItems.length > 7;

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if API fails (fallback to essential items only)
  if (menuError && allItems.length === 0) {
    // Even on error, show essential items as fallback
    const fallbackItems: MenuItem[] = [
      { href: '/guide/attendance', label: 'Absensi', icon_name: 'MapPin', description: 'Check-in/out lokasi' },
      { href: '/guide/trips', label: 'Jadwal Trip', icon_name: 'Calendar', description: 'Daftar trip' },
      { href: '/guide/crew/directory', label: 'Crew Directory', icon_name: 'Users', description: 'Direktori guide' },
      { href: '/guide/wallet', label: 'Dompet', icon_name: 'Wallet', description: 'Pendapatan & transaksi' },
      { href: '/guide/rewards', label: 'Reward Points', icon_name: 'Gift', description: 'Poin reward & katalog' },
      { href: '/guide/training', label: 'Pelatihan', icon_name: 'GraduationCap', description: 'Modul pelatihan' },
      { href: '/guide/sos', label: 'SOS', icon_name: 'Shield', description: 'Emergency button' },
      { href: '/guide/notifications', label: 'Notifikasi', icon_name: 'Megaphone', description: 'Pemberitahuan' },
    ];
    
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-3">
            {fallbackItems.map((item) => {
              const IconComponent = iconMap[item.icon_name] || FileText;
              const category = getCategoryForHref(item.href);
              const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.lainnya;
              
              return (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  className="group flex flex-col items-center gap-2 rounded-lg p-2 transition-all hover:bg-slate-50 active:scale-95"
                  aria-label={item.label}
                >
                  <div className={cn('flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-active:scale-110', config.bgColor)}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <p className="text-center text-[10px] font-medium text-slate-900 leading-tight line-clamp-2">
                    {item.label}
                  </p>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  const categoryOrder: (keyof typeof categoryConfig)[] = [
    'operasional',
    'finansial',
    'pengembangan',
    'dukungan',
    'lainnya',
  ];

  return (
    <>
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-3">
            {displayedItems
              .filter((item): item is MenuItem => {
                // Safety check: ensure item has required fields
                return !!item && !!item.href && !!item.label && !!item.icon_name;
              })
              .map((item: MenuItem) => {
                const IconComponent = iconMap[item.icon_name] || FileText;
                const category = getCategoryForHref(item.href);
                const config = categoryConfig[category as keyof typeof categoryConfig];
                const safeConfig = config || categoryConfig.lainnya;

                return (
                  <Link
                    key={item.href}
                    href={`/${locale}${item.href}`}
                    className="group flex flex-col items-center gap-2 rounded-lg p-2 transition-all hover:bg-slate-50 active:scale-95"
                    aria-label={item.label || 'Menu item'}
                  >
                    <div className={cn('flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-active:scale-110', safeConfig.bgColor)}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <p className="text-center text-[10px] font-medium text-slate-900 leading-tight line-clamp-2">
                      {item.label || 'Menu'}
                    </p>
                  </Link>
                );
              })}

            {/* "Lainnya" Button */}
            {hasMoreItems && (
              <button
                onClick={() => setShowAllMenus(true)}
                className="group flex flex-col items-center gap-2 rounded-lg p-2 transition-all hover:bg-slate-50 active:scale-95"
                aria-label="Lihat semua menu"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-200 text-slate-600 shadow-sm transition-transform group-active:scale-110">
                  <MoreHorizontal className="h-6 w-6" />
                </div>
                <p className="text-center text-[10px] font-medium text-slate-900 leading-tight">
                  Lainnya
                </p>
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sheet untuk semua menu */}
      <Sheet open={showAllMenus} onOpenChange={setShowAllMenus}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-10 max-h-[80vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Semua Menu</SheetTitle>
            <SheetDescription>Pilih menu yang ingin Anda akses</SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {categoryOrder.map((categoryKey) => {
              const items = categorizedItems[categoryKey];
              if (!items || !Array.isArray(items) || items.length === 0) return null;

              const config = categoryConfig[categoryKey];
              if (!config) return null;
              
              const CategoryIcon = config.icon;

              return (
                <div key={categoryKey}>
                  {/* Category Header */}
                  <div className="mb-3 flex items-center gap-2">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', config.bgColor)}>
                      <CategoryIcon className="h-4 w-4 text-white" />
                    </div>
                    <h3 className={cn('text-sm font-bold', config.textColor)}>{config.title}</h3>
                  </div>

                  {/* Menu Grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {items
                      .filter((item): item is MenuItem => {
                        // Safety check: ensure item has required fields
                        return !!item && !!item.href && !!item.label && !!item.icon_name;
                      })
                      .map((item: MenuItem) => {
                        const IconComponent = iconMap[item.icon_name] || FileText;
                        return (
                          <Link
                            key={item.href}
                            href={`/${locale}${item.href}`}
                            onClick={() => setShowAllMenus(false)}
                            className="group flex flex-col items-center gap-2 rounded-lg p-2 transition-all hover:bg-slate-50 active:scale-95"
                            aria-label={item.label || 'Menu item'}
                          >
                            <div className={cn('flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-active:scale-110', config.bgColor)}>
                              <IconComponent className="h-6 w-6" />
                            </div>
                            <p className="text-center text-[10px] font-medium text-slate-900 leading-tight line-clamp-2">
                              {item.label || 'Menu'}
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
