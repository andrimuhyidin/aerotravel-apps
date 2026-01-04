'use client';

import {
  Bell,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  HelpCircle,
  Info,
  MessageCircle,
  Settings,
  Shield,
  Star,
} from 'lucide-react';
import Link from 'next/link';

import { useSettings } from '@/hooks/use-settings';

type MenuItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  href: string;
  external?: boolean;
  iconColor?: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

function MenuCard({ section }: { section: MenuSection }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      {section.items.map((item, index) => {
        const content = (
          <div className="flex items-center gap-3 px-4 py-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.iconColor || 'bg-muted/60'}`}
            >
              <item.icon
                className={`h-4 w-4 ${item.iconColor ? 'text-white' : 'text-muted-foreground'}`}
              />
            </div>
            <span className="flex-1 text-[13px] font-medium">{item.label}</span>
            {item.value && (
              <span className="text-xs text-muted-foreground">
                {item.value}
              </span>
            )}
            {item.external ? (
              <ExternalLink className="h-4 w-4 text-muted-foreground/50" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            )}
          </div>
        );

        const isLast = index === section.items.length - 1;

        if (item.external) {
          return (
            <div key={index}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block transition-colors active:bg-muted/30"
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
              className="block transition-colors active:bg-muted/30"
            >
              {content}
            </Link>
            {!isLast && <div className="mx-4 h-px bg-border/50" />}
          </div>
        );
      })}
    </div>
  );
}

// Format WhatsApp number for URL (remove non-digits)
function formatWhatsAppUrl(whatsapp: string): string {
  const number = whatsapp.replace(/\D/g, '');
  return `https://wa.me/${number}`;
}

export function GuestMenuSections({ locale }: { locale: string }) {
  const { settings } = useSettings();
  const whatsappUrl = settings?.contact?.whatsapp
    ? formatWhatsAppUrl(settings.contact.whatsapp)
    : 'https://wa.me/6281234567890'; // fallback

  const appStoreUrl = settings?.['app.app_store_url'] || '#';
  const playStoreUrl = settings?.['app.play_store_url'] || '#';
  const appVersion = settings?.['app.version'] || '1.0.0';

  const menuSections: MenuSection[] = [
    {
      title: 'Pengaturan',
      items: [
        {
          icon: Globe,
          label: 'Bahasa',
          value: 'Indonesia',
          href: '#',
          iconColor: 'bg-blue-500',
        },
        {
          icon: Bell,
          label: 'Notifikasi',
          href: `/${locale}/account/notifications`,
          iconColor: 'bg-orange-500',
        },
      ],
    },
    {
      title: 'Bantuan',
      items: [
        {
          icon: HelpCircle,
          label: 'Pusat Bantuan',
          href: `/${locale}/contact`,
          iconColor: 'bg-green-500',
        },
        {
          icon: MessageCircle,
          label: 'Hubungi via WhatsApp',
          href: whatsappUrl,
          external: true,
          iconColor: 'bg-emerald-500',
        },
      ],
    },
    {
      title: 'Tentang',
      items: [
        {
          icon: Info,
          label: 'Tentang Aero Travel',
          href: `/${locale}/about`,
          iconColor: 'bg-purple-500',
        },
        {
          icon: Star,
          label: 'Beri Rating di App Store',
          href: appStoreUrl,
          external: appStoreUrl !== '#',
          iconColor: 'bg-yellow-500',
        },
        {
          icon: Star,
          label: 'Beri Rating di Play Store',
          href: playStoreUrl,
          external: playStoreUrl !== '#',
          iconColor: 'bg-green-500',
        },
        {
          icon: Info,
          label: 'Versi Aplikasi',
          value: appVersion,
          href: '#',
          iconColor: 'bg-gray-500',
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon: FileText,
          label: 'Syarat & Ketentuan',
          href: `/${locale}/terms`,
        },
        {
          icon: Shield,
          label: 'Kebijakan Privasi',
          href: `/${locale}/privacy`,
        },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {menuSections.map((section, index) => (
        <div key={index}>
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </p>
          <MenuCard section={section} />
        </div>
      ))}
    </div>
  );
}

export function LoggedInMenuSections({ locale }: { locale: string }) {
  const { settings } = useSettings();
  const whatsappUrl = settings?.contact?.whatsapp
    ? formatWhatsAppUrl(settings.contact.whatsapp)
    : 'https://wa.me/6281234567890'; // fallback

  const appStoreUrl = settings?.['app.app_store_url'] || '#';
  const playStoreUrl = settings?.['app.play_store_url'] || '#';
  const appVersion = settings?.['app.version'] || '1.0.0';

  const menuSections: MenuSection[] = [
    {
      title: 'Pengaturan',
      items: [
        {
          icon: Globe,
          label: 'Bahasa',
          value: 'Indonesia',
          href: '#',
          iconColor: 'bg-blue-500',
        },
        {
          icon: Bell,
          label: 'Notifikasi',
          href: `/${locale}/account/notifications`,
          iconColor: 'bg-orange-500',
        },
        {
          icon: Settings,
          label: 'Pengaturan Akun',
          href: `/${locale}/account/settings`,
          iconColor: 'bg-slate-500',
        },
      ],
    },
    {
      title: 'Bantuan',
      items: [
        {
          icon: HelpCircle,
          label: 'Pusat Bantuan',
          href: `/${locale}/contact`,
          iconColor: 'bg-green-500',
        },
        {
          icon: MessageCircle,
          label: 'Hubungi via WhatsApp',
          href: whatsappUrl,
          external: true,
          iconColor: 'bg-emerald-500',
        },
      ],
    },
    {
      title: 'Tentang',
      items: [
        {
          icon: Info,
          label: 'Tentang Aero Travel',
          href: `/${locale}/about`,
          iconColor: 'bg-purple-500',
        },
        {
          icon: Star,
          label: 'Beri Rating di App Store',
          href: appStoreUrl,
          external: appStoreUrl !== '#',
          iconColor: 'bg-yellow-500',
        },
        {
          icon: Star,
          label: 'Beri Rating di Play Store',
          href: playStoreUrl,
          external: playStoreUrl !== '#',
          iconColor: 'bg-green-500',
        },
        {
          icon: Info,
          label: 'Versi Aplikasi',
          value: appVersion,
          href: '#',
          iconColor: 'bg-gray-500',
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon: FileText,
          label: 'Syarat & Ketentuan',
          href: `/${locale}/terms`,
        },
        {
          icon: Shield,
          label: 'Kebijakan Privasi',
          href: `/${locale}/privacy`,
        },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {menuSections.map((section, index) => (
        <div key={index}>
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </p>
          <MenuCard section={section} />
        </div>
      ))}
    </div>
  );
}
