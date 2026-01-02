/**
 * Partner Dashboard Client - Unified Superapp Style
 * Polished layout with unified header block and pixel-perfect grid
 */

'use client';

import {
  ListOrdered,
  Wallet,
  TrendingUp,
  AlertCircle,
  Award,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import {
  AllMenuModal,
  HeroSlider,
  QuickStatsMini,
} from '@/components/partner';
import { SuperAppMenuGrid } from '@/components/partner/super-app-menu-grid';
import { FeaturedPackagesCarousel } from '@/components/partner/featured-packages-carousel';
import { ActiveOrdersSummary } from '@/components/partner/active-orders-summary';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';
import { type DashboardData } from '@/lib/partner/dashboard-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PartnerProfile = {
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  avatar: string | null;
};

interface PartnerDashboardClientProps {
  initialData: DashboardData;
  initialProfile: PartnerProfile;
  isProfileIncomplete?: boolean;
}

export function PartnerDashboardClient({
  initialData,
  initialProfile,
  isProfileIncomplete = false,
}: PartnerDashboardClientProps) {
  const params = useParams();
  const locale = params.locale as string;
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [greeting, setGreeting] = useState('Selamat Datang');

  // Calculate greeting on mount
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Selamat Pagi');
    else if (hour < 17) setGreeting('Selamat Siang');
    else setGreeting('Selamat Malam');
  }, []);

  // Fetch dashboard data with initialData from server
  const { data: dashboardData, isLoading: dashboardLoading } =
    useQuery<DashboardData>({
      queryKey: ['partner', 'dashboard', 'unified'],
      queryFn: async () => {
        const res = await fetch('/api/partner/dashboard');
        if (!res.ok) throw new Error('Failed to load dashboard data');
        return res.json();
      },
      initialData,
      staleTime: 30000,
      refetchInterval: 60000,
    });

  // Fetch profile for header with initialData
  const { data: profileData } = useQuery<PartnerProfile>({
    queryKey: ['partner', 'profile', 'compact'],
    queryFn: async () => {
      const res = await fetch('/api/partner/profile');
      if (!res.ok)
        return { name: 'Partner', tier: 'bronze' as const, avatar: null };
      const data = await res.json();
      return {
        name: data.profile?.companyName || data.profile?.fullName || 'Partner',
        tier: (data.profile?.tier || 'bronze') as
          | 'bronze'
          | 'silver'
          | 'gold'
          | 'platinum',
        avatar: data.profile?.avatar || null,
      };
    },
    initialData: initialProfile,
    staleTime: 300000,
  });

  const handleSendReminder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/partner/bookings/${orderId}/reminder`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to send reminder');
      toast.success('Reminder berhasil dikirim ke customer');
    } catch (error) {
      logger.error('Failed to send reminder', error);
      toast.error('Gagal mengirim reminder');
    }
  };

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

  // Quick Stats Mini
  const quickStats = [
    {
      label: 'Saldo Wallet',
      value: formatCurrency(dashboardData?.wallet?.balance || 0),
      icon: Wallet,
      iconColor: 'bg-green-500/15 text-green-700 dark:text-green-400',
      href: `/${locale}/partner/wallet`,
    },
    {
      label: 'Booking Pending',
      value: dashboardData?.active?.length || 0,
      icon: ListOrdered,
      iconColor: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
      href: `/${locale}/partner/bookings`,
    },
    {
      label: 'Omset Hari Ini',
      value: formatCurrency(dashboardData?.today?.sales || 0),
      icon: TrendingUp,
      iconColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
    },
    {
      label: 'Omset Bulan Ini',
      value: formatCurrency(dashboardData?.monthly?.totalSales || 0),
      icon: TrendingUp,
      iconColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
      href: `/${locale}/partner/analytics`,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      {/* UNIFIED TOP BLOCK (White/Card) */}
      <div className="bg-card pb-6 rounded-b-3xl shadow-sm relative z-10">
        
        {/* Greeting & Profile Section */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {greeting}, {profileData.name.split(' ')[0]}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm",
                  "bg-gradient-to-r", 
                  getTierColor(profileData.tier)
                )}>
                  <Award className="h-3 w-3" />
                  {profileData.tier.toUpperCase()} PARTNER
                </span>
              </div>
            </div>
            {/* Avatar - Optional if already in header, but nice for context */}
            {profileData.avatar ? (
              <img
                src={profileData.avatar}
                alt={profileData.name}
                className="h-12 w-12 rounded-full object-cover border-2 border-background shadow-sm"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border-2 border-background shadow-sm">
                {profileData.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Profile Incomplete Banner */}
        {isProfileIncomplete && (
          <div className="px-4 mt-4">
            <Alert variant="destructive" className="border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Akun Belum Lengkap</AlertTitle>
              <AlertDescription className="mt-1 flex flex-col gap-2">
                <p className="text-xs">
                  Lengkapi data profil dan verifikasi akun Anda untuk mulai berjualan.
                  Saat ini Anda dalam mode preview.
                </p>
                <Button size="sm" variant="outline" className="w-full h-7 text-xs bg-background">
                  Lengkapi Profil
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* 2. Hero Slider */}
        <div className="px-4 mt-4">
          <HeroSlider />
        </div>

        {/* 3. Quick Stats Strip */}
        <div className="mt-4">
          <QuickStatsMini stats={quickStats} loading={dashboardLoading} />
        </div>

        {/* 4. Main Grid Menu - Using SuperAppMenuGrid with central config */}
        <div className="mt-4 px-4">
          <SuperAppMenuGrid locale={locale} />
        </div>
      </div>

      {/* CONTENT BLOCK (Gray Background) */}
      <div className="px-4 py-6 space-y-6">
        {/* Featured Packages */}
        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-foreground">Paket Pilihan</h2>
            <a
              href={`/${locale}/partner/packages`}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Lihat Semua
            </a>
          </div>
          <FeaturedPackagesCarousel
            packages={dashboardData?.featured || []}
            loading={dashboardLoading}
          />
        </section>

        {/* Active Orders */}
        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-foreground">Pesanan Aktif</h2>
            <a
              href={`/${locale}/partner/bookings`}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Lihat Semua
            </a>
          </div>
          <ActiveOrdersSummary
            orders={(dashboardData?.active || []) as any}
            loading={dashboardLoading}
            onSendReminder={handleSendReminder}
          />
        </section>
      </div>

      {/* All Menu Drawer */}
      <AllMenuModal
        open={menuModalOpen}
        onOpenChange={setMenuModalOpen}
      />
    </div>
  );
}
