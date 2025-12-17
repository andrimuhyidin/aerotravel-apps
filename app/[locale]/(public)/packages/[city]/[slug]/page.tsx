/**
 * Package Detail Page
 * Route: /packages/[city]/[slug]
 */

import { ArrowLeft, Calendar, MapPin, Star, Users } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <>
      {/* Breadcrumb */}
      <Section className="border-b bg-muted/30">
        <Container>
          <div className="flex items-center gap-2 py-4 text-sm">
            <Link
              href={`/${locale}/packages`}
              className="flex items-center gap-1 text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{city}</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{pkg.name}</span>
          </div>
        </Container>
      </Section>

      {/* Hero */}
      <Section>
        <Container>
          <div className="grid gap-8 py-8 md:grid-cols-2">
            {/* Image */}
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-aero-teal/20">
              <div className="flex h-full items-center justify-center text-8xl">
                🏝️
              </div>
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {pkg.package_type === 'open_trip'
                      ? 'Open Trip'
                      : 'Private Trip'}
                  </span>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>4.9</span>
                  </div>
                </div>
                <h1 className="text-3xl font-bold">{pkg.name}</h1>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {pkg.destination}, {pkg.province}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {pkg.duration_days} Hari {pkg.duration_nights} Malam
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {pkg.min_pax} - {pkg.max_pax} orang
                </div>
              </div>

              <p className="text-muted-foreground">{pkg.description}</p>

              {/* Price */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Mulai dari</p>
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(lowestPrice)}
                  <span className="text-base font-normal text-muted-foreground">
                    /orang
                  </span>
                </p>
              </div>

              {/* CTA */}
              <div className="flex gap-4">
                <Link
                  href={`/${locale}/book?package=${slug}`}
                  className="flex-1"
                >
                  <Button size="lg" className="w-full">
                    Booking Sekarang
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  Hubungi Kami
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Price Tiers */}
      {prices.length > 0 && (
        <Section className="bg-muted/30">
          <Container>
            <div className="py-8">
              <h2 className="mb-6 text-2xl font-bold">Harga per Grup</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {prices.map((tier, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {tier.min_pax} - {tier.max_pax} orang
                        </span>
                      </div>
                      <p className="mt-2 text-2xl font-bold text-primary">
                        {formatPrice(tier.price_publish)}
                      </p>
                      <p className="text-sm text-muted-foreground">/orang</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* Inclusions & Exclusions */}
      <Section>
        <Container>
          <div className="grid gap-8 py-8 md:grid-cols-2">
            {/* Inclusions */}
            <div>
              <h2 className="mb-4 text-xl font-bold">Termasuk dalam Paket</h2>
              <ul className="space-y-2">
                {inclusions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 text-green-500">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Exclusions */}
            <div>
              <h2 className="mb-4 text-xl font-bold">Tidak Termasuk</h2>
              <ul className="space-y-2">
                {exclusions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 text-red-500">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA Bottom */}
      <Section className="bg-primary text-primary-foreground">
        <Container>
          <div className="flex flex-col items-center gap-4 py-12 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="text-2xl font-bold">Siap Berangkat?</h2>
              <p className="opacity-90">
                Booking sekarang dan nikmati pengalaman tak terlupakan!
              </p>
            </div>
            <Link href={`/${locale}/book?package=${slug}`}>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                Booking Sekarang
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
