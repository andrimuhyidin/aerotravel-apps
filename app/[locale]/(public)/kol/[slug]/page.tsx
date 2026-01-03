/**
 * KOL Trip Detail Page
 * Route: /[locale]/kol/[slug]
 * Shows detailed KOL trip info with booking capability
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { createClient } from '@/lib/supabase/server';

import { KolTripDetailClient } from './kol-trip-detail-client';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  // Fetch KOL trip data for metadata
  const supabase = await createClient();
  const { data: kolTrip } = await supabase
    .from('kol_trips')
    .select(
      `
      kol_name,
      hero_image_url,
      packages (
        name,
        destination
      )
    `
    )
    .eq('slug', slug)
    .single();

  // Type assertion for package relation
  type PackageRelation = { name: string; destination: string } | null;
  const pkg = (kolTrip?.packages as PackageRelation) || null;
  const title = kolTrip
    ? `Trip Bareng ${kolTrip.kol_name} ke ${pkg?.destination || 'destinasi seru'} - Aero Travel`
    : 'KOL Trip - Aero Travel';
  const description = kolTrip
    ? `Gabung trip eksklusif bareng ${kolTrip.kol_name}! ${pkg?.name || 'Pengalaman liburan premium'} dengan komunitas yang asik.`
    : 'Trip eksklusif bareng KOL favorit kamu';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/kol/${slug}`,
      type: 'website',
      images: kolTrip?.hero_image_url
        ? [{ url: kolTrip.hero_image_url, width: 1200, height: 630 }]
        : undefined,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/kol/${slug}`,
    },
  };
}

export default async function KolTripDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-background">
      <Section className="py-0">
        <Container className="px-0 sm:px-4">
          <KolTripDetailClient locale={locale} slug={slug} />
        </Container>
      </Section>
    </div>
  );
}
