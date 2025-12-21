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
import { Section } from '@/components/layout/section';
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Bantuan - Guide App',
    description:
      'Pusat bantuan untuk Guide App. Dapatkan panduan penggunaan, FAQ, dan kontak support.',
    alternates: {
      canonical: `${baseUrl}/${locale}/help`,
    },
  };
}

export default async function HelpPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Check if user is guide to show incident form
  const user = await getCurrentUser();
  const isGuide = user?.activeRole === 'guide' || (user?.profile as { role?: string } | null)?.role === 'guide';
  
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

  return (
    <>
      {/* Hero */}
      <Section className="bg-gradient-to-br from-primary/5 via-background to-aero-teal/5">
        <Container>
          <div className="py-12 text-center">
            <h1 className="mb-4 text-4xl font-bold">Bantuan</h1>
            <p className="text-muted-foreground">
              Pusat bantuan untuk Guide App. Temukan jawaban dan dapatkan dukungan.
            </p>
          </div>
        </Container>
      </Section>

      {/* Help Sections */}
      <Section>
        <Container>
          <div className="grid gap-4 py-8 md:grid-cols-3">
            {helpSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Link key={index} href={section.href}>
                  <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
                    <CardContent className="p-6 text-center">
                      <div
                        className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${section.color}`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="mb-2 font-semibold text-slate-900">{section.title}</h3>
                      <p className="text-sm text-slate-600">{section.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Getting Started Section */}
      <Section id="getting-started" className="bg-muted/30">
        <Container>
          <div className="py-12">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-xl sm:text-2xl md:text-3xl font-bold">Memulai dengan Guide App</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Panduan lengkap untuk memulai menggunakan Guide App
              </p>
            </div>

            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="mb-3 text-lg sm:text-xl font-semibold text-slate-900">1. Login dan Setup Profil</h3>
                  <p className="text-slate-700">
                    Setelah login, lengkapi profil Anda di halaman Profile. Pastikan semua informasi
                    dan dokumen sudah diunggah untuk memudahkan proses verifikasi.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="mb-3 text-lg sm:text-xl font-semibold text-slate-900">2. Atur Status Ketersediaan</h3>
                  <p className="text-slate-700">
                    Atur status ketersediaan Anda di Dashboard atau halaman Status. Status yang
                    tersedia: Standby (tersedia), On Trip (sedang memandu), atau Not Available
                    (tidak tersedia).
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="mb-3 text-lg sm:text-xl font-semibold text-slate-900">3. Konfirmasi Trip Assignment</h3>
                  <p className="text-slate-700">
                    Saat menerima assignment trip, pastikan untuk mengkonfirmasi sebelum deadline.
                    Anda dapat melihat detail trip dan mengkonfirmasi dari halaman Trips.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="mb-3 text-lg sm:text-xl font-semibold text-slate-900">4. Check-in Attendance</h3>
                  <p className="text-slate-700">
                    Sebelum trip dimulai, lakukan check-in attendance di halaman Attendance. Pastikan
                    GPS aktif dan Anda berada dalam radius meeting point untuk check-in berhasil.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="mb-3 text-lg sm:text-xl font-semibold text-slate-900">5. Kelola Manifest dan Trip</h3>
                  <p className="text-slate-700">
                    Selama trip, gunakan fitur Manifest untuk mengelola penumpang, dan fitur Chat
                    untuk berkomunikasi dengan tim operasional. Semua data akan tersinkronisasi
                    otomatis saat online.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ Section */}
      <Section id="faq" className="bg-muted/30">
        <Container>
          <div className="py-12">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-xl sm:text-2xl md:text-3xl font-bold">Pertanyaan yang Sering Diajukan</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Temukan jawaban untuk pertanyaan umum tentang Guide App
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <Card key={index} className="border-0 shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="mb-3 flex items-start gap-2 text-lg sm:text-xl font-semibold text-slate-900">
                      <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      {item.question}
                    </h3>
                    <p className="ml-7 text-slate-700">{item.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Contact Section */}
      <Section>
        <Container>
          <div className="py-12">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-xl sm:text-2xl md:text-3xl font-bold">Hubungi Tim Support</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Butuh bantuan lebih lanjut? Hubungi kami melalui channel berikut
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {contactOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <a
                    key={index}
                    href={option.href}
                    target={option.href.startsWith('http') ? '_blank' : undefined}
                    rel={option.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
                      <CardContent className="p-6 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="mb-1 font-semibold text-slate-900">{option.title}</h3>
                        <p className="mb-2 font-medium text-primary">{option.value}</p>
                        <p className="text-xs text-slate-500">{option.description}</p>
                      </CardContent>
                    </Card>
                  </a>
                );
              })}
            </div>

            {/* Quick Contact Button */}
            <div className="mt-8 text-center">
              <Link href={`/${locale}/contact`}>
                <Button size="lg" className="h-12 px-8">
                  <Mail className="mr-2 h-5 w-5" />
                  Kirim Pesan ke Support
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* Incident Report Section (for guides only) */}
      {isGuide && user && (
        <Section className="bg-muted/30">
          <Container>
            <div className="py-12">
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-xl sm:text-2xl md:text-3xl font-bold">Laporan Insiden</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Laporkan kejadian insiden yang terjadi selama trip untuk keperluan dokumentasi
                </p>
              </div>
              <div>
                <IncidentFormWrapper guideId={user.id} tripId={tripId} />
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* Feedback & Saran Section (for guides only) */}
      {isGuide && user && (
        <Section>
          <Container>
            <div className="py-12">
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-xl sm:text-2xl md:text-3xl font-bold">Feedback & Saran</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Berikan feedback dan saran untuk perbaikan perusahaan dan layanan
                </p>
              </div>
              <div>
                <FeedbackSectionWrapper locale={locale} />
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* Operating Hours */}
      <Section className="bg-muted/30">
        <Container>
          <div className="py-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div className="text-center">
                    <p className="font-semibold">Jam Layanan Support</p>
                    <p className="text-sm text-muted-foreground">
                      Senin - Minggu: 08:00 - 21:00 WIB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
