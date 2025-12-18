/**
 * Inbox Page - Pesan & Notifikasi
 * Central untuk semua komunikasi (seperti Gojek/Grab)
 */

import { Bell, Inbox, MessageCircle } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Inbox - Aero Travel',
};

export default async function InboxPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  return (
    <div className="flex flex-col pb-4">
      {/* Header */}
      <div className="px-4 pb-4 pt-5">
        <h1 className="text-xl font-bold">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Pesan dan notifikasi Anda
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 px-4">
        <button className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
          Semua
        </button>
        <button className="flex-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-muted-foreground dark:bg-slate-800">
          Promo
        </button>
        <button className="flex-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-muted-foreground dark:bg-slate-800">
          Trip
        </button>
      </div>

      {/* Empty State */}
      {!user ? (
        <div className="px-4">
          <div className="flex flex-col items-center rounded-2xl bg-white p-8 text-center dark:bg-slate-800">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-sm font-semibold">Login untuk Melihat</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Masuk untuk melihat pesan dan notifikasi
            </p>
            <Link
              href={`/${locale}/login`}
              className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white"
            >
              Masuk
            </Link>
          </div>
        </div>
      ) : (
        <div className="px-4">
          {/* Sample notifications */}
          <div className="space-y-2">
            {/* Placeholder messages */}
            <div className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="mb-1 text-xs font-semibold">Selamat Datang!</p>
                <p className="text-xs text-muted-foreground">
                  Terima kasih telah bergabung dengan AeroTravel
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Baru saja
                </p>
              </div>
            </div>

            {/* Empty state after sample */}
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800">
              <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Belum ada pesan lainnya
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
