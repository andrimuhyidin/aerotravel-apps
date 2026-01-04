/**
 * Create Package Page
 * Route: /[locale]/console/products/new
 */

import { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { PackageForm } from '@/components/admin/package-form';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

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
    title: 'Create Package | Admin Console',
    description: 'Create a new travel package',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/products/new`,
    },
  };
}

export default async function NewPackagePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if user has permission
  const allowedRoles = ['super_admin', 'marketing', 'ops_admin'];
  if (!user.activeRole || !allowedRoles.includes(user.activeRole)) {
    redirect(`/${locale}/console`);
  }

  return (
    <Section>
      <Container>
        <div className="space-y-6 py-6">
          <div>
            <h1 className="text-3xl font-bold">Create New Package</h1>
            <p className="text-muted-foreground">
              Fill in the details to create a new travel package
            </p>
          </div>

          <PackageForm mode="create" />
        </div>
      </Container>
    </Section>
  );
}

