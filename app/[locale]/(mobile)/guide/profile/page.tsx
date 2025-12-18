/**
 * Guide Profile Page
 * Route: /[locale]/guide/profile
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { GuideProfileClient } from './profile-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Profil - Guide App',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/profile`,
    },
  };
}

export default async function GuideProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <GuideProfileClient
        locale={locale}
        user={{
          id: user.id,
          name: user.profile?.full_name || user.email?.split('@')[0] || 'Guide',
          email: user.email || '',
          phone: user.profile?.phone || '',
          avatar: user.profile?.avatar_url || '',
        }}
      />
    </Container>
  );
}
