/**
 * User Detail Page
 * Route: /[locale]/console/users/[userId]
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { hasRole } from '@/lib/session/active-role';
import { createAdminClient } from '@/lib/supabase/server';

import { UserDetailClient } from './user-detail-client';

type PageProps = {
  params: Promise<{ locale: string; userId: string }>;
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
    title: 'User Details - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/users/[userId]`,
    },
  };
}

export default async function UserDetailPage({ params }: PageProps) {
  const { locale, userId } = await params;
  setRequestLocale(locale);

  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
  if (!allowed) {
    redirect(`/${locale}/console`);
  }

  // Verify user exists using admin client to bypass RLS
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
          <UserDetailClient userId={userId} locale={locale} />
        </div>
      </Container>
    </Section>
  );
}

