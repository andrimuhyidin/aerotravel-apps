/**
 * Admin: Role Applications Management
 * Route: /[locale]/console/users/role-applications
 * Manage role applications (approve/reject)
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { getCurrentUser, hasRole } from '@/lib/supabase/server';

import { RoleApplicationsClient } from './role-applications-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return {
    title: 'Role Applications - Console',
    description: 'Manage role applications and approvals',
  };
}

export default async function RoleApplicationsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  const allowed = await hasRole(['super_admin', 'ops_admin']);

  if (!user || !allowed) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <RoleApplicationsClient locale={locale} />;
}

