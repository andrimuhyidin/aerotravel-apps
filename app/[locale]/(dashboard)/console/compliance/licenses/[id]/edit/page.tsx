/**
 * Edit License Page
 * Route: /[locale]/console/compliance/licenses/[id]/edit
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { createAdminClient } from '@/lib/supabase/server';

import { EditLicenseClient } from './edit-license-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';
  
  return {
    title: 'Edit License - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/compliance/licenses/${id}/edit`,
    },
  };
}

export default async function EditLicensePage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Verify license exists using admin client
  const supabase = await createAdminClient();
  const { data: license } = await supabase
    .from('business_licenses')
    .select('id')
    .eq('id', id)
    .single();

  if (!license) {
    notFound();
  }

  return (
    <Section>
      <Container>
        <div className="py-6">
          <EditLicenseClient licenseId={id} locale={locale} />
        </div>
      </Container>
    </Section>
  );
}

