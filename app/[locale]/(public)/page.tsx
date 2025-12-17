/**
 * Homepage - Superapps Style
 * Guest: Marketing page
 * Customer: Personalized dashboard
 * Other roles: Redirect to respective dashboards
 */

import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Gift,
  Headphones,
  History,
  MapPin,
  Package,
  Star,
  Tag,
  Ticket,
  Wallet,
} from 'lucide-react';
import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('common');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: `${t('app_name')} - Integrated Travel Ecosystem`,
    description:
      'Best marine travel packages with high safety standards. Pahawang, Labuan Bajo, and other exotic destinations.',
    alternates: {
      canonical: `${baseUrl}/${locale}`,
    },
  };
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Get current user
  const user = await getCurrentUser();
  const profile = user?.profile as {
    role?: string;
    full_name?: string;
  } | null;
  const userRole = profile?.role;
  const userName = profile?.full_name?.split(' ')[0] || 'Traveler';

  // Redirect other roles to their dashboards
  if (userRole === 'guide') {
    redirect(`/${locale}/guide`);
  }
  if (userRole === 'mitra' || userRole === 'nta') {
    redirect(`/${locale}/mitra`);
  }
  if (
    userRole === 'super_admin' ||
    userRole === 'owner' ||
    userRole === 'manager' ||
    userRole === 'admin' ||
    userRole === 'finance' ||
    userRole === 'cs'
  ) {
    redirect(`/${locale}/console`);
  }

  // If logged in as customer, show superapps dashboard
  if (user && (!userRole || userRole === 'customer')) {
    return <CustomerDashboard locale={locale} userName={userName} />;
  }

  // Guest: Show marketing page
  return <GuestHomepage locale={locale} />;
}

// ============================================
// CUSTOMER SUPERAPPS DASHBOARD
// ============================================
function CustomerDashboard({
  locale,
  userName,
}: {
  locale: string;
  userName: string;
}) {
  const services = [
    {
      icon: Package,
      label: 'Paket',
      href: `/${locale}/packages`,
      color: 'bg-blue-500',
    },
    {
      icon: Calendar,
      label: 'Booking',
      href: `/${locale}/book`,
      color: 'bg-green-500',
    },
    {
      icon: Tag,
      label: 'Promo',
      href: `/${locale}/packages`,
      color: 'bg-orange-500',
    },
    {
      icon: History,
      label: 'Riwayat',
      href: `/${locale}/my-trips`,
      color: 'bg-purple-500',
    },
    {
      icon: Wallet,
      label: 'Points',
      href: `/${locale}/loyalty`,
      color: 'bg-yellow-500',
    },
    {
      icon: Gift,
      label: 'Referral',
      href: `/${locale}/referral`,
      color: 'bg-pink-500',
    },
    {
      icon: Ticket,
      label: 'Voucher',
      href: `/${locale}/packages`,
      color: 'bg-teal-500',
    },
    {
      icon: Headphones,
      label: 'Bantuan',
      href: `/${locale}/contact`,
      color: 'bg-gray-500',
    },
  ];

  const promos = [
    {
      title: 'Diskon 20%',
      subtitle: 'Trip Pertama',
      code: 'AERO20',
      bg: 'from-primary to-blue-600',
    },
    {
      title: 'Cashback 50K',
      subtitle: 'Min. 2 Pax',
      code: 'DUET50',
      bg: 'from-orange-500 to-red-500',
    },
  ];

  const destinations = [
    { name: 'Pahawang', emoji: '🏝️', price: 'Rp 450K' },
    { name: 'Kiluan', emoji: '🐬', price: 'Rp 550K' },
    { name: 'Labuan Bajo', emoji: '🦎', price: 'Rp 3.5Jt' },
  ];

  return (
    <div className="flex flex-col pb-4">
      {/* Greeting Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-5 pb-8 pt-4">
        <p className="text-sm text-white/80">Selamat datang,</p>
        <h1 className="text-xl font-bold text-white">Halo, {userName}! 👋</h1>

        {/* Search Bar */}
        <Link href={`/${locale}/packages`}>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/20 px-4 py-3 backdrop-blur">
            <MapPin className="h-5 w-5 text-white/70" />
            <span className="text-sm text-white/70">
              Mau liburan kemana hari ini?
            </span>
          </div>
        </Link>
      </div>

      {/* Service Grid */}
      <div className="-mt-4 px-5">
        <div className="rounded-2xl bg-white p-4 shadow-lg">
          <div className="grid grid-cols-4 gap-4">
            {services.map((service) => (
              <Link
                key={service.label}
                href={service.href}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${service.color}`}
                >
                  <service.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {service.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Trip Card */}
      <section className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Trip Mendatang</h2>
          <Link
            href={`/${locale}/my-trips`}
            className="text-xs font-medium text-primary"
          >
            Lihat Semua
          </Link>
        </div>
        <div className="mt-3 rounded-2xl border-2 border-dashed border-muted p-6 text-center">
          <p className="text-3xl">🏖️</p>
          <p className="mt-2 text-sm font-medium">Belum ada trip terjadwal</p>
          <p className="text-xs text-muted-foreground">
            Yuk booking trip pertamamu!
          </p>
          <Link href={`/${locale}/book`}>
            <Button size="sm" className="mt-4 h-9 gap-1 rounded-xl">
              Booking Sekarang
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Promo Carousel */}
      <section className="pt-6">
        <div className="mb-3 flex items-center justify-between px-5">
          <h2 className="text-base font-bold">Promo Untukmu</h2>
          <span className="text-xs text-muted-foreground">2 promo aktif</span>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2">
          {promos.map((promo, i) => (
            <div
              key={i}
              className={`w-64 shrink-0 rounded-2xl bg-gradient-to-r ${promo.bg} p-4 text-white`}
            >
              <p className="text-lg font-bold">{promo.title}</p>
              <p className="text-sm opacity-90">{promo.subtitle}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-lg bg-white/20 px-2 py-1 text-xs font-medium">
                  {promo.code}
                </span>
                <ChevronRight className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Destinations */}
      <section className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Destinasi Favorit</h2>
          <Link
            href={`/${locale}/packages`}
            className="text-xs font-medium text-primary"
          >
            Lihat Semua
          </Link>
        </div>
        <div className="mt-3 flex gap-3">
          {destinations.map((dest, i) => (
            <Link
              key={i}
              href={`/${locale}/packages`}
              className="flex flex-1 flex-col items-center rounded-2xl bg-muted/50 p-4"
            >
              <span className="text-3xl">{dest.emoji}</span>
              <p className="mt-1 text-xs font-semibold">{dest.name}</p>
              <p className="text-[10px] text-muted-foreground">{dest.price}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* AeroPoints Card */}
      <section className="px-5 pt-6">
        <Link href={`/${locale}/loyalty`}>
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 p-4 text-white">
            <div>
              <p className="text-xs font-medium opacity-90">AeroPoints Kamu</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Tukar Reward</span>
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}

// ============================================
// GUEST MARKETING HOMEPAGE
// ============================================
function GuestHomepage({ locale }: { locale: string }) {
  const destinations = [
    { name: 'Pahawang', price: 'Rp 450.000', rating: 4.9, emoji: '🏝️' },
    { name: 'Kiluan', price: 'Rp 550.000', rating: 4.8, emoji: '🐬' },
    { name: 'Labuan Bajo', price: 'Rp 3.500.000', rating: 4.9, emoji: '🦎' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/20 via-background to-background px-5 pb-6 pt-6">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-sm">
          🌊 #1 Marine Travel Lampung
        </div>
        <h1 className="mb-2 text-2xl font-bold leading-tight">
          Jelajahi Keindahan
          <span className="block text-primary">Laut Indonesia</span>
        </h1>
        <p className="mb-5 text-sm text-muted-foreground">
          Pengalaman wisata bahari premium dengan standar keselamatan tinggi
        </p>
        <div className="flex gap-3">
          <Link href={`/${locale}/register`} className="flex-1">
            <Button className="h-12 w-full gap-2 rounded-xl shadow-lg shadow-primary/25">
              Daftar Gratis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/packages`}>
            <Button variant="outline" className="h-12 rounded-xl px-6">
              Lihat Paket
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="px-5 pb-6">
        <div className="flex justify-between rounded-2xl bg-muted/50 p-4">
          <div className="text-center">
            <p className="text-lg font-bold">500+</p>
            <p className="text-[10px] text-muted-foreground">Trip</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">10K+</p>
            <p className="text-[10px] text-muted-foreground">Traveler</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">4.9★</p>
            <p className="text-[10px] text-muted-foreground">Rating</p>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="pb-6">
        <div className="mb-3 flex items-center justify-between px-5">
          <h2 className="text-base font-bold">Destinasi Populer</h2>
          <Link
            href={`/${locale}/packages`}
            className="text-xs font-medium text-primary"
          >
            Lihat Semua
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2">
          {destinations.map((dest, i) => (
            <Link key={i} href={`/${locale}/packages`} className="shrink-0">
              <div className="w-36 rounded-2xl bg-white p-3 shadow-md">
                <div className="mb-2 flex h-20 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-4xl">
                  {dest.emoji}
                </div>
                <p className="text-sm font-semibold">{dest.name}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-primary">{dest.price}</p>
                  <div className="flex items-center gap-0.5 text-[10px]">
                    <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                    {dest.rating}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="px-5 pb-6">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-blue-600 p-5 text-white">
          <p className="text-xs opacity-80">Promo Spesial</p>
          <p className="text-lg font-bold">Diskon 20% Trip Pertama!</p>
          <p className="mb-3 text-xs opacity-80">Kode: AERO20</p>
          <Link href={`/${locale}/register`}>
            <Button
              size="sm"
              className="h-9 gap-1 rounded-xl bg-white text-primary hover:bg-white/90"
            >
              Daftar & Klaim
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-8">
        <div className="rounded-2xl bg-muted/50 p-5 text-center">
          <p className="mb-1 text-base font-bold">Siap Berpetualang?</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Daftar sekarang dan nikmati kemudahan booking
          </p>
          <Link href={`/${locale}/register`}>
            <Button className="h-11 w-full gap-2 rounded-xl">
              Mulai Sekarang
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
