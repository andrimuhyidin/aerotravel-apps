/**
 * Package Detail Page - Mobile Native Style
 * Route: /packages/[city]/[slug]
 */

import {
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  MapPin,
  MessageCircle,
  Share2,
  Star,
  Users,
  X,
} from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { locales } from '@/i18n';
import { createClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ locale: string; city: string; slug: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('packages')
    .select('name, description, destination')
    .eq('slug', slug)
    .single();

  const pkg = data as {
    name: string;
    description: string | null;
    destination: string;
  } | null;

  if (!pkg) {
    return { title: 'Package Not Found' };
  }

  return {
    title: `${pkg.name} - Aero Travel`,
    description: pkg.description || `Paket wisata ${pkg.destination}`,
  };
}

export default async function PackageDetailPage({ params }: Props) {
  const { locale, city, slug } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();

  type PackageDetail = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    destination: string;
    province: string;
    duration_days: number;
    duration_nights: number;
    min_pax: number;
    max_pax: number;
    package_type: string;
    average_rating: number | null;
    review_count: number | null;
    inclusions: string[] | null;
    exclusions: string[] | null;
    package_prices: {
      min_pax: number;
      max_pax: number;
      price_publish: number;
    }[];
  };

  // Get package with prices
  const { data } = await supabase
    .from('packages')
    .select(
      `
      *,
      package_prices (
        min_pax,
        max_pax,
        price_publish,
        price_nta
      )
    `
    )
    .eq('slug', slug)
    .single();

  const pkg = data as PackageDetail | null;

  if (!pkg) {
    notFound();
  }

  const prices = pkg.package_prices || [];
  const lowestPrice =
    prices.length > 0 ? Math.min(...prices.map((p) => p.price_publish)) : 0;
  const inclusions = pkg.inclusions || [];
  const exclusions = pkg.exclusions || [];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="flex flex-col pb-24">
      {/* Hero Image */}
      <div className="relative">
        <div className="aspect-[4/3] bg-gradient-to-br from-primary/30 to-aero-teal/30">
          <div className="flex h-full items-center justify-center text-7xl">
            🏝️
          </div>
        </div>

        {/* Back & Actions */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
          <Link
            href={`/${locale}/packages`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </Link>
          <div className="flex gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur">
              <Share2 className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Badge */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
            {pkg.package_type === 'open_trip' ? 'Open Trip' : 'Private'}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {(pkg.average_rating || 0).toFixed(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-5">
        {/* Title & Location */}
        <h1 className="mb-2 text-xl font-bold leading-tight">{pkg.name}</h1>
        <div className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {pkg.destination}, {pkg.province}
        </div>

        {/* Quick Info */}
        <div className="mb-5 flex gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">
              {pkg.duration_days}H{pkg.duration_nights}M
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">
              {pkg.min_pax}-{pkg.max_pax} pax
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">Setiap Hari</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">Deskripsi</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {pkg.description ||
              'Paket wisata premium dengan pengalaman terbaik.'}
          </p>
        </div>

        {/* Price Tiers */}
        {prices.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold">Harga</h2>
            <div className="space-y-2">
              {prices.map((tier, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-muted/50 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {tier.min_pax}-{tier.max_pax} orang
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {formatPrice(tier.price_publish)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inclusions */}
        {inclusions.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold">Sudah Termasuk</h2>
            <div className="space-y-2">
              {inclusions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exclusions */}
        {exclusions.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold">Tidak Termasuk</h2>
            <div className="space-y-2">
              {exclusions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <X className="h-3 w-3 text-red-600" />
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="rounded-2xl bg-muted/50 p-4">
          <p className="mb-2 text-sm font-semibold">Ada Pertanyaan?</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Hubungi tim kami untuk info lebih lanjut
          </p>
          <a
            href="https://wa.me/6281234567890"
            className="flex items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-medium text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Chat WhatsApp
          </a>
        </div>
      </div>

      {/* Bottom Fixed CTA */}
      <div className="fixed bottom-16 left-0 right-0 z-40">
        <div className="mx-auto w-full max-w-md border-t bg-background px-5 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">Mulai dari</p>
              <p className="text-lg font-bold text-primary">
                {formatPrice(lowestPrice)}
                <span className="text-xs font-normal text-muted-foreground">
                  /pax
                </span>
              </p>
            </div>
            <Link href={`/${locale}/book?package=${slug}`} className="flex-1">
              <Button className="h-11 w-full rounded-xl font-semibold shadow-lg shadow-primary/25">
                Booking
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
