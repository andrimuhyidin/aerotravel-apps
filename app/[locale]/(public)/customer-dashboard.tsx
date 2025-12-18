'use client';

/**
 * Customer Dashboard - Super Apps Style
 * Menu services 2 baris + Lainnya, Promo Slider
 */

import {
    Calendar,
    Camera,
    ChevronLeft,
    ChevronRight,
    Gift,
    Grid3X3,
    History,
    Package,
    Sparkles,
    Star,
    Users,
    Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

type CustomerDashboardProps = {
  locale: string;
  userName: string;
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
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
            <div className="text-xs font-semibold">Tukar →</div>
          </div>
        </Link>
      </section>

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
      </section>

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
          {[
            { name: 'Pahawang', emoji: '🏝️', price: '450K', rating: '4.9' },
            { name: 'Kiluan', emoji: '🐬', price: '550K', rating: '4.8' },
            { name: 'Labuan Bajo', emoji: '🦎', price: '3.5Jt', rating: '4.9' },
          ].map((dest, idx) => (
            <Link key={idx} href={`/${locale}/packages`}>
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
                <div className="flex h-20 items-center justify-center bg-slate-100 text-3xl dark:bg-slate-700">
                  {dest.emoji}
                </div>
                <div className="p-2">
                  <p className="mb-1 text-xs font-semibold text-foreground">
                    {dest.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-primary">{dest.price}</p>
                    <div className="flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-[9px] font-semibold text-muted-foreground">
                        {dest.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
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
