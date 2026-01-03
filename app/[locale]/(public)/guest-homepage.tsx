'use client';

/**
 * Guest Homepage - Premium Marketing Page
 * Modern, engaging, conversion-focused
 */

import {
    ArrowRight,
    Award,
    CheckCircle,
    MapPin,
    Shield,
    Sparkles,
    Star,
    Users
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

type FeaturedPackage = {
  name: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  emoji: string;
  tag: string;
  gradient: string;
  slug: string;
};

type GuestHomepageProps = {
  locale: string;
  featuredPackages?: FeaturedPackage[];
};

// Fallback data if no packages from DB
const defaultFeaturedDestinations: FeaturedPackage[] = [
  {
    name: 'Pahawang',
    location: 'Lampung',
    price: 450000,
    rating: 0,
    reviews: 0,
    emoji: '🏝️',
    tag: 'Populer',
    gradient: 'from-blue-500 to-cyan-500',
    slug: 'pahawang',
  },
  {
    name: 'Kiluan',
    location: 'Lampung',
    price: 550000,
    rating: 0,
    reviews: 0,
    emoji: '🐬',
    tag: 'Best Seller',
    gradient: 'from-teal-500 to-emerald-500',
    slug: 'kiluan',
  },
  {
    name: 'Labuan Bajo',
    location: 'NTT',
    price: 3500000,
    rating: 0,
    reviews: 0,
    emoji: '🦎',
    tag: 'Premium',
    gradient: 'from-purple-500 to-pink-500',
    slug: 'labuan-bajo',
  },
];

const features = [
  {
    icon: Shield,
    title: 'Aman & Terpercaya',
    description: 'Standar keselamatan tinggi',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Award,
    title: 'Guide Profesional',
    description: 'Tim berpengalaman & berlisensi',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Star,
    title: 'Rating 4.9/5',
    description: 'Dari 1000+ traveler',
    color: 'from-amber-500 to-orange-500',
  },
];

const openPrograms = [
  {
    icon: Award,
    title: 'Program Tour Guide',
    description:
      'Bergabung sebagai guide profesional Aero dan handle trip resmi Aero Travel.',
    href: '/guide',
    badge: 'Open Recruitment',
  },
  {
    icon: Users,
    title: 'Program Mitra B2B',
    description:
      'Untuk biro perjalanan / agent yang ingin menjual paket Aero secara resmi.',
    href: '/partner',
    badge: 'Untuk Travel Agent',
  },
  {
    icon: Shield,
    title: 'Program Corporate Travel',
    description:
      'Solusi corporate travel untuk perusahaan, dengan approval & invoice terpusat.',
    href: '/corporate',
    badge: 'Untuk Perusahaan',
  },
  {
    icon: Users,
    title: 'Program Influencer Trip',
    description:
      'Untuk KOL / Influencer yang ingin membuat trip eksklusif bersama komunitasnya.',
    href: '/influencer',
    badge: 'KOL Program',
  },
];

export function GuestHomepage({ locale, featuredPackages }: GuestHomepageProps) {
  const featuredDestinations = featuredPackages && featuredPackages.length > 0 
    ? featuredPackages 
    : defaultFeaturedDestinations;

  // Calculate average rating from featured packages
  const avgRating = featuredDestinations.length > 0
    ? featuredDestinations.reduce((sum, p) => sum + p.rating, 0) / featuredDestinations.length
    : 0;

  return (
    <div className="flex flex-col">
      {/* Hero Section - Premium */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-blue-50 to-cyan-50 px-4 pb-8 pt-6 dark:from-primary/20 dark:via-slate-900 dark:to-slate-900">
        {/* Decorative background */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative">
          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary shadow-lg">
            <Sparkles className="h-3 w-3" />
            #1 Marine Travel Lampung
          </div>

          {/* Headline */}
          <h1 className="mb-2 text-3xl font-bold leading-tight text-foreground">
            Jelajahi Keindahan
            <span className="mt-1 block bg-gradient-to-r from-primary to-cyan-600 bg-clip-text text-transparent">
              Laut Indonesia
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-6 text-sm text-muted-foreground">
            Pengalaman wisata bahari premium dengan standar keselamatan tinggi
            dan guide profesional
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <Link href={`/${locale}/register`} className="flex-1">
              <Button className="h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-primary to-blue-600 font-semibold shadow-lg shadow-primary/25 active:scale-95">
                Daftar Gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/${locale}/packages`}>
              <Button
                variant="outline"
                className="h-12 rounded-2xl border-2 px-6 font-semibold active:scale-95"
              >
                Lihat Paket
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="px-4 py-5">
        <div className="flex justify-between rounded-2xl bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm ring-1 ring-slate-100 dark:from-slate-800 dark:to-slate-800 dark:ring-slate-700">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">500+</p>
            <p className="text-xs text-muted-foreground">Trip Selesai</p>
          </div>
          <div className="h-auto w-px bg-border" />
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">10K+</p>
            <p className="text-xs text-muted-foreground">Happy Travelers</p>
          </div>
          <div className="h-auto w-px bg-border" />
          <div className="text-center">
            <p className="flex items-center justify-center gap-1 text-xl font-bold text-foreground">
              {avgRating > 0 ? avgRating.toFixed(1) : '-'}
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="pb-6">
        <div className="mb-3 flex items-center justify-between px-4">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Destinasi Populer
            </h2>
            <p className="text-xs text-muted-foreground">
              Pilihan favorit traveler
            </p>
          </div>
          <Link
            href={`/${locale}/packages`}
            className="text-xs font-semibold text-primary"
          >
            Lihat Semua
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {featuredDestinations.map((dest, idx) => (
            <Link
              key={idx}
              href={`/${locale}/packages/detail/${dest.slug}`}
              className="group w-44 shrink-0 active:scale-95"
            >
              <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
                {/* Image/Emoji with gradient */}
                <div
                  className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${dest.gradient}`}
                >
                  <span className="text-5xl drop-shadow-lg">{dest.emoji}</span>
                  {/* Tag */}
                  <div className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-xs font-bold text-primary backdrop-blur-sm">
                    {dest.tag}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <p className="mb-0.5 text-sm font-bold text-foreground">
                    {dest.name}
                  </p>
                  <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {dest.location}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Mulai dari
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(dest.price)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-foreground">
                          {dest.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dest.reviews} ulasan
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features - Why Choose Us */}
      <section className="px-4 pb-6">
        <h2 className="mb-3 text-base font-bold text-foreground">
          Kenapa Pilih Kami?
        </h2>
        <div className="space-y-3">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {feature.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="px-4 pb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-cyan-600 p-6 text-white">
          {/* Decorative elements */}
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-xs font-bold backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              PROMO SPESIAL
            </div>
            <p className="mb-1 text-2xl font-bold">Diskon 20%</p>
            <p className="mb-4 text-sm text-white/90">
              Khusus trip pertama kamu! Gunakan kode{' '}
              <span className="font-mono font-bold">AERO20</span>
            </p>
            <Link href={`/${locale}/register`}>
              <Button
                size="lg"
                className="h-11 gap-2 rounded-2xl bg-white font-semibold text-primary shadow-lg hover:bg-white/90 active:scale-95"
              >
                Daftar & Klaim Promo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 pb-6">
        <h2 className="mb-2 text-base font-bold text-foreground">
          Kata Mereka
        </h2>
        <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {[
            {
              name: 'Sarah',
              trip: 'Pahawang',
              rating: 5,
              text: 'Pengalaman luar biasa! Guide ramah dan destinasi cantik banget.',
            },
            {
              name: 'Budi',
              trip: 'Kiluan',
              rating: 5,
              text: 'Worth it banget! Lumba-lumba nya banyak dan air jernih.',
            },
          ].map((testimonial, idx) => (
            <div key={idx} className="w-64 shrink-0 px-1">
              <div className="h-full rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.trip}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3 w-3 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {testimonial.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Open Programs - Guide / Partner / Corporate / Influencer */}
      <section className="px-4 pb-6">
        <h2 className="mb-2 text-base font-bold text-foreground">
          Program Kerja Sama & Karir
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Untuk kamu yang ingin kerja sama lebih jauh dengan Aero Travel.
        </p>
        <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {openPrograms.map((program) => {
            const Icon = program.icon;
            return (
              <Link
                key={program.title}
                href={`/${locale}${program.href}`}
                className="w-64 shrink-0 px-1 active:scale-[0.98]"
              >
                <div className="flex h-full flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {program.title}
                        </p>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {program.badge}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {program.description}
                      </p>
                    </div>
                  </div>
                  <p className="pt-1 text-xs font-semibold text-primary">
                    Pelajari program →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-white p-6 text-center shadow-lg ring-1 ring-slate-100 dark:from-slate-800 dark:to-slate-800 dark:ring-slate-700">
          <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h3 className="mb-1 text-lg font-bold text-foreground">
            Siap Berpetualang?
          </h3>
          <p className="mb-5 text-sm text-muted-foreground">
            Bergabung dengan 10,000+ traveler yang sudah mempercayai kami
          </p>
          <Link href={`/${locale}/register`}>
            <Button className="h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-primary to-blue-600 font-semibold shadow-lg active:scale-95">
              Mulai Sekarang
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Scroll to hide scrollbar */}
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
