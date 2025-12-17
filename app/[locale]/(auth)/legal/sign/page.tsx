/**
 * Legal Consent Page
 * User must sign terms before first use
 * Route: /[locale]/legal/sign
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/supabase/server';

import { ConsentForm } from './consent-form';

export const metadata: Metadata = {
  title: 'Persetujuan Syarat & Ketentuan - Aero Travel',
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LegalSignPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if already consented
  const profile = user.profile as { consent_agreed?: boolean } | null;
  if (profile?.consent_agreed) {
    redirect(`/${locale}`);
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Syarat & Ketentuan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mohon baca dan setujui sebelum melanjutkan
        </p>
      </div>
      <ConsentForm locale={locale} userId={user.id} />
    </>
  );
}
