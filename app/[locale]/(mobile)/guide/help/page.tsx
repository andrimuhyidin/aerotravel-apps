/**
 * Guide Help Page
 * Route: /[locale]/guide/help
 */

import {
  BookOpen,
  Clock,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
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
  themeColor: '#10b981',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return {
    title: 'Bantuan - Guide App',
    description: 'Pusat bantuan untuk Guide App Aero Travel',
  };
}

export default async function GuideHelpPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const faqItems = [
    {
      question: 'Bagaimana cara melakukan check-in attendance?',
      answer:
        'Buka halaman Attendance, pastikan GPS aktif dan Anda berada dalam radius 100m dari meeting point. Klik "Check-In" dan tunggu konfirmasi. Check-in harus dilakukan maksimal 30 menit sebelum departure time.',
    },
    {
      question: 'Bagaimana cara mengelola manifest penumpang?',
      answer:
        'Buka halaman Manifest dari trip detail. Verifikasi identitas setiap peserta dengan KTP/passport, tandai boarding status, dan kumpulkan consent form. Upload link dokumentasi trip maksimal H+1.',
    },
    {
      question: 'Bagaimana cara melaporkan pengeluaran trip?',
      answer:
        'Masuk ke detail trip, pilih tab "Pengeluaran". Tambahkan item dengan kategori, nominal, dan foto bukti. Submit untuk approval. Reimbursement diproses maksimal 7 hari kerja setelah approved.',
    },
    {
      question: 'Kapan gaji dan earnings akan dibayarkan?',
      answer:
        'Gaji dibayarkan setiap akhir bulan (tanggal 25-28) via transfer ke rekening terdaftar. Cek detail earnings di halaman Wallet. Bonus reward points dapat ditukar kapan saja.',
    },
    {
      question: 'Bagaimana cara menggunakan fitur SOS?',
      answer:
        'Tekan dan tahan tombol SOS merah di header app selama 3 detik. Alert akan dikirim ke ops coordinator dengan lokasi GPS Anda. Gunakan hanya untuk emergency real (injury, equipment failure critical, cuaca berbahaya).',
    },
    {
      question: 'Bagaimana cara mengubah status ketersediaan?',
      answer:
        'Buka halaman Status/Availability. Pilih Available (siap dapat trip), Busy (sedang ada trip), atau Offline (tidak tersedia). Status Offline otomatis membuat Anda tidak muncul di pool assignment.',
    },
    {
      question: 'Bagaimana cara tracking wallet dan reward points?',
      answer:
        'Buka halaman Wallet untuk melihat balance, transaction history, dan pending settlements. Reward points dapat dilihat di tab "Rewards". Tukar points dengan voucher atau cash via menu Redeem.',
    },
    {
      question: 'Bagaimana cara renewal sertifikasi?',
      answer:
        'Cek expiry date di halaman Certifications. Jika kurang dari 3 bulan, sistem akan notifikasi. Daftar training mandatory di halaman Training. Setelah selesai, upload sertifikat baru untuk update.',
    },
    {
      question: 'Bagaimana cara menyelesaikan training & assessments?',
      answer:
        'Buka halaman Training untuk melihat mandatory dan optional courses. Ikuti video/materi, lalu kerjakan assessment. Minimal score 80% untuk pass. Retake unlimited jika belum pass.',
    },
    {
      question: 'Apa yang harus dilakukan jika rating turun?',
      answer:
        'Rating di bawah 4.0 akan trigger coaching session dengan coordinator. Review feedback dari customers, perbaiki area yang weak (communication, safety, service). Ikuti training improvement yang direkomendasikan.',
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
      description: 'Fast response via chat',
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'guide-support@aerotravel.co.id',
      href: 'mailto:guide-support@aerotravel.co.id',
      description: 'Response dalam 24 jam',
    },
  ];

  return (
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <HelpCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Pusat Bantuan</h1>
        <p className="text-sm text-muted-foreground">
          Guide App Support Center
        </p>
      </div>

      {/* Quick Links */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">Quick Links</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-1 text-sm font-semibold">User Guide</h3>
              <p className="text-xs text-muted-foreground">Panduan lengkap</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-1 text-sm font-semibold">Live Chat</h3>
              <p className="text-xs text-muted-foreground">Chat dengan tim</p>
            </CardContent>
          </Card>
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
                  <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
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
          Hubungi Guide Coordinator
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold">{option.title}</h3>
                      <p className="text-xs font-medium text-emerald-600">
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
      <Card className="border-none bg-emerald-500/5 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
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
  );
}
