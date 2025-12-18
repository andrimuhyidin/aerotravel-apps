/**
 * Guide Edit Profile Page
 * Form untuk mengubah informasi profil guide
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { EditProfileForm } from './edit-profile-form';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Edit Profil - Guide App' };
}

export default async function EditProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Edit Profil</h1>
        <p className="mt-1 text-sm text-slate-600">Perbarui informasi profil Anda</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <EditProfileForm
            locale={locale}
            initialData={{
              name: user.profile?.full_name ?? user.email?.split('@')[0] ?? '',
              phone: user.profile?.phone ?? '',
              email: user.email ?? '',
            }}
          />
        </CardContent>
      </Card>
    </Container>
  );
}
