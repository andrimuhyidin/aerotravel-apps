/**
 * Guide Privacy Policy Page
 * Route: /[locale]/guide/legal/privacy
 */

import { Shield } from 'lucide-react';
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
    title: 'Kebijakan Privasi - Guide App',
    description: 'Kebijakan privasi Guide App Aero Travel',
  };
}

export default async function GuidePrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sections = [
    {
      title: '1. Data Pribadi yang Kami Kumpulkan',
      content: `Kami mengumpulkan data berikut untuk operasional Guide App:
- Data Identitas: Nama lengkap, NIK/KTP, tanggal lahir, alamat
- Data Kontak: Nomor telepon, email, alamat domisili
- Data Sertifikasi: Nomor sertifikat, jenis sertifikasi, masa berlaku
- Data Bank: Nomor rekening, nama bank (untuk pembayaran gaji)
- Foto Profil: Untuk identifikasi dan ID card digital`,
    },
    {
      title: '2. Data Lokasi & Tracking',
      content: `Selama trip, kami melakukan tracking lokasi untuk:
- Memastikan keselamatan guide dan peserta
- Verifikasi attendance check-in/check-out
- Monitoring real-time posisi trip untuk operasional
- Emergency response jika terjadi insiden
- Data lokasi hanya dikumpulkan saat trip aktif dan dapat dimatikan setelah trip selesai`,
    },
    {
      title: '3. Data Performa & Rating',
      content: `Kami mengumpulkan data performa untuk evaluasi dan pengembangan karir:
- Rating dari customer dan ops team
- Jumlah trip completed dan cancel rate
- Response time dan attendance record
- Feedback dan review dari peserta
- Training completion dan assessment scores`,
    },
    {
      title: '4. Dokumentasi Trip',
      content: `Data dokumentasi trip yang kami simpan:
- Foto dan video trip yang di-upload guide
- Passenger consent forms
- Manifest boarding status
- Incident reports dan bukti foto
- Expense receipts untuk reimbursement`,
    },
    {
      title: '5. Passenger Consent Data',
      content: `Guide mengumpulkan passenger consent yang berisi:
- Persetujuan mengikuti trip dan waiver liability
- Data kesehatan dan kondisi medis relevan
- Emergency contact information
- Data ini disimpan sesuai regulasi dan hanya diakses untuk keperluan trip safety`,
    },
    {
      title: '6. Penggunaan Data',
      content: `Data guide digunakan untuk:
- Manajemen trip assignment dan scheduling
- Perhitungan gaji, bonus, dan reward points
- Performance evaluation dan career progression
- Safety monitoring dan emergency response
- Training & development program
- Analytics untuk meningkatkan operasional`,
    },
    {
      title: '7. Pembagian Data',
      content: `Kami tidak menjual data guide. Data hanya dibagikan kepada:
- Ops coordinator untuk manajemen trip
- Finance team untuk processing pembayaran
- Training team untuk sertifikasi dan assessment
- Pihak berwenang jika diperlukan untuk legal compliance
- Third-party service providers (payment gateway, cloud storage) dengan NDA`,
    },
    {
      title: '8. Keamanan Data',
      content: `Kami melindungi data guide dengan:
- Enkripsi data sensitif (NIK, nomor rekening)
- Access control berbasis role (ops, finance, admin)
- Regular security audit dan penetration testing
- Backup data otomatis untuk disaster recovery
- SSL/TLS encryption untuk data transmission`,
    },
    {
      title: '9. Hak Guide atas Data',
      content: `Guide berhak untuk:
- Mengakses dan melihat data pribadi yang tersimpan
- Meminta koreksi data yang tidak akurat
- Mengajukan penghapusan data (dengan syarat)
- Mengunduh data pribadi (data portability)
- Menolak pemrosesan data tertentu (dengan limitasi operasional)`,
    },
    {
      title: '10. Retensi Data',
      content: `Data guide disimpan selama:
- Selama masa aktif sebagai guide Aero Travel
- 3 tahun setelah terminasi untuk keperluan legal dan audit
- Data tertentu (incident reports, legal documents) disimpan lebih lama sesuai regulasi
- Setelah periode retensi, data akan dihapus secara permanen`,
    },
    {
      title: '11. Cookies & Analytics',
      content: `Guide App menggunakan:
- Cookies untuk session management dan preferences
- Analytics tools (Google Analytics, PostHog) untuk usage tracking
- Performance monitoring untuk improve app stability
- Guide dapat opt-out dari analytics non-essential`,
    },
    {
      title: '12. Perubahan Kebijakan',
      content: `Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan significant akan diberitahukan melalui:
- In-app notification
- Email ke semua guide aktif
- Announcement di guide dashboard
Penggunaan app setelah perubahan berarti guide menyetujui kebijakan yang diperbarui.`,
    },
  ];

  return (
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <Shield className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Kebijakan Privasi</h1>
        <p className="text-sm text-muted-foreground">
          Guide App - Terakhir diperbarui:{' '}
          {new Date().toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <Card key={index} className="border-none shadow-sm">
            <CardContent className="p-6">
              <h2 className="mb-3 text-base font-semibold">{section.title}</h2>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {section.content}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact */}
      <Card className="mt-6 border-none bg-emerald-500/5 shadow-sm">
        <CardContent className="p-6">
          <p className="text-sm text-foreground">
            <strong>Pertanyaan tentang Privasi?</strong>
            <br />
            Hubungi Data Protection Officer kami:
            <br />
            Email:{' '}
            <a
              href="mailto:privacy@aerotravel.co.id"
              className="text-emerald-600 underline"
            >
              privacy@aerotravel.co.id
            </a>
            <br />
            Phone: +62 812 3456 7890
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
