/**
 * Partner Tier Detail Client Component
 * Comprehensive tier information, benefits, and progress tracking
 */

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  TrendingUp,
  Check,
  Lock,
  Zap,
  Target,
  Star,
  Gift,
  Crown,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PartnerProfile } from '@/lib/partner/profile-service';

type TierBenefit = {
  title: string;
  description: string;
  unlocked: boolean;
};

type TierInfo = {
  name: string;
  minPoints: number;
  maxPoints: number | null;
  commission: string;
  icon: typeof Award;
  color: string;
  bgColor: string;
  gradient: string;
  benefits: TierBenefit[];
};

const TIER_INFO: Record<string, TierInfo> = {
  bronze: {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    commission: '15%',
    icon: Award,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500',
    gradient: 'from-orange-400 to-orange-600',
    benefits: [
      { title: 'Dashboard Access', description: 'Akses ke dashboard partner', unlocked: true },
      { title: 'Standard Support', description: 'Support via email & chat', unlocked: true },
      { title: 'Komisi 15%', description: 'Komisi dari setiap booking', unlocked: true },
      { title: 'Payment NET 30', description: 'Settlement setiap 30 hari', unlocked: true },
    ],
  },
  silver: {
    name: 'Silver',
    minPoints: 1000,
    maxPoints: 2999,
    commission: '18%',
    icon: Star,
    color: 'text-gray-600',
    bgColor: 'bg-gray-400',
    gradient: 'from-gray-300 to-gray-500',
    benefits: [
      { title: 'Semua Bronze Benefits', description: 'Akses semua fitur Bronze', unlocked: true },
      { title: 'Komisi 18%', description: '+3% lebih tinggi dari Bronze', unlocked: true },
      { title: 'Priority Support', description: 'Response lebih cepat', unlocked: true },
      { title: 'Payment NET 15', description: 'Settlement lebih cepat', unlocked: true },
      { title: 'Advanced Analytics', description: 'Laporan performa detail', unlocked: true },
    ],
  },
  gold: {
    name: 'Gold',
    minPoints: 3000,
    maxPoints: 9999,
    commission: '20%',
    icon: Crown,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500',
    gradient: 'from-yellow-400 to-yellow-600',
    benefits: [
      { title: 'Semua Silver Benefits', description: 'Akses semua fitur Silver', unlocked: true },
      { title: 'Komisi 20%', description: '+2% lebih tinggi dari Silver', unlocked: true },
      { title: 'Dedicated Manager', description: 'Partnership manager khusus', unlocked: true },
      { title: 'Featured Placement', description: 'Prioritas di listing', unlocked: true },
      { title: 'White-label Option', description: 'Custom branding untuk invoice', unlocked: true },
      { title: 'Custom Rates', description: 'Negosiasi harga khusus', unlocked: true },
    ],
  },
  platinum: {
    name: 'Platinum',
    minPoints: 10000,
    maxPoints: null,
    commission: '25%',
    icon: Sparkles,
    color: 'text-slate-600',
    bgColor: 'bg-slate-500',
    gradient: 'from-slate-400 to-slate-600',
    benefits: [
      { title: 'Semua Gold Benefits', description: 'Akses semua fitur Gold', unlocked: true },
      { title: 'Komisi 25%', description: 'Komisi tertinggi untuk partner', unlocked: true },
      { title: 'Full White-label', description: 'Custom domain & branding penuh', unlocked: true },
      { title: 'API Integration', description: 'Integrasi ke sistem Anda', unlocked: true },
      { title: 'Strategic Partnership', description: 'Kerjasama strategis jangka panjang', unlocked: true },
      { title: 'VIP Support 24/7', description: 'Support prioritas 24/7', unlocked: true },
      { title: 'Exclusive Deals', description: 'Akses paket & promo eksklusif', unlocked: true },
    ],
  },
};

type TierDetailClientProps = {
  locale: string;
  initialProfile: PartnerProfile;
};

export function TierDetailClient({ locale, initialProfile }: TierDetailClientProps) {
  const { data: profileData } = useQuery<PartnerProfile>({
    queryKey: ['partner', 'profile', 'tier'],
    queryFn: async () => {
      const res = await fetch('/api/partner/profile');
      if (!res.ok) return initialProfile;
      const data = await res.json();
      return { ...initialProfile, ...data.profile };
    },
    initialData: initialProfile,
    staleTime: 60000,
  });

  const currentTier = profileData?.tier?.toLowerCase() || 'bronze';
  const currentPoints = profileData?.points || 0;
  const nextTierPoints = profileData?.nextTierPoints || 1000;

  const currentTierInfo: TierInfo = TIER_INFO[currentTier] ?? TIER_INFO['bronze']!;
  const allTiers = ['bronze', 'silver', 'gold', 'platinum'] as const;
  const currentTierIndex = allTiers.indexOf(currentTier as typeof allTiers[number]);
  const nextTier = allTiers[currentTierIndex + 1];
  const nextTierInfo = nextTier ? TIER_INFO[nextTier] : null;

  const progressToNext = nextTierInfo
    ? ((currentPoints - currentTierInfo.minPoints) /
        (nextTierInfo.minPoints - currentTierInfo.minPoints)) *
      100
    : 100;

  const pointsToNext = nextTierInfo ? nextTierInfo.minPoints - currentPoints : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Back Button */}
      <div className="bg-white border-b px-4 py-3">
        <Link href={`/${locale}/partner/account`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </Link>
      </div>

      {/* Current Tier Card */}
      <div className="px-4 pt-4">
        <Card className={cn('border-0 shadow-lg bg-gradient-to-br', currentTierInfo.gradient)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  {React.createElement(currentTierInfo.icon, {
                    className: 'h-8 w-8 text-white',
                  })}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Partner Level</p>
                  <h1 className="text-3xl font-bold text-white">
                    {currentTierInfo.name.toUpperCase()}
                  </h1>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-white/30">
                Komisi {currentTierInfo.commission}
              </Badge>
            </div>

            <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-white/90">Poin Saat Ini</p>
                <p className="text-2xl font-bold text-white">{currentPoints.toLocaleString('id-ID')}</p>
              </div>

              {nextTierInfo && (
                <>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2 text-xs text-white/80">
                      <span>Progress ke {nextTierInfo.name}</span>
                      <span>{progressToNext.toFixed(0)}%</span>
                    </div>
                    <Progress value={progressToNext} className="h-2 bg-white/20 [&>*]:bg-white" />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-white/90">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>Butuh {pointsToNext.toLocaleString('id-ID')} poin lagi</span>
                    </div>
                    <Link href={`/${locale}/partner/analytics`}>
                      <Button size="sm" variant="secondary" className="h-7 text-xs bg-white/90 hover:bg-white">
                        Lihat Cara
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              {!nextTierInfo && (
                <div className="mt-3 flex items-center justify-center gap-2 text-white/90">
                  <Crown className="h-4 w-4" />
                  <span className="text-sm font-semibold">Tier Tertinggi!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Tier Benefits */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-foreground mb-3">Benefits Anda Saat Ini</h2>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-3">
              {currentTierInfo.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{benefit.title}</p>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Tiers Comparison */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-foreground mb-3">Semua Level Partner</h2>
        <div className="space-y-3">
          {allTiers.map((tier, index) => {
            const tierInfo = TIER_INFO[tier];
            if (!tierInfo) return null;
            
            const isActive = tier === currentTier;
            const isLocked = index > currentTierIndex;

            return (
              <Card
                key={tier}
                className={cn(
                  'border transition-all',
                  isActive && 'ring-2 ring-primary border-primary shadow-md',
                  !isActive && 'border-border'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br',
                          tierInfo.gradient
                        )}
                      >
                        {React.createElement(tierInfo.icon, {
                          className: 'h-6 w-6 text-white',
                        })}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground">
                            {tierInfo.name}
                          </h3>
                          {isActive && (
                            <Badge variant="default" className="h-5 text-xs">
                              Current
                            </Badge>
                          )}
                          {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tierInfo.minPoints.toLocaleString('id-ID')}
                          {tierInfo.maxPoints
                            ? ` - ${tierInfo.maxPoints.toLocaleString('id-ID')}`
                            : '+'}{' '}
                          poin • Komisi {tierInfo.commission}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{tierInfo.commission}</p>
                      <p className="text-xs text-muted-foreground">komisi</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* How to Earn Points */}
      <div className="px-4 mt-6 mb-6">
        <h2 className="text-lg font-bold text-foreground mb-3">Cara Mendapatkan Poin</h2>
        <Card className="border-0 shadow-sm bg-primary/5">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Setiap Booking Selesai</p>
                  <p className="text-xs text-muted-foreground">
                    Dapatkan 10 poin untuk setiap booking yang selesai
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Omzet Bulanan</p>
                  <p className="text-xs text-muted-foreground">
                    Bonus 50 poin setiap mencapai target omzet Rp 10 juta/bulan
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Rating Tinggi</p>
                  <p className="text-xs text-muted-foreground">
                    Bonus 25 poin jika rating di atas 4.5 selama 3 bulan berturut-turut
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Gift className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Referral Partner Baru</p>
                  <p className="text-xs text-muted-foreground">
                    Dapatkan 100 poin untuk setiap partner baru yang Anda referensikan
                  </p>
                </div>
              </div>
            </div>

            <Link href={`/${locale}/partner/rewards`} className="mt-4 block">
              <Button className="w-full">
                <Gift className="mr-2 h-4 w-4" />
                Lihat Program Rewards
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

