/**
 * Account Page - Profile & Settings
 * Premium design dengan lengkap sesuai standar industri
 */

import {
    Award,
    Bell,
    ChevronRight,
    CreditCard,
    Gift,
    Globe,
    HelpCircle,
    History,
    LogIn,
    LogOut,
    MessageCircle,
    Shield,
    Star,
    User,
    Users,
    Wallet
} from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Button } from '@/components/ui/button';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { AccountRoleSwitcher } from '@/components/account-role-switcher';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Akun - Aero Travel',
    description: 'Kelola akun dan preferensi Anda di Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/account`,
      languages: {
        id: `${baseUrl}/id/account`,
        en: `${baseUrl}/en/account`,
        'x-default': `${baseUrl}/id/account`,
      },
    },
    robots: { index: false, follow: false }, // Private page
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
    phone?: string;
    role?: string;
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
    <Section>
      <Container>
        <div className="flex flex-col pb-8">
          {/* Header */}
          <div className="pb-4 pt-5">
            <h1 className="text-xl font-bold">Akun</h1>
            <p className="text-sm text-muted-foreground">Login untuk akses fitur</p>
          </div>

          {/* Login CTA - Clean & Simple */}
          <div className="pb-5">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-blue-600 p-5 text-white">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <User className="h-6 w-6" />
          </div>
          <h2 className="mb-1 text-base font-bold">Masuk atau Daftar</h2>
          <p className="mb-4 text-xs text-white/90">
            Akses semua fitur dengan login
          </p>
          <div className="flex gap-2">
            <Link href={`/${locale}/login`} className="flex-1">
              <Button className="h-10 w-full rounded-xl bg-white font-semibold text-primary">
                <LogIn className="mr-2 h-4 w-4" />
                Masuk
              </Button>
            </Link>
            <Link href={`/${locale}/register`} className="flex-1">
              <Button
                variant="outline"
                className="h-10 w-full rounded-xl border-2 border-white/40 font-semibold text-white hover:bg-white/10"
              >
                Daftar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Menu Sections - Simplified */}
      <div className="space-y-2">
        {/* Pengaturan */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
          <Link
            href="#"
            className="flex items-center gap-3 px-4 py-3 active:bg-slate-50 dark:active:bg-slate-700"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="flex-1 text-sm font-medium">Bahasa</span>
            <span className="text-xs text-muted-foreground">Indonesia</span>
          </Link>
        </div>

        {/* Bantuan */}
        <div>
          <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Bantuan
          </p>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
            <Link
              href={`/${locale}/contact`}
              className="flex items-center gap-3 px-4 py-3 active:bg-slate-50 dark:active:bg-slate-700"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500">
                <HelpCircle className="h-5 w-5 text-white" />
              </div>
              <span className="flex-1 text-sm font-medium">Pusat Bantuan</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </Link>
            <div className="mx-4 h-px bg-border/50" />
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 active:bg-slate-50 dark:active:bg-slate-700"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <span className="flex-1 text-sm font-medium">Chat WhatsApp</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </a>
          </div>
        </div>

        {/* Tentang */}
        <div>
          <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tentang
          </p>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
            <Link
              href={`/${locale}/about`}
              className="flex items-center gap-3 px-4 py-3 active:bg-slate-50 dark:active:bg-slate-700"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-500">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="flex-1 text-sm font-medium">Tentang Kami</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </Link>
            <div className="mx-4 h-px bg-border/50" />
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-3 active:bg-slate-50 dark:active:bg-slate-700"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500">
                <Star className="h-5 w-5 text-white" />
              </div>
              <span className="flex-1 text-sm font-medium">Beri Rating</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </Link>
          </div>
        </div>
      </div>

      {/* App Version */}
      <div className="mt-6 text-center text-xs text-muted-foreground">
        <p>AeroTravel v1.0.0</p>
        <p className="mt-0.5">© 2025 Aero Travel Indonesia</p>
      </div>
        </div>
      </Container>
    </Section>
  );
}

// ============================================
// LOGGED IN ACCOUNT VIEW - PREMIUM DESIGN
// ============================================
function LoggedInAccount({
  locale,
  profile,
  email,
}: {
  locale: string;
  profile: {
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    role?: string;
  } | null;
  email?: string;
}) {
  const name = profile?.full_name || 'Traveler';
  const firstName = name.split(' ')[0];
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Section>
      <Container>
        <div className="flex flex-col pb-8">
          {/* Header with greeting */}
          <div className="pb-4 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Akun Saya</h1>
                <p className="text-sm text-muted-foreground">Halo, {firstName}! 👋</p>
              </div>
              {/* Role Switcher - Only show if user has multiple roles */}
              <div className="flex items-center">
                <AccountRoleSwitcher size="sm" variant="outline" />
              </div>
            </div>
          </div>

      {/* Premium Profile Card */}
      <div className="pb-5">
        <Link href={`/${locale}/account/profile`}>
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-white p-5 shadow-lg ring-1 ring-slate-100 active:scale-[0.98] dark:from-slate-800 dark:to-slate-800 dark:ring-slate-700">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-xl font-bold text-white shadow-lg">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={name}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                {/* Verified badge */}
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-800">
                  <Award className="h-3 w-3 text-white" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <p className="text-base font-bold text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
                {profile?.phone && (
                  <p className="text-xs text-muted-foreground">{profile.phone}</p>
                )}
              </div>

              {/* Arrow */}
              <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-active:translate-x-1" />
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="pb-5">
        <div className="grid grid-cols-3 gap-3">
          <Link
            href={`/${locale}/loyalty`}
            className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 active:scale-95 dark:from-amber-950/20 dark:to-orange-950/20"
          >
            <Wallet className="mb-2 h-6 w-6 text-amber-600 dark:text-amber-400" />
            <p className="text-lg font-bold text-foreground">0</p>
            <p className="text-[10px] text-muted-foreground">Points</p>
          </Link>
          <Link
            href={`/${locale}/my-trips`}
            className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4 active:scale-95 dark:from-blue-950/20 dark:to-cyan-950/20"
          >
            <History className="mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
            <p className="text-lg font-bold text-foreground">0</p>
            <p className="text-[10px] text-muted-foreground">Trip</p>
          </Link>
          <Link
            href={`/${locale}/referral`}
            className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 active:scale-95 dark:from-green-950/20 dark:to-emerald-950/20"
          >
            <Users className="mb-2 h-6 w-6 text-green-600 dark:text-green-400" />
            <p className="text-lg font-bold text-foreground">0</p>
            <p className="text-[10px] text-muted-foreground">Referral</p>
          </Link>
        </div>
      </div>

      {/* Menu Sections - Optimized, No Redundancy */}
      <div className="space-y-3">
        {/* Transaksi & Pembayaran */}
        <MenuGroup
          title="Transaksi & Pembayaran"
          items={[
            {
              icon: Gift,
              label: 'Voucher & Promo',
              href: `/${locale}/account/vouchers`,
              value: '0 voucher',
              color: 'bg-pink-500',
            },
            {
              icon: CreditCard,
              label: 'Metode Pembayaran',
              href: `/${locale}/account/payment-methods`,
              color: 'bg-teal-500',
            },
            {
              icon: History,
              label: 'Riwayat Pembayaran',
              href: `/${locale}/account/transactions`,
              color: 'bg-purple-500',
            },
          ]}
        />

        {/* Pengaturan */}
        <MenuGroup
          title="Pengaturan"
          items={[
            {
              icon: Globe,
              label: 'Bahasa',
              value: 'Indonesia',
              href: `/${locale}/account/language`,
              color: 'bg-blue-500',
            },
            {
              icon: Bell,
              label: 'Notifikasi',
              href: `/${locale}/account/notifications`,
              color: 'bg-orange-500',
            },
          ]}
        />

        {/* Bantuan & Dukungan */}
        <MenuGroup
          title="Bantuan & Dukungan"
          items={[
            {
              icon: HelpCircle,
              label: 'Pusat Bantuan',
              href: `/${locale}/contact`,
              color: 'bg-green-500',
            },
            {
              icon: MessageCircle,
              label: 'Chat WhatsApp',
              href: 'https://wa.me/6281234567890',
              external: true,
              color: 'bg-emerald-500',
            },
          ]}
        />

        {/* Legal */}
        <MenuGroup
          title="Legal & Keamanan"
          items={[
            {
              icon: Shield,
              label: 'Syarat & Ketentuan',
              href: `/${locale}/terms`,
            },
            {
              icon: Shield,
              label: 'Kebijakan Privasi',
              href: `/${locale}/privacy`,
            },
          ]}
        />
      </div>

      {/* Logout Button */}
      <div className="mt-4">
        <Link href={`/${locale}/logout`}>
          <Button
            variant="outline"
            className="h-12 w-full gap-2 rounded-2xl border-2 border-red-200 font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/20"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </Link>
      </div>

      {/* App Info */}
      <div className="mt-6 space-y-1 text-center text-xs text-muted-foreground">
        <p>AeroTravel v1.0.0</p>
        <p>© 2025 Aero Travel Indonesia</p>
      </div>
        </div>
      </Container>
    </Section>
  );
}

// ============================================
// MENU GROUP COMPONENT
// ============================================
type MenuItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  href: string;
  external?: boolean;
  color?: string;
};

type MenuGroupProps = {
  title?: string;
  items: MenuItem[];
};

function MenuGroup({ title, items }: MenuGroupProps) {
  return (
    <div>
      {title && (
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      )}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
        {items.map((item, index) => {
          const content = (
            <div className="flex items-center gap-3 px-4 py-3.5">
              {/* Icon */}
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.color || 'bg-slate-100 dark:bg-slate-700'}`}
              >
                <item.icon
                  className={`h-5 w-5 ${item.color ? 'text-white' : 'text-muted-foreground'}`}
                />
              </div>

              {/* Label */}
              <span className="flex-1 text-sm font-medium text-foreground">
                {item.label}
              </span>

              {/* Value */}
              {item.value && (
                <span className="text-xs font-semibold text-muted-foreground">
                  {item.value}
                </span>
              )}

              {/* Arrow */}
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </div>
          );

          const isLast = index === items.length - 1;

          if (item.external) {
            return (
              <div key={index}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition-colors active:bg-muted/50"
                >
                  {content}
                </a>
                {!isLast && <div className="mx-4 h-px bg-border/50" />}
              </div>
            );
          }

          return (
            <div key={index}>
              <Link
                href={item.href}
                className="block transition-colors active:bg-muted/50"
              >
                {content}
              </Link>
              {!isLast && <div className="mx-4 h-px bg-border/50" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
