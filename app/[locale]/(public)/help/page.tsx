/**
 * Help / Bantuan Page
 * Route: /[locale]/help
 */

import {
  BookOpen,
  Clock,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Shield,
} from 'lucide-react';
import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { AISummary } from '@/components/seo/ai-summary';
import { JsonLd } from '@/components/seo/json-ld';
import { RelatedContent } from '@/components/seo/related-content';
import { generateFAQSchema, generateContactPageSchema } from '@/lib/seo/structured-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { locales } from '@/i18n';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { getTypedClient } from '@/lib/supabase/typed-client';

import { FeedbackSectionWrapper } from './feedback-section-wrapper';
import { IncidentFormWrapper } from './incident-form-wrapper';

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

  const title = 'Bantuan - Aero Travel';
  const description =
    'Pusat bantuan Aero Travel. Dapatkan panduan penggunaan, FAQ, dan kontak support.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/help`,
      languages: {
        id: `${baseUrl}/id/help`,
        en: `${baseUrl}/en/help`,
        'x-default': `${baseUrl}/id/help`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/help`,
      siteName: 'MyAeroTravel ID',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.jpg`],
    },
  };
}

export default async function HelpPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Check if user is guide to show incident form
  const user = await getCurrentUser();
  const isGuide =
    user?.activeRole === 'guide' ||
    (user?.profile as { role?: string } | null)?.role === 'guide';

  // Get current active trip for guide (if guide)
  let tripId: string | undefined;
  if (isGuide && user) {
    const supabase = await createClient();
    const typedSupabase = getTypedClient(supabase);
    const { data: assignment } = (await typedSupabase
      .from('trip_guides')
      .select('trip_id')
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()) as {
      data: { trip_id: string } | null;
    };
    tripId = assignment?.trip_id as string | undefined;
  }

  const faqItems = [
    {
      question: 'Bagaimana cara melakukan check-in attendance?',
      answer:
        'Buka halaman Attendance, pastikan GPS aktif dan Anda berada dalam radius meeting point. Klik tombol "Check-In Sekarang" dan tunggu konfirmasi.',
    },
    {
      question: 'Bagaimana cara melihat manifest penumpang?',
      answer:
        'Buka halaman Manifest dari dashboard atau menu. Di sana Anda dapat melihat daftar penumpang, menandai status boarding/kembali, dan mengunggah link dokumentasi.',
    },
    {
      question: 'Bagaimana cara mencatat pengeluaran trip?',
      answer:
        'Masuk ke detail trip, lalu pilih menu "Pengeluaran". Tambahkan item pengeluaran dengan foto bukti, kemudian simpan. Pengeluaran akan direview oleh admin.',
    },
    {
      question: 'Kapan gaji akan dibayarkan?',
      answer:
        'Gaji dan pendapatan trip biasanya dibayarkan setiap akhir bulan atau sesuai jadwal yang telah ditentukan. Anda dapat melihat detail di halaman Wallet.',
    },
    {
      question: 'Bagaimana cara menggunakan fitur SOS?',
      answer:
        'Fitur SOS digunakan dalam keadaan darurat. Tekan dan tahan tombol SOS selama 3 detik untuk mengirimkan alert ke tim operasional.',
    },
    {
      question: 'Bagaimana cara mengubah status ketersediaan?',
      answer:
        'Buka halaman Dashboard, klik pada status availability saat ini, pilih status baru (Available/Busy/Offline) atau buka halaman "Atur Ketersediaan" untuk pengaturan lebih lanjut.',
    },
  ];

  const helpSections = [
    {
      icon: BookOpen,
      title: 'Panduan Penggunaan',
      description: 'Pelajari cara menggunakan fitur-fitur Guide App',
      href: `/${locale}/guide`,
      color: 'bg-blue-500',
    },
    {
      icon: Shield,
      title: 'Kebijakan Privasi',
      description: 'Ketahui bagaimana kami melindungi data Anda',
      href: `/${locale}/legal/privacy`,
      color: 'bg-emerald-500',
    },
    {
      icon: HelpCircle,
      title: 'FAQ',
      description: 'Pertanyaan yang sering diajukan',
      href: '#faq',
      color: 'bg-amber-500',
    },
  ];

  const contactOptions = [
    {
      icon: Phone,
      title: 'Telepon',
      value: '+62 812 3456 7890',
      href: 'tel:+6281234567890',
      description: 'Senin - Minggu, 08:00 - 21:00 WIB',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: '+62 812 3456 7890',
      href: 'https://wa.me/6281234567890',
      description: 'Respon cepat via chat',
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'support@aerotravel.co.id',
      href: 'mailto:support@aerotravel.co.id',
      description: 'Kami akan merespons dalam 24 jam',
    },
  ];

  // Generate FAQ schema for SEO
  const faqSchema = generateFAQSchema(faqItems);

  // Generate Contact schema
  const contactSchema = generateContactPageSchema({
    telephone: '+62 812 3456 7890',
    email: 'support@aerotravel.co.id',
    openingHours: 'Mo-Su 08:00-21:00',
  });

  // AI Summary for help page
  const helpSummary =
    'Pusat bantuan MyAeroTravel menyediakan panduan lengkap penggunaan aplikasi, FAQ untuk pertanyaan umum, dan kontak support 24/7. Hubungi tim kami via WhatsApp, telepon, atau email untuk bantuan cepat.';

  const helpKeyPoints = [
    'Panduan penggunaan lengkap untuk semua fitur',
    'FAQ menjawab pertanyaan yang sering diajukan',
    'Support tersedia Senin-Minggu 08:00-21:00 WIB',
    'Kontak via WhatsApp, telepon, atau email',
  ];

  // Related help links
  const relatedHelpLinks = [
    { title: 'Tentang Kami', href: `/${locale}/about` },
    { title: 'Kebijakan Privasi', href: `/${locale}/legal/privacy` },
    { title: 'Syarat & Ketentuan', href: `/${locale}/legal/terms` },
    { title: 'Hubungi Kami', href: `/${locale}/contact` },
  ];

  // Generate speakable schema for voice search
  const speakableSchema = generateFAQSpeakable({
    title: 'Bantuan & FAQ - MyAeroTravel',
    description: helpSummary,
    locale,
  });

  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={contactSchema} />
      <JsonLd data={speakableSchema} />
      <Container className="py-4">
        {/* AI Summary */}
        <div className="mb-4">
          <AISummary summary={helpSummary} bulletPoints={helpKeyPoints} />
        </div>

        {/* Hero */}
      <div className="mb-4 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <HelpCircle className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mb-2 text-xl font-bold">Bantuan</h1>
        <p className="text-xs text-muted-foreground">
          Pusat bantuan untuk Guide App
        </p>
      </div>

      {/* Help Sections */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">Menu Bantuan</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {helpSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Link key={index} href={section.href}>
                <Card className="border-none shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="p-4 text-center">
                    <div
                      className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${section.color}`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="mb-1 text-sm font-semibold">
                      {section.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
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
                  <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
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
        <h2 className="mb-3 text-sm font-semibold">Hubungi Tim Support</h2>
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold">{option.title}</h3>
                      <p className="text-xs font-medium text-primary">
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

        {/* Quick Contact Button */}
        <Link href={`/${locale}/contact`} className="mt-3 block">
          <Button size="sm" className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            Kirim Pesan ke Support
          </Button>
        </Link>
      </div>

      {/* Incident Report Section (for guides only) */}
      {isGuide && user && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold">Laporan Insiden</h2>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="mb-3 text-xs text-muted-foreground">
                Laporkan kejadian insiden yang terjadi selama trip
              </p>
              <IncidentFormWrapper guideId={user.id} tripId={tripId} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback & Saran Section (for guides only) */}
      {isGuide && user && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold">Feedback & Saran</h2>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="mb-3 text-xs text-muted-foreground">
                Berikan feedback dan saran untuk perbaikan perusahaan
              </p>
              <FeedbackSectionWrapper locale={locale} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Related Content */}
      <div className="mb-6">
        <RelatedContent title="Halaman Terkait" links={relatedHelpLinks} />
      </div>

      {/* Operating Hours */}
      <Card className="border-none bg-primary/5 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Jam Layanan Support</p>
              <p className="text-xs text-muted-foreground">
                Senin - Minggu: 08:00 - 21:00 WIB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
    </>
  );
}
