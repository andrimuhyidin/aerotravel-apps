/**
 * DPO (Data Protection Officer) Contact Page
 * Route: /[locale]/legal/dpo
 * Purpose: UU PDP 2022 - Provide contact info for privacy inquiries
 */

import { Shield, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { locales } from '@/i18n';
import { getLegalPage } from '@/lib/cms/legal-pages';
import { sanitizeHtml } from '@/lib/templates/utils';
import { getSettings } from '@/lib/settings';

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
    title: 'Data Protection Officer (DPO) - Aero Travel',
    description:
      'Hubungi Data Protection Officer kami untuk pertanyaan terkait perlindungan data pribadi sesuai UU PDP 2022',
    alternates: {
      canonical: `${baseUrl}/${locale}/legal/dpo`,
    },
  };
}

export default async function DPOPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch DPO page and settings
  const [legalPage, settings] = await Promise.all([
    getLegalPage('dpo'),
    getSettings(),
  ]);

  const dpoEmail = settings['legal.dpo_email'] || 'privacy@aerotravel.co.id';
  const dpoPhone = settings['legal.dpo_phone'] || '+62 812 3456 7890';
  const dpoAddress = settings['legal.dpo_address'] || 'Bandar Lampung, Lampung, Indonesia 35123';
  const responseTimeDays = settings['legal.response_time_days'] || '14';

  return (
    <Container className="py-8">
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-3 text-3xl font-bold">
          {legalPage?.title || 'Data Protection Officer'}
        </h1>
        <div
          className="mx-auto max-w-2xl text-muted-foreground"
          dangerouslySetInnerHTML={{
            __html: legalPage?.content_html
              ? sanitizeHtml(legalPage.content_html)
              : '<p>Sesuai dengan UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi, kami menunjuk DPO untuk menangani pertanyaan terkait privasi dan perlindungan data.</p>',
          }}
        />
      </div>

      {/* Contact Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Informasi Kontak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </div>
              <a
                href={`mailto:${dpoEmail}`}
                className="text-primary hover:underline"
              >
                {dpoEmail}
              </a>
              <p className="mt-1 text-xs text-muted-foreground">
                Untuk pertanyaan terkait privasi dan data pribadi
              </p>
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Telepon
              </div>
              <a
                href={`tel:${dpoPhone.replace(/\D/g, '')}`}
                className="text-primary hover:underline"
              >
                {dpoPhone}
              </a>
              <p className="mt-1 text-xs text-muted-foreground">
                {settings['help.support_hours'] || 'Senin - Jumat, 09:00 - 17:00 WIB'}
              </p>
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Alamat
              </div>
              <p className="text-sm">{dpoAddress}</p>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Hak Anda Atas Data Pribadi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Sesuai UU PDP 2022, Anda memiliki hak berikut:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Hak untuk mengakses dan mendapatkan salinan data pribadi</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Hak untuk memperbaiki atau memperbarui data pribadi</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Hak untuk menghapus atau memusnahkan data pribadi</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Hak untuk menarik kembali persetujuan pemrosesan data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Hak untuk portabilitas data pribadi</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Hak untuk mengajukan keberatan atas pemrosesan data</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* How to Exercise Your Rights */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Cara Menggunakan Hak Anda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold">1. Permintaan Akses Data</h3>
            <p className="mb-2 text-sm text-muted-foreground">
              Untuk mendapatkan salinan data pribadi Anda, silakan login ke akun Anda dan gunakan fitur "Export Data" di menu pengaturan, atau hubungi kami via email.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">2. Perbaikan Data</h3>
            <p className="mb-2 text-sm text-muted-foreground">
              Anda dapat memperbaiki data profil langsung melalui menu pengaturan akun. Untuk data lain yang memerlukan verifikasi, hubungi kami.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">3. Penghapusan Data</h3>
            <p className="mb-2 text-sm text-muted-foreground">
              Untuk menghapus data pribadi, kirimkan permintaan ke privacy@aerotravel.co.id dengan subjek "Permintaan Penghapusan Data". Proses akan memakan waktu maksimal 30 hari.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">4. Penarikan Persetujuan</h3>
            <p className="mb-2 text-sm text-muted-foreground">
              Anda dapat mengelola persetujuan pemrosesan data melalui menu "Privasi & Persetujuan" di pengaturan akun.
            </p>
          </div>

          <div className="mt-6 rounded-lg bg-muted p-4">
            <p className="text-sm">
              <strong>Waktu Respon:</strong> Kami berkomitmen untuk merespons permintaan Anda dalam waktu maksimal {responseTimeDays} hari kerja. Untuk permintaan yang kompleks, kami akan memberitahu Anda tentang perkiraan waktu penyelesaian.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Complaint Procedure */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mengajukan Keluhan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Jika Anda tidak puas dengan cara kami menangani data pribadi Anda, Anda memiliki hak untuk:
          </p>
          <ol className="list-inside list-decimal space-y-2 text-sm">
            <li>Mengajukan keluhan tertulis kepada DPO kami</li>
            <li>
              Melaporkan ke Kementerian Komunikasi dan Informatika RI
              <br />
              <span className="text-muted-foreground">
                Email: <a href="mailto:pengaduan@kominfo.go.id" className="text-primary hover:underline">pengaduan@kominfo.go.id</a>
              </span>
            </li>
            <li>
              Melaporkan ke Lembaga Perlindungan Data Pribadi (bila sudah terbentuk)
            </li>
          </ol>
        </CardContent>
      </Card>
    </Container>
  );
}

