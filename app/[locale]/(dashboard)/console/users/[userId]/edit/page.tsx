/**
 * Edit User Page
 * Route: /[locale]/console/users/[userId]/edit
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { createAdminClient } from '@/lib/supabase/server';

import { EditUserClient } from './edit-user-client';

type PageProps = {
  params: Promise<{ locale: string; userId: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, userId } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';
  
  return {
    title: 'Edit User - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/users/${userId}/edit`,
    },
  };
}

export default async function EditUserPage({ params }: PageProps) {
  const { locale, userId } = await params;
  setRequestLocale(locale);

  // Verify user exists
  const supabase = await createAdminClient();
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (!user) {
    notFound();
  }

  return (
    <Section>
      <Container>
        <div className="py-6">
          <EditUserClient userId={userId} locale={locale} />
        </div>
      </Container>
    </Section>
  );
}

