/**
 * Photo Gallery - Social Proof Gating
 * PRD 5.3.C - Social Proof Gating
 *
 * Route: /gallery/[tripId]
 * Access: Protected (Trip participants only)
 *
 * SEO Note: This page is noindex as it's private.
 * ImageGallery schema can be added when gallery becomes public.
 * Use generateImageGallerySchema from @/lib/seo/structured-data
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { createClient } from '@/lib/supabase/server';
import { JsonLd } from '@/components/seo/json-ld';
import { generateImageGallerySchema, generateBreadcrumbSchema } from '@/lib/seo/structured-data';

import { GalleryClient } from './gallery-client';

type Props = {
  params: Promise<{ locale: string; tripId: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, tripId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: `Trip Gallery #${tripId.slice(0, 8)} - Aero Travel`,
    description: 'Lihat dan download foto trip Anda',
    alternates: {
      canonical: `${baseUrl}/${locale}/gallery/${tripId}`,
      languages: {
        id: `${baseUrl}/id/gallery/${tripId}`,
        en: `${baseUrl}/en/gallery/${tripId}`,
        'x-default': `${baseUrl}/id/gallery/${tripId}`,
      },
    },
    robots: { index: false, follow: false }, // Private page
  };
}

export default async function GalleryPage({ params }: Props) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);

  // Fetch trip and photos for schema (even if page is noindex, good for sharing)
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  // Get trip info
  const { data: trip } = await supabase
    .from('trips')
    .select('id, trip_code, trip_date, packages(name, destination)')
    .eq('id', tripId)
    .single();

  // Get photos
  const { data: photos } = await supabase
    .from('trip_photos')
    .select('id, photo_url, caption, created_at')
    .eq('trip_id', tripId)
    .limit(50);

  // Generate ImageGallery schema
  const gallerySchema = photos && photos.length > 0
    ? generateImageGallerySchema(
        photos.map((photo) => ({
          url: photo.photo_url || `${baseUrl}/images/placeholder.jpg`,
          caption: photo.caption || undefined,
          alt: photo.caption || `Trip photo`,
          dateCreated: photo.created_at,
          location: (trip?.packages as { destination?: string } | null)?.destination,
        }))
      )
    : null;

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: '/' },
    { name: 'Trip Saya', url: `/${locale}/my-trips` },
    { name: `Gallery #${tripId.slice(0, 8)}`, url: `/${locale}/gallery/${tripId}` },
  ]);

  return (
    <>
      {gallerySchema && <JsonLd data={gallerySchema} />}
      <JsonLd data={breadcrumbSchema} />
      <GalleryClient tripId={tripId} locale={locale} />
    </>
  );
}
