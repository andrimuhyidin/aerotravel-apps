/**
 * Edit Profile Page
 * Route: /[locale]/profile
 * For admin users to edit their own profile
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { EditProfileClient } from './edit-profile-client';

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
  themeColor: '#000000',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Edit Profile - Aero Travel',
    description: 'Edit your profile information',
    alternates: {
      canonical: `${baseUrl}/${locale}/profile`,
    },
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Section>
      <Container>
        <div className="py-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground">
              Update your personal information and preferences
            </p>
          </div>

          <EditProfileClient
            userId={user.id}
            email={user.email || ''}
            initialData={{
              fullName: user.profile?.full_name || '',
              phone: user.profile?.phone || '',
              bio: (user.profile as { bio?: string } | null)?.bio || '',
              avatarUrl: user.profile?.avatar_url || '',
            }}
            locale={locale}
          />
        </div>
      </Container>
    </Section>
  );
}

