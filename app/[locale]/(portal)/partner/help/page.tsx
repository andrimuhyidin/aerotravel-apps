/**
 * Partner Help Page
 * Route: /[locale]/partner/help
 */

import {
  BarChart,
  Clock,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Wallet,
} from 'lucide-react';
import { Metadata, Viewport } from 'next';
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
    title: 'Bantuan - Partner Portal',
    description: 'Pusat bantuan Partner Portal Aero Travel',
  };
}

export default async function PartnerHelpPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const faqItems = [
    {
      question: 'Bagaimana cara mengelola booking yang masuk?',
      answer:
        'Buka halaman Bookings untuk melihat semua booking. Konfirmasi booking baru maksimal 4 jam. Anda dapat accept, reject (dengan alasan), atau reschedule. Customer akan mendapat notifikasi otomatis.',
    },
    {
      question: 'Bagaimana cara menambah/edit paket wisata?',
      answer:
        'Buka halaman Packages, klik "Add New Package". Upload foto berkualitas tinggi, tulis deskripsi lengkap, tentukan harga dan availability. Untuk edit, klik paket yang ingin diubah. Changes langsung ter-update di customer app.',
    },
    {
      question: 'Bagaimana cara tracking komisi saya?',
      answer:
        'Buka halaman Wallet untuk melihat total komisi. Tab "Pending" menunjukkan komisi yang belum settled. Tab "History" menampilkan settlement history. Komisi dihitung otomatis setelah trip completed.',
    },
    {
      question: 'Kapan settlement komisi dilakukan?',
      answer:
        'Settlement dilakukan setiap 2 minggu (NET 15) atau bulanan (NET 30) sesuai agreement. Anda akan menerima invoice detail via email. Transfer dilakukan ke rekening terdaftar. Check wallet history untuk tracking.',
    },
    {
      question: 'Bagaimana cara request settlement lebih cepat?',
      answer:
        'Partner dengan good standing dan volume tinggi dapat request early settlement. Hubungi Partnership Manager via email atau chat. Mungkin dikenakan admin fee untuk early settlement.',
    },
    {
      question: 'Bagaimana cara melihat invoice dan payment tracking?',
      answer:
        'Buka halaman Invoices untuk download semua invoice PDF. Filter by date, status (paid/pending), atau settlement period. Anda juga dapat export ke Excel untuk accounting purposes.',
    },
    {
      question: 'Bagaimana cara setup white-label branding?',
      answer:
        'White-label available untuk partner dengan min 100 bookings/month. Buka Settings > White-Label. Upload logo, pilih color scheme, dan set custom domain. Tim kami akan assist dengan technical setup.',
    },
    {
      question: 'Bagaimana cara menggunakan API integration?',
      answer:
        'API documentation tersedia di Settings > API. Generate API key, lalu integrate dengan system Anda. API supports booking management, availability sync, dan real-time notifications. Sample code provided.',
    },
    {
      question: 'Apa yang harus dilakukan jika ada customer complaint?',
      answer:
        'Customer complaint akan muncul di halaman Bookings dengan flag red. Respond segera via chat internal. Berikan solusi (refund partial, reschedule, kompensasi). Aero Travel akan mediasi jika diperlukan.',
    },
    {
      question: 'Bagaimana cara meningkatkan rating dan review?',
      answer:
        'Focus pada quality service, response time cepat, dan accurate product description. Follow-up dengan customers post-trip. Handle complaints professionally. Rating tinggi = priority placement di search results.',
    },
  ];

  const contactOptions = [
    {
      icon: Phone,
      title: 'Telepon',
      value: '+62 812 3456 7890',
      href: 'tel:+6281234567890',
      description: 'Senin - Jumat, 09:00 - 18:00 WIB',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: '+62 812 3456 7890',
      href: 'https://wa.me/6281234567890',
      description: 'Fast response untuk urgent matters',
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'partner@aerotravel.co.id',
      href: 'mailto:partner@aerotravel.co.id',
      description: 'Response dalam 1 hari kerja',
    },
  ];

  const quickLinks = [
    {
      icon: BarChart,
      title: 'Dashboard Analytics',
      description: 'View booking trends & revenue',
      color: 'bg-blue-500',
    },
    {
      icon: Wallet,
      title: 'Komisi Calculator',
      description: 'Hitung estimasi earnings',
      color: 'bg-emerald-500',
    },
  ];

  return (
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
          <HelpCircle className="h-8 w-8 text-orange-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Pusat Bantuan</h1>
        <p className="text-sm text-muted-foreground">
          Partner Portal Support Center
        </p>
      </div>

      {/* Quick Links */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">Quick Access</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((link, index) => (
            <Card key={index} className="border-none shadow-sm">
              <CardContent className="p-4 text-center">
                <div
                  className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${link.color}`}
                >
                  <link.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-1 text-sm font-semibold">{link.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {link.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">Pertanyaan Umum (FAQ)</h2>
        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <Card key={index} className="border-none shadow-sm">
              <CardContent className="p-4">
                <h3 className="mb-2 flex items-start gap-2 text-sm font-semibold">
                  <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                  {item.question}
                </h3>
                <p className="ml-6 text-xs text-muted-foreground">
                  {item.answer}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">
          Hubungi Partnership Manager
        </h2>
        <div className="space-y-2">
          {contactOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <a
                key={index}
                href={option.href}
                target={option.href.startsWith('http') ? '_blank' : undefined}
                rel={
                  option.href.startsWith('http')
                    ? 'noopener noreferrer'
                    : undefined
                }
              >
                <Card className="border-none shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                      <Icon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold">{option.title}</h3>
                      <p className="text-xs font-medium text-orange-600">
                        {option.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      </div>

      {/* Operating Hours */}
      <Card className="border-none bg-orange-500/5 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-semibold">
                Jam Layanan Partnership Support
              </p>
              <p className="text-xs text-muted-foreground">
                Senin - Jumat: 09:00 - 18:00 WIB
                <br />
                Sabtu: 09:00 - 14:00 WIB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
