/**
 * Account Page - Profile & Settings
 * Shows different content for guest vs logged-in users
 */

import { ChevronRight, LogIn, LogOut, User } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { GuestMenuSections, LoggedInMenuSections } from './menu-sections';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Akun - Aero Travel',
  };
}

export default async function AccountPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  const profile = user?.profile as {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  } | null;

  if (user) {
    return (
      <LoggedInAccount locale={locale} profile={profile} email={user.email} />
    );
  }

  return <GuestAccount locale={locale} />;
}

// ============================================
// GUEST ACCOUNT VIEW
// ============================================
function GuestAccount({ locale }: { locale: string }) {
  return (
    <div className="flex flex-col pb-8">
      {/* Header */}
      <div className="px-5 pb-4 pt-6">
        <h1 className="text-xl font-bold">Akun</h1>
      </div>

      {/* Login CTA */}
      <div className="px-5 pb-6">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-white">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <User className="h-7 w-7" />
          </div>
          <h2 className="mb-1 text-lg font-bold">Masuk ke Akun</h2>
          <p className="mb-4 text-sm opacity-90">
            Login untuk menikmati kemudahan booking dan promo eksklusif
          </p>
          <div className="flex gap-3">
            <Link href={`/${locale}/login`} className="flex-1">
              <Button className="h-11 w-full gap-2 rounded-xl bg-white font-semibold text-primary hover:bg-white/90">
                <LogIn className="h-4 w-4" />
                Masuk
              </Button>
            </Link>
            <Link href={`/${locale}/register`} className="flex-1">
              <Button
                variant="outline"
                className="h-11 w-full rounded-xl border-white/30 font-semibold text-white hover:bg-white/10"
              >
                Daftar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-5">
        <GuestMenuSections locale={locale} />
      </div>

      {/* App Version */}
      <div className="mt-6 text-center text-xs text-muted-foreground">
        <p>AeroTravel v1.0.0</p>
      </div>
    </div>
  );
}

// ============================================
// LOGGED IN ACCOUNT VIEW
// ============================================
function LoggedInAccount({
  locale,
  profile,
  email,
}: {
  locale: string;
  profile: { full_name?: string; avatar_url?: string } | null;
  email?: string;
}) {
  const name = profile?.full_name || 'Traveler';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col pb-8">
      {/* Header */}
      <div className="px-5 pb-4 pt-6">
        <h1 className="text-xl font-bold">Akun</h1>
      </div>

      {/* Profile Card */}
      <div className="px-5 pb-6">
        <Link href={`/${locale}/account/profile`}>
          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
              {initials}
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold">{name}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>
      </div>

      {/* Menu Sections */}
      <div className="px-5">
        <LoggedInMenuSections locale={locale} />
      </div>

      {/* Logout Button */}
      <div className="mt-6 px-5">
        <form action={`/${locale}/logout`} method="POST">
          <Button
            type="submit"
            variant="outline"
            className="h-12 w-full gap-2 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </form>
      </div>

      {/* App Version */}
      <div className="mt-6 text-center text-xs text-muted-foreground">
        <p>AeroTravel v1.0.0</p>
      </div>
    </div>
  );
}
