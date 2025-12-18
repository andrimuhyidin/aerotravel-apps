/**
 * Guide Earnings Page
 * Sekarang diarahkan ke Dompet (wallet) sebagai sumber tunggal pendapatan.
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { Card, CardContent } from '@/components/ui/card';
import { locales } from '@/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Pendapatan - Guide App' };
}

export default async function EarningsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-4">
      <h1 className="mb-4 text-xl font-bold">Pendapatan</h1>

      <Card className="border-0 shadow-sm">
        <CardContent className="space-y-3 p-4 text-sm text-slate-600">
          <p>
            Ringkasan pendapatan dan riwayat trip sekarang digabung di halaman{' '}
            <span className="font-semibold">Dompet Guide</span>. Di sana Anda bisa melihat
            saldo, riwayat pendapatan, serta mengajukan tarik dana.
          </p>
          <Link
            href={`/${locale}/guide/wallet`}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Buka Dompet Guide
          </Link>
        </CardContent>
      </Card>
    </Container>
  );
}
