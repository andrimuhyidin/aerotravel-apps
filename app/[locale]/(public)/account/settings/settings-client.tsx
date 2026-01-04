'use client';

/**
 * Settings Client Component
 * Account settings and preferences
 */

import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Globe,
  Key,
  Lock,
  Moon,
  Shield,
  Smartphone,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Switch } from '@/components/ui/switch';

type SettingsClientProps = {
  locale: string;
};

type SettingItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  href?: string;
  action?: 'toggle' | 'link';
  value?: boolean;
  color?: string;
  danger?: boolean;
};

type SettingSection = {
  title: string;
  items: SettingItem[];
};

export function SettingsClient({ locale }: SettingsClientProps) {
  const sections: SettingSection[] = [
    {
      title: 'Preferensi',
      items: [
        {
          icon: Bell,
          label: 'Notifikasi',
          description: 'Atur notifikasi push dan email',
          href: `/${locale}/account/notifications`,
          action: 'link',
          color: 'bg-orange-500',
        },
        {
          icon: Globe,
          label: 'Bahasa',
          description: locale === 'id' ? 'Indonesia' : 'English',
          href: `/${locale}/account/language`,
          action: 'link',
          color: 'bg-blue-500',
        },
        {
          icon: Moon,
          label: 'Mode Gelap',
          description: 'Sesuaikan dengan sistem',
          action: 'toggle',
          value: false,
          color: 'bg-purple-500',
        },
      ],
    },
    {
      title: 'Keamanan',
      items: [
        {
          icon: Key,
          label: 'Ubah Password',
          description: 'Perbarui password akun',
          href: '#',
          action: 'link',
          color: 'bg-green-500',
        },
        {
          icon: Smartphone,
          label: 'Two-Factor Auth',
          description: 'Keamanan tambahan (Coming Soon)',
          action: 'toggle',
          value: false,
          color: 'bg-teal-500',
        },
        {
          icon: Lock,
          label: 'Session Aktif',
          description: 'Lihat perangkat yang login',
          href: '#',
          action: 'link',
          color: 'bg-indigo-500',
        },
      ],
    },
    {
      title: 'Data & Privasi',
      items: [
        {
          icon: Shield,
          label: 'Privasi Data',
          description: 'Kelola data pribadi',
          href: `/${locale}/legal/privacy`,
          action: 'link',
          color: 'bg-slate-500',
        },
        {
          icon: Trash2,
          label: 'Hapus Akun',
          description: 'Hapus akun dan semua data',
          href: '#',
          action: 'link',
          danger: true,
        },
      ],
    },
  ];

  const handleToggle = (label: string) => {
    toast.info(`Fitur "${label}" akan segera hadir`);
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/${locale}/account`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Pengaturan</h1>
          <p className="text-sm text-muted-foreground">Kelola preferensi akun</p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
              {section.items.map((item, index) => {
                const isLast = index === section.items.length - 1;
                const content = (
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    {/* Icon */}
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        item.danger
                          ? 'bg-red-500'
                          : item.color || 'bg-slate-100 dark:bg-slate-700'
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${
                          item.color || item.danger
                            ? 'text-white'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </div>

                    {/* Label & Description */}
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          item.danger ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                        }`}
                      >
                        {item.label}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    {item.action === 'toggle' ? (
                      <Switch
                        checked={item.value}
                        onCheckedChange={() => handleToggle(item.label)}
                      />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </div>
                );

                if (item.action === 'link' && item.href) {
                  return (
                    <div key={item.label}>
                      <Link
                        href={item.href}
                        className="block transition-colors active:bg-muted/50"
                      >
                        {content}
                      </Link>
                      {!isLast && <div className="mx-4 h-px bg-border/50" />}
                    </div>
                  );
                }

                return (
                  <div key={item.label}>
                    {content}
                    {!isLast && <div className="mx-4 h-px bg-border/50" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* App Info */}
      <div className="mt-8 space-y-1 text-center text-xs text-muted-foreground">
        <p>AeroTravel v1.0.0</p>
        <p>© 2025 Aero Travel Indonesia</p>
      </div>
    </div>
  );
}

