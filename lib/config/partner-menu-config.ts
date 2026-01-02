/**
 * Partner Apps - Central Menu Configuration
 * Single source of truth for all partner menu items
 * Used by: Dashboard Grid, All Menu Modal, Bottom Navigation, Account Page
 */

import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarPlus,
  Gift,
  Home,
  Inbox,
  Info,
  LifeBuoy,
  ListOrdered,
  Package,
  Palette,
  Receipt,
  RefreshCw,
  ScrollText,
  Settings,
  Shield,
  TrendingUp,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ==========================================
// TYPES
// ==========================================

export type PartnerMenuItem = {
  id: string; // Unique identifier
  href: string; // Relative path (without locale)
  label: string;
  icon: LucideIcon;
  description?: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'new' | 'count';
  category: 'operasional' | 'finansial' | 'analytics' | 'program' | 'komunikasi' | 'dukungan' | 'akun' | 'legal';
  priority: number; // For sorting (1 = highest)
  showInDashboard?: boolean; // Show in dashboard grid (top 7)
  showInBottomNav?: boolean; // Show in bottom navigation
  showInSuperAppMenu?: boolean; // Show in Super App Menu (layanan) vs Account Menu (profil/setting)
};

export type PartnerMenuCategory = {
  id: string;
  title: string;
  bgColor: string; // Tailwind class
  textColor: string; // Tailwind class
  icon: LucideIcon;
  priority: number;
};

// ==========================================
// CATEGORIES DEFINITION
// ==========================================

export const PARTNER_MENU_CATEGORIES: Record<string, PartnerMenuCategory> = {
  operasional: {
    id: 'operasional',
    title: 'Operasional',
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-700',
    icon: Package,
    priority: 1,
  },
  finansial: {
    id: 'finansial',
    title: 'Finansial',
    bgColor: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    icon: Wallet,
    priority: 2,
  },
  analytics: {
    id: 'analytics',
    title: 'Analytics & Insights',
    bgColor: 'bg-purple-500',
    textColor: 'text-purple-700',
    icon: BarChart3,
    priority: 3,
  },
  program: {
    id: 'program',
    title: 'Program Partner',
    bgColor: 'bg-pink-500',
    textColor: 'text-pink-700',
    icon: Gift,
    priority: 4,
  },
  komunikasi: {
    id: 'komunikasi',
    title: 'Komunikasi',
    bgColor: 'bg-cyan-500',
    textColor: 'text-cyan-700',
    icon: Inbox,
    priority: 5,
  },
  dukungan: {
    id: 'dukungan',
    title: 'Dukungan',
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-700',
    icon: LifeBuoy,
    priority: 6,
  },
  akun: {
    id: 'akun',
    title: 'Akun & Pengaturan',
    bgColor: 'bg-slate-500',
    textColor: 'text-slate-700',
    icon: Settings,
    priority: 7,
  },
  legal: {
    id: 'legal',
    title: 'Legal & Kebijakan',
    bgColor: 'bg-indigo-500',
    textColor: 'text-indigo-700',
    icon: Shield,
    priority: 8,
  },
} as const;

// ==========================================
// MENU ITEMS DEFINITION
// ==========================================

export const PARTNER_MENU_ITEMS: PartnerMenuItem[] = [
  // ========== OPERASIONAL (LAYANAN) ==========
  {
    id: 'packages',
    href: '/partner/packages',
    label: 'Paket Wisata',
    icon: Package,
    description: 'Kelola paket wisata',
    category: 'operasional',
    priority: 1,
    showInDashboard: true,
    showInBottomNav: true,
    showInSuperAppMenu: true, // LAYANAN
  },
  {
    id: 'bookings',
    href: '/partner/bookings',
    label: 'Booking',
    icon: ListOrdered,
    description: 'Kelola booking',
    category: 'operasional',
    priority: 2,
    showInDashboard: true,
    showInBottomNav: true,
    showInSuperAppMenu: true, // LAYANAN
  },
  {
    id: 'bookings-new',
    href: '/partner/bookings/new',
    label: 'Booking Baru',
    icon: CalendarPlus,
    description: 'Buat booking baru',
    category: 'operasional',
    priority: 3,
    showInDashboard: false,
    showInSuperAppMenu: true, // LAYANAN
  },
  {
    id: 'customers',
    href: '/partner/customers',
    label: 'Customer',
    icon: Users,
    description: 'Daftar customer',
    category: 'operasional',
    priority: 4,
    showInDashboard: true,
    showInSuperAppMenu: true, // LAYANAN
  },

  // ========== FINANSIAL (LAYANAN) ==========
  {
    id: 'wallet',
    href: '/partner/wallet',
    label: 'Wallet',
    icon: Wallet,
    description: 'Saldo & transaksi',
    category: 'finansial',
    priority: 1,
    showInDashboard: true,
    showInBottomNav: false, // ❌ REMOVED from bottom nav (moved to widget)
    showInSuperAppMenu: true, // LAYANAN
  },
  {
    id: 'invoices',
    href: '/partner/invoices',
    label: 'Invoice',
    icon: Receipt,
    description: 'Kelola invoice',
    category: 'finansial',
    priority: 2,
    showInDashboard: true,
    showInSuperAppMenu: true, // LAYANAN
  },
  {
    id: 'reports',
    href: '/partner/reports',
    label: 'Laporan Komisi',
    icon: TrendingUp,
    description: 'Laporan komisi',
    category: 'finansial',
    priority: 3,
    showInDashboard: true, // ✅ ADDED to dashboard (item ke-7)
    showInSuperAppMenu: true, // LAYANAN
  },
  {
    id: 'refunds',
    href: '/partner/refunds',
    label: 'Refund',
    icon: RefreshCw,
    description: 'Pengembalian dana',
    category: 'finansial',
    priority: 4,
    showInDashboard: false,
    showInSuperAppMenu: true, // LAYANAN
  },
  {
    id: 'invoices-aggregated',
    href: '/partner/invoices/aggregated',
    label: 'Invoice Agregat',
    icon: Receipt,
    description: 'Invoice gabungan',
    category: 'finansial',
    priority: 5,
    showInDashboard: false,
    showInSuperAppMenu: true, // LAYANAN
  },

  // ========== ANALYTICS (LAYANAN) ==========
  {
    id: 'analytics',
    href: '/partner/analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Analisis kinerja',
    category: 'analytics',
    priority: 1,
    showInDashboard: true,
    showInSuperAppMenu: true, // LAYANAN
  },
  {
    id: 'activity-log',
    href: '/partner/activity-log',
    label: 'Activity Log',
    icon: Activity,
    description: 'Riwayat aktivitas',
    category: 'analytics',
    priority: 2,
    showInDashboard: false,
    showInSuperAppMenu: true, // LAYANAN
  },

  // ========== PROGRAM PARTNER (ACCOUNT) ==========
  {
    id: 'rewards',
    href: '/partner/rewards',
    label: 'Rewards',
    icon: Gift,
    description: 'Tukar poin dengan hadiah',
    badge: 'NEW',
    badgeVariant: 'new',
    category: 'program',
    priority: 1,
    showInDashboard: false,
    showInSuperAppMenu: false, // ACCOUNT
  },
  {
    id: 'travel-circle',
    href: '/partner/travel-circle',
    label: 'Travel Circle',
    icon: UsersRound,
    description: 'Komunitas partner eksklusif',
    category: 'program',
    priority: 2,
    showInDashboard: false,
    showInSuperAppMenu: true, // ✅ MOVED to Super Apps Menu
  },

  // ========== KOMUNIKASI (ACCOUNT/NAV) ==========
  {
    id: 'inbox',
    href: '/partner/inbox',
    label: 'Inbox',
    icon: Inbox,
    description: 'Pesan masuk',
    category: 'komunikasi',
    priority: 1,
    showInDashboard: false,
    showInBottomNav: true, // ✅ ADDED to bottom nav (replace Wallet)
    showInSuperAppMenu: false, // ACCOUNT
  },
  {
    id: 'notifications',
    href: '/partner/notifications',
    label: 'Notifikasi',
    icon: Bell,
    description: 'Pemberitahuan',
    category: 'komunikasi',
    priority: 2,
    showInDashboard: false,
    showInSuperAppMenu: false, // HIDDEN (already in header)
  },

  // ========== DUKUNGAN (ACCOUNT) ==========
  {
    id: 'support',
    href: '/partner/support',
    label: 'Support',
    icon: LifeBuoy,
    description: 'Hubungi tim support',
    category: 'dukungan',
    priority: 1,
    showInDashboard: false,
    showInSuperAppMenu: false, // ACCOUNT
  },
  {
    id: 'faq',
    href: '/partner/faq',
    label: 'FAQ',
    icon: BookOpen,
    description: 'Pertanyaan umum',
    category: 'dukungan',
    priority: 2,
    showInDashboard: false,
    showInSuperAppMenu: false, // ACCOUNT
  },
  {
    id: 'about',
    href: '/partner/about',
    label: 'Tentang',
    icon: Info,
    description: 'Tentang MyAeroTravel Partner',
    category: 'dukungan',
    priority: 3,
    showInDashboard: false,
    showInSuperAppMenu: false, // ACCOUNT
  },

  // ========== AKUN & PENGATURAN (ACCOUNT) ==========
  {
    id: 'settings',
    href: '/partner/settings',
    label: 'Pengaturan',
    icon: Settings,
    description: 'Kelola profil dan preferensi',
    category: 'akun',
    priority: 1,
    showInDashboard: false,
    showInSuperAppMenu: false, // ACCOUNT
  },
  {
    id: 'team',
    href: '/partner/team',
    label: 'Tim',
    icon: UsersRound,
    description: 'Undang dan kelola anggota tim',
    category: 'akun',
    priority: 2,
    showInDashboard: false,
    showInSuperAppMenu: false, // ACCOUNT
  },
  {
    id: 'whitelabel',
    href: '/partner/whitelabel',
    label: 'Whitelabel',
    icon: Palette,
    description: 'Kustomisasi tampilan brand Anda',
    category: 'akun',
    priority: 3,
    showInDashboard: false,
    showInSuperAppMenu: false, // ACCOUNT
  },

  // ========== LEGAL & KEBIJAKAN (ACCOUNT) ==========
  {
    id: 'terms',
    href: '/partner/legal/terms',
    label: 'Syarat & Ketentuan',
    icon: ScrollText,
    description: 'Ketentuan penggunaan layanan',
    category: 'legal',
    priority: 1,
    showInDashboard: false,
    showInSuperAppMenu: false, // ACCOUNT
  },
  {
    id: 'privacy',
    href: '/partner/legal/privacy',
    label: 'Kebijakan Privasi',
    icon: Shield,
    description: 'Kebijakan perlindungan data',
    category: 'legal',
    priority: 2,
    showInDashboard: false,
    showInSuperAppMenu: false, // ACCOUNT
  },
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get menu items for dashboard grid (top 7 + "Lainnya")
 * Items are sorted by category priority first, then item priority
 */
export function getDashboardMenuItems(locale: string): PartnerMenuItem[] {
  return PARTNER_MENU_ITEMS
    .filter((item) => item.showInDashboard)
    .sort((a, b) => {
      // Sort by category priority first, then item priority
      const catA = PARTNER_MENU_CATEGORIES[a.category];
      const catB = PARTNER_MENU_CATEGORIES[b.category];
      if (catA && catB && catA.priority !== catB.priority) {
        return catA.priority - catB.priority;
      }
      return a.priority - b.priority;
    })
    .slice(0, 7)
    .map((item) => ({ ...item, href: `/${locale}${item.href}` }));
}

/**
 * Get all LAYANAN items for Super App Menu (Modal "Lainnya")
 * Only includes operational services (Operasional, Finansial, Analytics)
 * Excludes Account/Profile items (Program, Komunikasi, Dukungan, Akun, Legal)
 */
export function getSuperAppMenuItems(locale: string): Record<string, PartnerMenuItem[]> {
  const grouped: Record<string, PartnerMenuItem[]> = {};

  PARTNER_MENU_ITEMS
    .filter((item) => item.showInSuperAppMenu) // Only LAYANAN items
    .forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category]!.push({
        ...item,
        href: `/${locale}${item.href}`,
      });
    });

  // Sort items within each category by priority
  Object.keys(grouped).forEach((category) => {
    grouped[category]!.sort((a, b) => a.priority - b.priority);
  });

  return grouped;
}

/**
 * Get all menu items grouped by category (for Account Page)
 * Each category's items are sorted by priority
 */
export function getMenuItemsByCategory(locale: string): Record<string, PartnerMenuItem[]> {
  const grouped: Record<string, PartnerMenuItem[]> = {};

  PARTNER_MENU_ITEMS.forEach((item) => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category]!.push({
      ...item,
      href: `/${locale}${item.href}`,
    });
  });

  // Sort items within each category by priority
  Object.keys(grouped).forEach((category) => {
    grouped[category]!.sort((a, b) => a.priority - b.priority);
  });

  return grouped;
}

/**
 * Get bottom navigation items (5 items total)
 * Includes: Dashboard (Home) + items with showInBottomNav + Account
 */
export function getBottomNavItems(locale: string) {
  const navItems = PARTNER_MENU_ITEMS
    .filter((item) => item.showInBottomNav)
    .sort((a, b) => {
      // Sort by category priority first, then item priority
      const catA = PARTNER_MENU_CATEGORIES[a.category];
      const catB = PARTNER_MENU_CATEGORIES[b.category];
      if (catA && catB && catA.priority !== catB.priority) {
        return catA.priority - catB.priority;
      }
      return a.priority - b.priority;
    });

  // Always include dashboard as first item and account as last
  return [
    {
      href: `/${locale}/partner/dashboard`,
      label: 'Home',
      icon: Home,
      matchPattern: /\/partner\/dashboard\/?$/,
    },
    ...navItems.map((item) => ({
      href: `/${locale}${item.href}`,
      label: item.label,
      icon: item.icon,
      matchPattern: new RegExp(`${item.href.replace(/\//g, '\\/')}`),
    })),
    {
      href: `/${locale}/partner/account`,
      label: 'Account',
      icon: Users,
      matchPattern: /\/partner\/account|\/partner\/settings|\/partner\/team|\/partner\/whitelabel|\/partner\/notifications/,
    },
  ];
}

/**
 * Search LAYANAN items only (for Super App Menu search)
 * Returns items that match the query (case-insensitive)
 */
export function searchSuperAppMenuItems(query: string, locale: string): PartnerMenuItem[] {
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) {
    return [];
  }

  return PARTNER_MENU_ITEMS
    .filter((item) => 
      item.showInSuperAppMenu && // Only LAYANAN items
      (item.label.toLowerCase().includes(lowerQuery) ||
       item.description?.toLowerCase().includes(lowerQuery))
    )
    .map((item) => ({ ...item, href: `/${locale}${item.href}` }));
}

/**
 * Search ALL menu items by label or description (for global search)
 * Returns items that match the query (case-insensitive)
 */
export function searchMenuItems(query: string, locale: string): PartnerMenuItem[] {
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) {
    return [];
  }

  return PARTNER_MENU_ITEMS
    .filter((item) => 
      item.label.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery)
    )
    .map((item) => ({ ...item, href: `/${locale}${item.href}` }));
}

