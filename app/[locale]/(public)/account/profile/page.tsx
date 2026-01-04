/**
 * Customer Profile Page
 * Route: /[locale]/account/profile
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { ProfileClient } from './profile-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Edit Profil - Aero Travel',
    description: 'Kelola informasi profil Anda',
    alternates: {
      canonical: `${baseUrl}/${locale}/account/profile`,
    },
    robots: { index: false, follow: false },
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?redirect=/account/profile`);
  }

  const profile = user.profile as {
    full_name?: string;
    phone_number?: string;
    avatar_url?: string;
  } | null;

  return (
    <Section>
      <Container>
        <ProfileClient
          locale={locale}
          initialData={{
            fullName: profile?.full_name || '',
            email: user.email || '',
            phone: profile?.phone_number || '',
            avatarUrl: profile?.avatar_url || null,
          }}
        />
      </Container>
    </Section>
  );
}

