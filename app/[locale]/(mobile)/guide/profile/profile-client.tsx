'use client';

/**
 * Guide Profile Client Component
 * Mobile-first profile page with improved structure and industry best practices
 */

import {
    Award,
    BarChart3,
    Bell,
    BookOpen,
    Brain,
    Calendar,
    ChevronRight,
    CreditCard,
    FileText,
    Globe,
    GraduationCap,
    HelpCircle,
    History,
    LogOut,
    Megaphone,
    MessageSquare,
    Phone,
    Settings,
    Shield,
    Star,
    User,
    Wallet
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGuideMenuItems, useGuideStats } from '@/hooks/use-guide-common';
import queryKeys from '@/lib/queries/query-keys';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

import { GuideBadges } from './guide-badges';
import { TrainingWidget } from './widgets/training-widget';

type GuideProfileClientProps = {
  locale: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
  };
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
  Lock: Shield, // Use Shield for Lock (password) - TODO: Add Lock icon
  Bell: Bell,
  History: History,
  Wallet: Wallet,
  Globe: Globe,
  GraduationCap: GraduationCap,
  Award: Award,
  Brain: Brain,
  MessageSquare: MessageSquare,
  BookOpen: BookOpen,
  CreditCard: CreditCard,
};

type MenuItem = {
  href: string;
  label: string;
  icon_name: string;
  description?: string;
};

type MenuSection = {
  section: string;
  items: MenuItem[];
};

export function GuideProfileClient({ locale, user }: GuideProfileClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [walletLoading, setWalletLoading] = useState<boolean>(false);

  // Use shared hooks
  const { data: stats, isLoading: statsLoading } = useGuideStats();
  const { data: menuItemsData, isLoading: menuItemsLoading } = useGuideMenuItems();

  // Check if user needs onboarding
  const { data: onboardingData } = useQuery({
    queryKey: queryKeys.guide.onboarding.steps(),
    queryFn: async () => {
      const res = await fetch('/api/guide/onboarding/steps');
      if (!res.ok) return null;
      return (await res.json()) as { steps: Array<{ id: string }>; progress: { completion_percentage: number } | null };
    },
    staleTime: 300000, // 5 minutes
  });

  const needsOnboarding = onboardingData?.progress 
    ? onboardingData.progress.completion_percentage < 100 
    : onboardingData?.steps && onboardingData.steps.length > 0;

  // Check if user has active training
  const { data: trainingData } = useQuery({
    queryKey: [...queryKeys.guide.all, 'training', 'modules'],
    queryFn: async () => {
      const res = await fetch('/api/guide/training/modules');
      if (!res.ok) return null;
      const data = (await res.json()) as { modules: Array<{ progress?: { status: string } }> };
      return data.modules.filter(
        (m) => m.progress?.status === 'in_progress' || !m.progress || m.progress.status === 'not_started'
      );
    },
    staleTime: 60000,
  });

  const hasActiveTraining = (trainingData?.length ?? 0) > 0;

  useEffect(() => {
    let mounted = true;

    const loadWallet = async () => {
      try {
        setWalletLoading(true);
        const res = await fetch('/api/guide/wallet');
        if (!res.ok) return;
        const json = (await res.json()) as { balance?: number };
        if (!mounted) return;
        setWallet({ balance: Number(json.balance ?? 0) });
      } finally {
        if (mounted) {
          setWalletLoading(false);
        }
      }
    };

    void loadWallet();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  };

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const years = now.getFullYear() - date.getFullYear();
    const months = now.getMonth() - date.getMonth();
    const totalMonths = years * 12 + months;

    if (totalMonths >= 12) {
      return `${Math.floor(totalMonths / 12)} ${Math.floor(totalMonths / 12) === 1 ? 'Tahun' : 'Tahun'}`;
    }
    return `${totalMonths} ${totalMonths === 1 ? 'Bulan' : 'Bulan'}`;
  };

  const displayRating = stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0';
  const displayTrips = stats?.totalTrips ?? 0;
  const displayJoinDate = formatJoinDate(stats?.joinDate);

  return (
    <div className="space-y-4 pb-6">
      {/* Profile Header Card - Enhanced */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          {/* User Info Section - Improved Layout */}
          <div className="flex items-center gap-4">
            {/* Avatar - Larger, more prominent */}
            <div className="relative flex-shrink-0">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-100 via-emerald-200 to-emerald-300 ring-4 ring-emerald-500/10 shadow-sm">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-emerald-600" />
                )}
              </div>
              {/* Status indicator */}
              <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-4 border-white bg-emerald-500" />
            </div>

            {/* User Details - Better spacing */}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold leading-tight text-slate-900">{user.name}</h1>
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">Tour Guide</span>
                </div>
                {user.email && (
                  <p className="text-sm text-slate-500 truncate">{user.email}</p>
                )}
                {user.phone && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats - Horizontal Cards */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {/* Rating Stat */}
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {statsLoading ? (
                  <div className="h-5 w-8 animate-pulse rounded bg-amber-200" />
                ) : (
                  <span className="text-lg font-bold text-amber-700">{displayRating}</span>
                )}
              </div>
              <p className="mt-1 text-xs font-medium text-amber-700/80">Rating</p>
            </div>

            {/* Trips Stat */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 text-center">
              {statsLoading ? (
                <div className="h-5 w-8 animate-pulse rounded bg-blue-200" />
              ) : (
                <span className="text-lg font-bold text-blue-700">{displayTrips}</span>
              )}
              <p className="mt-1 text-xs font-medium text-blue-700/80">Trip</p>
              <p className="mt-0.5 text-[10px] text-blue-600/70">Selesai</p>
            </div>

            {/* Join Date Stat */}
            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 p-3 text-center">
              <div className="flex items-center justify-center">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              {statsLoading ? (
                <div className="mt-1 h-4 w-12 animate-pulse rounded bg-purple-200" />
              ) : displayJoinDate ? (
                <p className="mt-1 text-xs font-bold text-purple-700">{displayJoinDate}</p>
              ) : (
                <p className="mt-1 text-xs font-medium text-purple-700/80">-</p>
              )}
              <p className="mt-0.5 text-[10px] text-purple-600/70">Bergabung</p>
            </div>
          </div>

          {/* Wallet Card - Prominent */}
          <Link
            href={`/${locale}/guide/wallet`}
            className="mt-4 block rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 shadow-sm transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-50">Saldo Dompet</p>
                  <p className="mt-0.5 text-xl font-bold text-white">
                    {walletLoading ? (
                      <span className="inline-block h-6 w-24 animate-pulse rounded bg-emerald-400/50" />
                    ) : (
                      `Rp ${Number(wallet?.balance ?? 0).toLocaleString('id-ID')}`
                    )}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/80" />
            </div>
          </Link>
        </CardContent>
      </Card>


      {/* Guide Badges & Level - Clickable to Leaderboard */}
      <div>
        <Link href={`/${locale}/guide/leaderboard`} className="block">
          <GuideBadges locale={locale} />
        </Link>
      </div>

      {/* Training Widget - Only show if has active training */}
      {hasActiveTraining && <TrainingWidget locale={locale} />}

      {/* Menu Sections - Improved Structure with Accordion */}
      {menuItemsLoading ? (
        <div className="p-4 text-center text-sm text-slate-500">
          Memuat menu items...
        </div>
      ) : menuItemsData?.menuItems && menuItemsData.menuItems.length > 0 ? (
        <Accordion type="multiple" defaultOpen={true}>
          {menuItemsData.menuItems.map((section: MenuSection, sectionIndex: number) => {
            // Remove duplicates by href within section
            const uniqueItems = (section.items as MenuItem[]).filter(
              (item, index, self) => index === self.findIndex((i) => i.href === item.href)
            );

            // Sections yang selalu expanded (sedikit item)
            const alwaysExpandedSections = ['Akun', 'Dukungan', 'Pengaturan'];
            const shouldCollapse = !alwaysExpandedSections.includes(section.section) && uniqueItems.length > 2;

            // Filter items based on context
            const filteredItems = uniqueItems.filter((item) => {
              // Hide Onboarding jika sudah selesai
              if (item.href === '/guide/onboarding' && !needsOnboarding) {
                return false;
              }
              // Hide Performance menu item (sudah terintegrasi di Insight Pribadi)
              // User bisa akses performance metrics langsung dari Insight Pribadi
              if (item.href === '/guide/performance') {
                return false;
              }
              // Add Leaderboard to Insight Pribadi section if not exists
              // (Leaderboard bisa diakses dari Badges widget, tapi juga bisa di menu)
              return true;
            });

            // Skip section jika tidak ada items setelah filtering
            if (filteredItems.length === 0) {
              return null;
            }
            
            // Create unique value for accordion to avoid conflicts
            // Use section name directly (should be unique: 'Akun', 'Pengaturan')
            const sectionValue = section.section;
            
            return (
              <AccordionItem
                key={`accordion-${section.section}-${sectionIndex}`}
                value={sectionValue}
                defaultOpen={!shouldCollapse}
                className={cn(sectionIndex > 0 && 'mt-2')}
              >
                <AccordionTrigger value={sectionValue} className="px-4 py-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                    {section.section}
                  </h2>
                </AccordionTrigger>
                <AccordionContent value={sectionValue}>
                  <nav className="divide-y divide-slate-100" aria-label={section.section}>
                    {filteredItems.map((item, itemIndex) => {
                      const IconComponent = iconMap[item.icon_name] || FileText;
                      return (
                        <Link
                          key={`${section.section}-${item.href}`}
                          href={`/${locale}${item.href}`}
                          className={cn(
                            'group flex min-h-[60px] items-center gap-4 px-4 py-3.5 transition-colors',
                            'hover:bg-slate-50 active:bg-slate-100',
                            itemIndex === filteredItems.length - 1 && 'rounded-b-lg',
                          )}
                          aria-label={item.label}
                        >
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors">
                            <IconComponent className="h-5 w-5 text-slate-700" aria-hidden="true" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-slate-900">{item.label}</div>
                              {/* Badge indicator untuk items dengan updates (future enhancement) */}
                            </div>
                            {item.description && (
                              <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                                {item.description}
                              </div>
                            )}
                          </div>
                          <ChevronRight
                            className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </Link>
                      );
                    })}
                  </nav>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="p-4 text-center text-sm text-slate-500">
          Memuat menu items...
        </div>
      )}

      {/* Logout Button - Enhanced */}
      <div className="pt-2">
        <Button
          variant="outline"
          className={cn(
            'h-12 w-full border-red-200 bg-white text-red-600',
            'hover:bg-red-50 hover:border-red-300 hover:text-red-700',
            'active:scale-[0.98]',
          )}
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          <span className="font-semibold">Keluar</span>
        </Button>
      </div>

      {/* Version Info - Subtle */}
      <p className="py-2 text-center text-xs text-slate-400" aria-label="App version">
        Guide App v1.0.0
      </p>
    </div>
  );
}
