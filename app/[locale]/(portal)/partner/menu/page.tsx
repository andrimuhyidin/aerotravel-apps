/**
 * Partner Menu Page
 * Route: /[locale]/partner/menu
 */

import { FileText, HelpCircle, Info, Settings, Shield } from 'lucide-react';
import { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ea580c',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return {
    title: 'Menu - Partner Portal',
    description: 'Menu Partner Portal Aero Travel',
  };
}

export default async function PartnerMenuPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const menuSections = [
    {
      title: 'Pengaturan',
      items: [
        {
          href: `/${locale}/partner/settings`,
          label: 'Pengaturan Akun',
          icon: Settings,
          description: 'Kelola akun dan preferensi',
        },
      ],
    },
    {
      title: 'Informasi & Bantuan',
      items: [
        {
          href: `/${locale}/partner/help`,
          label: 'Pusat Bantuan',
          icon: HelpCircle,
          description: 'FAQ dan dukungan',
        },
        {
          href: `/${locale}/partner/about`,
          label: 'Tentang Partnership',
          icon: Info,
          description: 'Program kemitraan',
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          href: `/${locale}/partner/legal/terms`,
          label: 'Syarat & Ketentuan',
          icon: FileText,
          description: 'Perjanjian kemitraan',
        },
        {
          href: `/${locale}/partner/legal/privacy`,
          label: 'Kebijakan Privasi',
          icon: Shield,
          description: 'Privasi dan keamanan data',
        },
      ],
    },
  ];

  return (
    <Container className="py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Menu</h1>
        <p className="text-sm text-muted-foreground">Partner Portal</p>
      </div>

      {/* Menu Sections */}
      <div className="space-y-6">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
              {section.title}
            </h2>
            <Card className="border-none shadow-sm">
              <CardContent className="p-0">
                {section.items.map((item, itemIndex) => (
                  <Link
                    key={itemIndex}
                    href={item.href}
                    className="flex items-center gap-4 border-b border-slate-100 p-4 last:border-0 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                      <item.icon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Version */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Partner Portal v1.0.0
      </p>
    </Container>
  );
}
