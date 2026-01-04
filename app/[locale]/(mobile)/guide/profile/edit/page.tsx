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

import { EmergencyContactsClient } from '../emergency-contacts-client';
import { MedicalInfoClient } from '../medical-info-client';
import { DocumentsSectionClient } from './documents-section-client';
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

      <div className="space-y-4">
        {/* Informasi Profil */}
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
                nik: (user.profile?.nik as string | undefined) ?? '',
                address: (user.profile?.address as string | undefined) ?? '',
                avatar_url: (user.profile?.avatar_url as string | undefined) ?? '',
                // home_address removed - redundant with address for guides
                employee_number: (user.profile?.employee_number as string | undefined) ?? '',
                hire_date: user.profile?.hire_date
                  ? new Date(user.profile.hire_date).toISOString().split('T')[0]
                  : undefined,
                supervisor_id: (user.profile?.supervisor_id as string | undefined) ?? null,
              }}
            />
          </CardContent>
        </Card>

        {/* Kontak Darurat */}
        <EmergencyContactsClient />

        {/* Info Medis */}
        <MedicalInfoClient />

        {/* Dokumen */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Dokumen</CardTitle>
            <p className="mt-1 text-xs text-slate-500">Kelola dokumen yang diperlukan untuk Guide License</p>
          </CardHeader>
          <CardContent>
            <DocumentsSectionClient locale={locale} />
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

