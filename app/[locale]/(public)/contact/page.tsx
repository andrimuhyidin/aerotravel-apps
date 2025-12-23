/**
 * Contact Page
 * Route: /[locale]/contact
 */

import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  themeColor: '#000000',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Hubungi Kami - Aero Travel',
    description:
      'Hubungi tim Aero Travel untuk informasi paket wisata, booking, atau pertanyaan lainnya.',
    alternates: {
      canonical: `${baseUrl}/${locale}/contact`,
    },
  };
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const contactInfo = [
    {
      icon: Phone,
      title: 'Telepon',
      value: '+62 812 3456 7890',
      href: 'tel:+6281234567890',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: '+62 812 3456 7890',
      href: 'https://wa.me/6281234567890',
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'info@aerotravel.co.id',
      href: 'mailto:info@aerotravel.co.id',
    },
    {
      icon: MapPin,
      title: 'Alamat',
      value: 'Bandar Lampung, Indonesia',
      href: '#',
    },
  ];

  return (
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Hubungi Kami</h1>
        <p className="text-sm text-muted-foreground">
          Ada pertanyaan? Tim kami siap membantu Anda
        </p>
      </div>

      {/* Contact Info */}
      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold">Informasi Kontak</h2>
        <div className="space-y-2">
          {contactInfo.map((info, index) => (
            <a
              key={index}
              href={info.href}
              className="group block"
              target={info.href.startsWith('http') ? '_blank' : undefined}
              rel={
                info.href.startsWith('http') ? 'noopener noreferrer' : undefined
              }
            >
              <Card className="border-none shadow-sm transition-shadow group-hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <info.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {info.title}
                    </p>
                    <p className="text-sm font-medium group-hover:text-primary">
                      {info.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>

      {/* Operating Hours */}
      <Card className="mb-6 border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Jam Operasional</p>
              <p className="text-xs text-muted-foreground">
                Senin - Minggu: 08:00 - 21:00 WIB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card className="mb-6 border-none shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-4 text-base font-semibold">Kirim Pesan</h2>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">
                Nama Lengkap
              </Label>
              <Input id="name" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">
                No. WhatsApp
              </Label>
              <Input id="phone" placeholder="08123456789" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm">
                Subjek
              </Label>
              <Input id="subject" placeholder="Pertanyaan tentang..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm">
                Pesan
              </Label>
              <textarea
                id="message"
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Tulis pesan Anda..."
              />
            </div>
            <Button type="submit" className="w-full" size="sm">
              Kirim Pesan
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-4 text-center text-base font-semibold">
            Lokasi Kami
          </h2>
          <div className="aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-aero-teal/10">
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto mb-2 h-10 w-10 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Bandar Lampung, Indonesia
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
