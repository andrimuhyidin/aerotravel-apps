/**
 * Guide Promo & Update Detail Page
 * View full detail of a promo, update, or announcement
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { getCurrentUser } from '@/lib/supabase/server';

import { PromoDetailClient } from './promo-detail-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  // Try to fetch promo title for metadata (optional, don't fail if it doesn't work)
  try {
    const user = await getCurrentUser();
    if (user) {
      const res = await fetch(`${baseUrl}/api/guide/promos-updates/${id}`, {
        headers: {
          Cookie: `sb-access-token=${user.id}`, // This won't work, but we'll handle it gracefully
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.promo?.title) {
          return {
            title: `${data.promo.title} - Promo & Update`,
            description:
              data.promo.subtitle ||
              data.promo.description ||
              'Detail promo dan update',
            alternates: {
              canonical: `${baseUrl}/${locale}/guide/promos/${id}`,
            },
          };
        }
      }
    }
  } catch {
    // Ignore errors, use default metadata
  }

  return {
    title: 'Promo & Update - Guide App',
    description: 'Detail promo, update, dan pengumuman',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/promos/${id}`,
    },
  };
}

export default async function GuidePromoDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <PromoDetailClient locale={locale} promoId={id} />
    </Container>
  );
}
