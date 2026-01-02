/**
 * Partner Branches Page
 * Route: /partner/branches
 * Multi-branch management for partner
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { BranchesClient } from './branches-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Branches | Partner Portal',
  description: 'Kelola cabang bisnis Anda',
};

export default async function BranchesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BranchesClient locale={locale} />;
}

