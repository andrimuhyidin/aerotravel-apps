/**
 * Package Comparison Page
 * Side-by-side comparison of selected packages
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CompareClient } from './compare-client';

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ids?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Bandingkan Paket',
    description: 'Bandingkan paket wisata untuk menemukan yang terbaik',
  };
}

export default async function ComparePage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { ids } = await searchParams;

  if (!ids) {
    notFound();
  }

  return <CompareClient locale={locale} packageIds={ids.split(',')} />;
}

