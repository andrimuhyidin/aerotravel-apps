'use client';

/**
 * Customer Dashboard - Super Apps Style
 * Menu services 2 baris + Lainnya, Promo Slider
 * With real booking data integration
 */

import { format, formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
    ArrowRight,
    Bell,
    Calendar,
    Camera,
    ChevronLeft,
    ChevronRight,
    Download,
    Gift,
    Grid3X3,
    Heart,
    History,
    MapPin,
    MessageCircle,
    Package,
    Sparkles,
    Star,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/utils/logger';

type CustomerDashboardProps = {
  locale: string;
  userName: string;
};

type UpcomingTrip = {
  id: string;
  code: string;
  tripDate: string;
  totalPax: number;
  totalAmount: number;
  status: string;
  package: {
    id: string;
    name: string;
    slug: string;
    destination: string;
    duration: string;
  } | null;
};

type UserStats = {
  upcomingTrips: number;
  completedTrips: number;
  totalSpent: number;
  aeroPoints: number;
};

type ActivityItem = {
  id: string;
  type: 'booking' | 'points' | 'review' | 'referral';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
};

type RecommendedPackage = {
  id: string;
  name: string;
  slug: string;
  destination: string;
  price: number;
  thumbnailUrl: string | null;
  rating: number;
  reviewCount: number;
};

// Super Apps Services - Sesuai PRD MyAeroTravel
const superAppsServices = [
  // Row 1 - Core Services
  { icon: Package, label: 'Paket Wisata', href: '/packages', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Calendar, label: 'Booking', href: '/book', gradient: 'from-green-500 to-emerald-500' },
  { icon: History, label: 'Riwayat Trip', href: '/my-trips', gradient: 'from-purple-500 to-pink-500' },
  { icon: Wallet, label: 'AeroPoints', href: '/loyalty', gradient: 'from-amber-500 to-orange-500' },
  // Row 2 - Social & Growth Features
  { icon: Users, label: 'Travel Circle', href: '/travel-circle', gradient: 'from-teal-500 to-cyan-500' },
  { icon: Sparkles, label: 'Split Bill', href: '/split-bill', gradient: 'from-indigo-500 to-purple-500' },
  { icon: Star, label: 'Referral', href: '/referral', gradient: 'from-yellow-500 to-amber-500' },
  // More in modal
  { icon: Gift, label: 'Voucher', href: '/account/vouchers', gradient: 'from-pink-500 to-rose-500' },
  { icon: Camera, label: 'Gallery', href: '/gallery', gradient: 'from-orange-500 to-red-500' },
];

// Promo Data
const promos = [
  { id: 1, title: 'Diskon 20%', subtitle: 'Trip Pertama Kamu', code: 'AERO20', gradient: 'from-primary to-blue-600', badge: 'HOT' },
  { id: 2, title: 'Dapat 50K', subtitle: 'Ajak Teman Liburan', code: 'Per Teman', gradient: 'from-green-500 to-emerald-500', badge: 'REWARD' },
  { id: 3, title: 'Cashback 15%', subtitle: 'Pakai AeroPoints', code: 'CASHBACK', gradient: 'from-amber-500 to-orange-500', badge: 'POINTS' },
  { id: 4, title: 'Gratis Bagasi', subtitle: 'Booking Paket Premium', code: 'PREMIUM', gradient: 'from-purple-500 to-pink-500', badge: 'NEW' },
];

export function CustomerDashboard({ locale, userName }: CustomerDashboardProps) {
  const [showAllServices, setShowAllServices] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);
  const promoRef = useRef<HTMLDivElement>(null);
  
  // Real data states
  const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedPackage[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  // Fetch user data
  useEffect(() => {
    fetchUpcomingTrips();
    fetchUserStats();
    fetchActivityFeed();
    fetchRecommendations();
  }, []);

  const fetchUpcomingTrips = async () => {
    try {
      const res = await fetch('/api/user/bookings?status=upcoming&limit=3');
      if (res.ok) {
        const data = await res.json();
        setUpcomingTrips(data.bookings || []);
      }
    } catch (error) {
      logger.error('Failed to fetch upcoming trips', error);
    } finally {
      setLoadingTrips(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const res = await fetch('/api/user/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      logger.error('Failed to fetch user stats', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchActivityFeed = async () => {
    try {
      const res = await fetch('/api/user/activity?limit=5');
      if (res.ok) {
        const data = await res.json();
        setActivityFeed(data.activities || []);
      }
    } catch (error) {
      logger.error('Failed to fetch activity feed', error);
      // Set sample data for demo
      setActivityFeed([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/public/packages?featured=true&limit=4');
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.packages || []);
      }
    } catch (error) {
      logger.error('Failed to fetch recommendations', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return { icon: Calendar, color: 'bg-blue-100 text-blue-600' };
      case 'points':
        return { icon: Wallet, color: 'bg-amber-100 text-amber-600' };
      case 'review':
        return { icon: Star, color: 'bg-purple-100 text-purple-600' };
      case 'referral':
        return { icon: Users, color: 'bg-green-100 text-green-600' };
      default:
        return { icon: Bell, color: 'bg-slate-100 text-slate-600' };
    }
  };

  // Auto-slide promo
  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Show first 7 items + "Lainnya" button (2 rows x 4 = 8 slots)
  const visibleServices = superAppsServices.slice(0, 7);

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      {/* Greeting Banner */}
      <section className="bg-gradient-to-br from-primary to-blue-600 px-4 py-4">
        <h1 className="text-base font-bold text-white">Halo, {userName}! 👋</h1>
        <p className="text-xs text-white/80">Mau kemana hari ini?</p>
      </section>

      {/* Super Apps Services - 2 Rows Max */}
      <section className="px-4 py-5">
        <div className="rounded-3xl bg-white p-4 shadow-lg dark:bg-slate-800">
          <h2 className="mb-3 text-sm font-bold text-foreground">Layanan Kami</h2>
          <div className="grid grid-cols-4 gap-4">
            {visibleServices.map((service) => (
              <Link
                key={service.label}
                href={`/${locale}${service.href}`}
                className="flex flex-col items-center gap-1.5 active:scale-95"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md ${service.gradient}`}>
                  <service.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-center text-[10px] font-medium leading-tight text-foreground">{service.label}</span>
              </Link>
            ))}
            {/* Lainnya Button */}
            <button
              onClick={() => setShowAllServices(true)}
              className="flex flex-col items-center gap-1.5 active:scale-95"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 shadow-md dark:bg-slate-700">
                <Grid3X3 className="h-6 w-6 text-slate-600 dark:text-slate-300" />
              </div>
              <span className="text-center text-[10px] font-medium leading-tight text-foreground">Lainnya</span>
            </button>
          </div>
        </div>
      </section>

      {/* All Services Bottom Sheet */}
      <Sheet open={showAllServices} onOpenChange={setShowAllServices}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-10">
          <SheetHeader className="mb-4">
            <SheetTitle>Semua Layanan</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-4">
            {superAppsServices.map((service) => (
              <Link
                key={service.label}
                href={`/${locale}${service.href}`}
                className="flex flex-col items-center gap-1.5 active:scale-95"
                onClick={() => setShowAllServices(false)}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md ${service.gradient}`}
                >
                  <service.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-center text-[10px] font-medium leading-tight text-foreground">
                  {service.label}
                </span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Points & Rewards Banner */}
      <section className="px-4 pb-4">
        <Link href={`/${locale}/loyalty`}>
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-4 text-white active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <Wallet className="h-6 w-6" />
              <div>
                <p className="text-xs font-semibold opacity-90">AeroPoints</p>
                {loadingStats ? (
                  <Skeleton className="h-8 w-16 bg-white/30" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.aeroPoints?.toLocaleString('id-ID') || 0}</p>
                )}
              </div>
            </div>
            <div className="text-xs font-semibold">Tukar →</div>
          </div>
        </Link>
      </section>

      {/* Quick Stats with Trends */}
      {stats && (stats.completedTrips > 0 || stats.upcomingTrips > 0) && (
        <section className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white p-3 text-center shadow-sm dark:bg-slate-800 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-lg font-bold text-primary">{stats.upcomingTrips}</p>
                <p className="text-[10px] text-muted-foreground">Trip Mendatang</p>
              </div>
              {stats.upcomingTrips > 0 && (
                <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-primary/10" />
              )}
            </div>
            <div className="rounded-xl bg-white p-3 text-center shadow-sm dark:bg-slate-800 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-lg font-bold text-green-600">{stats.completedTrips}</p>
                  {stats.completedTrips >= 3 && (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">Trip Selesai</p>
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 text-center shadow-sm dark:bg-slate-800">
              <p className="text-lg font-bold text-amber-600">{stats.aeroPoints.toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-muted-foreground">AeroPoints</p>
            </div>
          </div>
        </section>
      )}

      {/* Trip Mendatang */}
      <section className="px-4 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Trip Mendatang</h2>
          <Link
            href={`/${locale}/my-trips`}
            className="text-xs font-semibold text-primary"
          >
            Lihat Semua
          </Link>
        </div>

        {loadingTrips ? (
          <div className="space-y-2">
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : upcomingTrips.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-2 text-3xl">🏖️</div>
            <p className="mb-1 text-sm font-semibold text-foreground">
              Belum Ada Trip
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              Booking trip pertamamu sekarang!
            </p>
            <Link href={`/${locale}/book`}>
              <Button size="sm" className="h-10 gap-1 rounded-xl">
                <Calendar className="h-4 w-4" />
                Booking Sekarang
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingTrips.map((trip) => (
              <Link key={trip.id} href={`/${locale}/my-trips/${trip.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow active:scale-[0.99]">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0">
                        <span className="text-2xl">🏝️</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm truncate">
                            {trip.package?.name || 'Paket Wisata'}
                          </h3>
                          <Badge
                            variant={trip.status === 'paid' ? 'default' : 'secondary'}
                            className="text-[10px] shrink-0"
                          >
                            {trip.status === 'paid' ? 'Lunas' : 
                             trip.status === 'confirmed' ? 'Terkonfirmasi' : 
                             'Pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {trip.package?.destination || '-'}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3 text-primary" />
                            <span className="font-medium">
                              {format(new Date(trip.tripDate), 'd MMM yyyy', { locale: localeId })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {trip.totalPax} orang
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions for each trip */}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(`/api/user/trips/${trip.id}/documents/voucher`, '_blank');
                      toast.success('Mengunduh voucher...');
                    }}
                  >
                    <Download className="h-3 w-3" />
                    Voucher
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1"
                    asChild
                  >
                    <a
                      href={`https://wa.me/6285157787800?text=Halo, saya ingin bertanya tentang booking ${trip.code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle className="h-3 w-3" />
                      Hubungi
                    </a>
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Activity Feed */}
      {activityFeed.length > 0 && (
        <section className="px-4 pb-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Aktivitas Terakhir</h2>
          </div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {activityFeed.slice(0, 5).map((activity, idx) => {
                const activityStyle = getActivityIcon(activity.type);
                const IconComponent = activityStyle.icon;
                return (
                  <div
                    key={activity.id}
                    className={`flex items-center gap-3 p-3 ${
                      idx < activityFeed.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${activityStyle.color}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(activity.timestamp), { locale: localeId, addSuffix: true })}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Promo Slider */}
      <section className="pb-4">
        <div className="mb-2 flex items-center justify-between px-4">
          <h2 className="text-sm font-bold text-foreground">Promo Untukmu</h2>
          <div className="flex gap-1">
            <button
              onClick={() => setPromoIndex((prev) => (prev - 1 + promos.length) % promos.length)}
              className="rounded-full bg-slate-100 p-1 active:bg-slate-200 dark:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPromoIndex((prev) => (prev + 1) % promos.length)}
              className="rounded-full bg-slate-100 p-1 active:bg-slate-200 dark:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden px-4">
          <div
            ref={promoRef}
            className="flex transition-transform duration-300"
            style={{ transform: `translateX(-${promoIndex * 100}%)` }}
          >
            {promos.map((promo) => (
              <Link key={promo.id} href={`/${locale}/packages`} className="w-full shrink-0 pr-3">
                <div className={`rounded-2xl bg-gradient-to-r ${promo.gradient} p-4 text-white`}>
                  <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold">
                    <Sparkles className="h-2.5 w-2.5" />
                    {promo.badge}
                  </div>
                  <p className="mb-0.5 text-lg font-bold">{promo.title}</p>
                  <p className="mb-2 text-xs opacity-90">{promo.subtitle}</p>
                  <div className="inline-block rounded-lg bg-white/20 px-2 py-1 font-mono text-xs font-bold">
                    {promo.code}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {/* Dots indicator */}
          <div className="mt-3 flex justify-center gap-1">
            {promos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPromoIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === promoIndex ? 'w-4 bg-primary' : 'w-1.5 bg-slate-300 dark:bg-slate-600'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <section className="px-4 pb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              <h2 className="text-sm font-bold text-foreground">Rekomendasi Untukmu</h2>
            </div>
            <Link
              href={`/${locale}/packages`}
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              Lihat Semua
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {recommendations.map((pkg) => (
              <Link
                key={pkg.id}
                href={`/${locale}/packages/detail/${pkg.slug}`}
                className="shrink-0 w-40"
              >
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800 h-full">
                  <div className="h-24 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                    {pkg.thumbnailUrl ? (
                      <img
                        src={pkg.thumbnailUrl}
                        alt={pkg.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">🏝️</span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-foreground line-clamp-1">
                      {pkg.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {pkg.destination}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs font-bold text-primary">
                        Rp {(pkg.price / 1000).toFixed(0)}K
                      </p>
                      <div className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        <span className="text-[9px] font-semibold text-muted-foreground">
                          {pkg.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Destinasi Populer */}
      <section className="px-4 pb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">
            Destinasi Populer
          </h2>
          <Link
            href={`/${locale}/packages`}
            className="text-xs font-semibold text-primary"
          >
            Lihat Semua
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {loadingRecommendations ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
                  <Skeleton className="h-20" />
                  <div className="p-2">
                    <Skeleton className="mb-1 h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </>
          ) : recommendations.length > 0 ? (
            recommendations.slice(0, 3).map((pkg) => {
              const emojis: Record<string, string> = {
                'Pulau Pahawang': '🏝️',
                'Teluk Kiluan': '🐬',
                'Labuan Bajo': '🦎',
                'Raja Ampat': '🪸',
              };
              const emoji = emojis[pkg.destination] || '🌊';
              const formatPrice = (price: number) => {
                if (price >= 1000000) return `${(price / 1000000).toFixed(1)}Jt`;
                return `${(price / 1000).toFixed(0)}K`;
              };
              return (
                <Link key={pkg.id} href={`/${locale}/packages/detail/${pkg.slug}`}>
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
                    <div className="flex h-20 items-center justify-center bg-slate-100 text-3xl dark:bg-slate-700">
                      {emoji}
                    </div>
                    <div className="p-2">
                      <p className="mb-1 truncate text-xs font-semibold text-foreground">
                        {pkg.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-primary">{formatPrice(pkg.price)}</p>
                        <div className="flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          <span className="text-[9px] font-semibold text-muted-foreground">
                            {pkg.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="col-span-3 text-center text-sm text-muted-foreground">
              Belum ada paket tersedia
            </p>
          )}
        </div>
      </section>

      {/* Scrollbar hide */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
