/**
 * Partner Account Page - Profile & Account Management Focus
 * 
 * NEW IMPROVED STRUCTURE:
 * 1. WIDGETS → Program Partner (Points, Rewards) & Komunikasi (Inbox, Notifications)
 * 2. COLLAPSIBLE MENUS → Akun & Pengaturan, Dukungan & Legal
 * 3. SIMPLE ITEMS → Preferensi (non-collapsible, simple card)
 * 
 * Refactored to use central config from lib/config/partner-menu-config.ts
 */

'use client';

import {
  Globe,
  LogOut,
  ChevronRight,
  Camera,
  Gift,
  Wallet,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PartnerProfile } from '@/lib/partner/profile-service';
import queryKeys from '@/lib/queries/query-keys';

// Import from central config
import {
  getMenuItemsByCategory,
} from '@/lib/config/partner-menu-config';

export function AccountClient({ 
  locale,
  initialProfile 
}: { 
  locale: string;
  initialProfile: PartnerProfile;
}) {
  // Fetch profile data with initialData
  const { data: profileData } = useQuery<PartnerProfile>({
    queryKey: ['partner', 'profile', 'account'],
    queryFn: async () => {
      const res = await fetch('/api/partner/profile');
      if (!res.ok) return initialProfile;
      const data = await res.json();
      return {
        ...initialProfile,
        ...data.profile,
      };
    },
    initialData: initialProfile,
    staleTime: 60000,
  });

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return 'from-slate-400 to-slate-600';
      case 'gold':
        return 'from-yellow-400 to-yellow-600';
      case 'silver':
        return 'from-gray-300 to-gray-500';
      default:
        return 'from-orange-400 to-orange-600';
    }
  };

  const tierProgress =
    ((profileData?.points || 0) / (profileData?.nextTierPoints || 1)) * 100;

  // Get menu items from central config
  const accountMenuItems = getMenuItemsByCategory(locale)['akun'] || [];
  const programMenuItems = getMenuItemsByCategory(locale)['program'] || [];
  const supportMenuItems = getMenuItemsByCategory(locale)['dukungan'] || [];
  const legalMenuItems = getMenuItemsByCategory(locale)['legal'] || [];

  // Add Bahasa & Zona Waktu to Account menu items
  const accountWithPreferences = [
    ...accountMenuItems,
    {
      id: 'language-timezone',
      href: `/${locale}/partner/settings/preferences`,
      label: 'Bahasa & Zona Waktu',
      icon: Globe,
      description: 'Indonesia, WIB',
      category: 'akun' as const,
      priority: 999,
    },
  ];

  // Combine Legal + Support
  const supportLegalItems = [...supportMenuItems, ...legalMenuItems];

  // Fetch wallet balance
  const { data: walletBalance } = useQuery({
    queryKey: queryKeys.partner.wallet.balance(),
    queryFn: async () => {
      const res = await fetch('/api/partner/wallet/balance');
      if (!res.ok) return { balance: 0, pendingBalance: 0 };
      return res.json();
    },
    staleTime: 30000,
  });

  // Wallet data from API or fallback to 0
  const walletData = {
    balance: walletBalance?.balance || (profileData as any)?.walletBalance || 0,
    pendingBalance: walletBalance?.pendingBalance || (profileData as any)?.pendingBalance || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Profile + Wallet + Partner Status - All in One Card */}
      <Card className="mx-4 mt-4 overflow-hidden border-0 shadow-md">
        <CardContent className="p-0">
          {/* Profile Section */}
          <div className="p-4 bg-white border-b">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-xl font-bold text-white shadow-sm">
                  {profileData?.avatar ? (
                    <img
                      src={profileData.avatar}
                      alt={profileData.name}
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    profileData?.name.charAt(0) || 'P'
                  )}
                </div>
                <button className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-border">
                  <Camera className="h-2.5 w-2.5 text-primary" />
                </button>
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-foreground truncate">
                  {profileData?.name || 'Loading...'}
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md bg-gradient-to-r px-1.5 py-0.5 text-[10px] font-bold text-white leading-none',
                        getTierColor(profileData?.tier || 'bronze')
                      )}
                    >
                      {(profileData?.tier || 'bronze').toUpperCase()}
                    </span>
                    <Link href={`/${locale}/partner/tier`}>
                      <button className="flex h-4 w-4 items-center justify-center rounded-full bg-muted hover:bg-primary/10 transition-colors">
                        <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
                      </button>
                    </Link>
                  </div>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground">Member {profileData?.memberSince || '2024'}</span>
                </div>
              </div>

              {/* Settings Button */}
              <Link href={`/${locale}/partner/settings`}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid - Wallet & Points */}
          <div className="grid grid-cols-2 divide-x">
            {/* Wallet */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wallet className="h-3.5 w-3.5 text-white" />
                <span className="text-[10px] text-white/80 font-medium uppercase tracking-wide">Saldo Wallet</span>
              </div>
              <p className="text-lg font-bold text-white mb-0.5">
                Rp {(walletData.balance / 1000).toFixed(1)}K
              </p>
              {walletData.pendingBalance > 0 && (
                <p className="text-[10px] text-white/80 mb-2">
                  +{(walletData.pendingBalance / 1000).toFixed(0)}K pending
                </p>
              )}
              <Link href={`/${locale}/partner/wallet`}>
                <Button size="sm" variant="secondary" className="w-full h-6 text-[10px] bg-white/90 hover:bg-white text-emerald-700 font-semibold">
                  Kelola
                </Button>
              </Link>
            </div>

            {/* Partner Points */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Gift className="h-3.5 w-3.5 text-white" />
                <span className="text-[10px] text-white/80 font-medium uppercase tracking-wide">Poin Rewards</span>
              </div>
              <p className="text-lg font-bold text-white mb-0.5">
                {profileData?.points || 0}
              </p>
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1 text-[9px] text-white/80">
                  <span>Progress</span>
                  <span>{tierProgress.toFixed(0)}%</span>
                </div>
                <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${tierProgress}%` }}
                  />
                </div>
              </div>
              <Link href={`/${locale}/partner/rewards`}>
                <Button size="sm" variant="secondary" className="w-full h-6 text-[10px] bg-white/90 hover:bg-white text-purple-700 font-semibold">
                  Lihat Rewards
                </Button>
              </Link>
            </div>
          </div>

          {/* No additional buttons - Rewards accessible via widget button */}
        </CardContent>
      </Card>

      <div className="mt-3 space-y-3 px-4">

        {/* Menu Section: Akun & Pengaturan */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0 divide-y">
            <div className="px-3 py-2 bg-muted/30">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Akun & Pengaturan
              </h3>
            </div>
            {accountWithPreferences.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Menu Section: Bantuan & Legal */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0 divide-y">
            <div className="px-3 py-2 bg-muted/30">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Bantuan & Legal
              </h3>
            </div>
            {supportLegalItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Logout Button */}
      <div className="mt-4 px-4">
        <Button
          variant="destructive"
          size="default"
          className="w-full"
          onClick={() => {
            window.location.href = '/auth/logout';
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Keluar
        </Button>
      </div>

      {/* App Version */}
      <div className="mt-4 pb-4 text-center">
        <p className="text-xs text-muted-foreground">
          MyAeroTravel Partner v1.0.0
        </p>
      </div>
    </div>
  );
}
