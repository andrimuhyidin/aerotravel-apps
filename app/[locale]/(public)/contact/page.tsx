/**
 * Contact Page
 * Route: /[locale]/contact
 */

import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
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
    <>
      {/* Hero */}
      <Section className="bg-gradient-to-br from-primary/5 via-background to-aero-teal/5">
        <Container>
          <div className="py-12 text-center">
            <h1 className="mb-4 text-4xl font-bold">Hubungi Kami</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Ada pertanyaan? Tim kami siap membantu Anda
            </p>
          </div>
        </Container>
      </Section>

      {/* Contact Info & Form */}
      <Section>
        <Container>
          <div className="grid gap-8 py-12 md:grid-cols-2">
            {/* Contact Info */}
            <div className="space-y-6">
              <div>
                <h2 className="mb-4 text-2xl font-bold">Informasi Kontak</h2>
                <p className="text-muted-foreground">
                  Hubungi kami melalui channel berikut atau isi form di samping.
                </p>
              </div>

              <div className="grid gap-4">
                {contactInfo.map((info, index) => (
                  <a
                    key={index}
                    href={info.href}
                    className="group"
                    target={info.href.startsWith('http') ? '_blank' : undefined}
                    rel={
                      info.href.startsWith('http')
                        ? 'noopener noreferrer'
                        : undefined
                    }
                  >
                    <Card className="transition-shadow group-hover:shadow-md">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <info.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {info.title}
                          </p>
                          <p className="font-medium group-hover:text-primary">
                            {info.value}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>

              {/* Operating Hours */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Jam Operasional</p>
                      <p className="text-sm text-muted-foreground">
                        Senin - Minggu: 08:00 - 21:00 WIB
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                <h2 className="mb-6 text-xl font-bold">Kirim Pesan</h2>
                <form className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap</Label>
                      <Input id="name" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">No. WhatsApp</Label>
                      <Input id="phone" placeholder="08123456789" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subjek</Label>
                    <Input id="subject" placeholder="Pertanyaan tentang..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Pesan</Label>
                    <textarea
                      id="message"
                      rows={4}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Tulis pesan Anda..."
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Kirim Pesan
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Map Placeholder */}
      <Section className="bg-muted/30">
        <Container>
          <div className="py-12">
            <h2 className="mb-6 text-center text-2xl font-bold">Lokasi Kami</h2>
            <div className="aspect-[21/9] overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-aero-teal/10">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto mb-2 h-12 w-12 text-primary" />
                  <p className="text-muted-foreground">
                    Bandar Lampung, Indonesia
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
