/**
 * Corporate Packages Page
 * Route: /[locale]/corporate/packages
 * Package catalog for corporate employees to browse and book
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { PackagesCatalogClient } from './packages-catalog-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: 'Katalog Paket - Corporate Portal',
  description: 'Browse dan pilih paket perjalanan untuk booking corporate',
};

export default async function CorporatePackagesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="p-4">
      <PackagesCatalogClient locale={locale} />
    </div>
  );
}

