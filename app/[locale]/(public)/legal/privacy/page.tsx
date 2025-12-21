/**
 * Privacy Policy Page
 * Route: /[locale]/legal/privacy
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
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
  themeColor: '#000000',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Kebijakan Privasi - Aero Travel',
    description:
      'Kebijakan privasi Aero Travel menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.',
    alternates: {
      canonical: `${baseUrl}/${locale}/legal/privacy`,
    },
  };
}

export default async function PrivacyPolicyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sections = [
    {
      title: '1. Pengenalan',
      content: `Kebijakan Privasi ini menjelaskan bagaimana Aero Travel ("kami", "kita", atau "perusahaan") mengumpulkan, menggunakan, mengungkapkan, dan melindungi informasi pribadi Anda ketika Anda menggunakan aplikasi Guide App dan layanan terkait.`,
    },
    {
      title: '2. Informasi yang Kami Kumpulkan',
      content: `Kami dapat mengumpulkan informasi berikut:
- Informasi Pribadi: nama lengkap, email, nomor telepon, alamat
- Informasi Profil: foto profil, NIK, informasi bank untuk pembayaran
- Data Lokasi: koordinat GPS saat menggunakan fitur attendance dan tracking
- Data Trip: informasi tentang trip yang ditugaskan, manifest penumpang, dokumentasi
- Data Teknis: alamat IP, jenis perangkat, sistem operasi, versi aplikasi`,
    },
    {
      title: '3. Bagaimana Kami Menggunakan Informasi',
      content: `Kami menggunakan informasi yang dikumpulkan untuk:
- Menyediakan dan mengelola layanan Guide App
- Memproses pembayaran gaji dan pendapatan
- Melacak kehadiran dan lokasi untuk keamanan
- Mengelola manifest penumpang dan dokumentasi trip
- Mengirim notifikasi penting tentang trip dan pembaruan
- Meningkatkan kualitas layanan dan pengalaman pengguna`,
    },
    {
      title: '4. Perlindungan Data',
      content: `Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang wajar untuk melindungi informasi pribadi Anda dari akses yang tidak sah, perubahan, pengungkapan, atau penghancuran. Data disimpan di server yang aman dan dienkripsi.`,
    },
    {
      title: '5. Pembagian Data',
      content: `Kami tidak menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga. Kami dapat membagikan data hanya dalam situasi berikut:
- Dengan persetujuan Anda
- Untuk mematuhi kewajiban hukum
- Dengan vendor layanan yang membantu operasional (dengan perjanjian kerahasiaan)
- Dalam keadaan darurat untuk keselamatan`,
    },
    {
      title: '6. Hak Anda',
      content: `Anda memiliki hak untuk:
- Mengakses data pribadi Anda
- Memperbaiki data yang tidak akurat
- Meminta penghapusan data
- Menolak pemrosesan data tertentu
- Portabilitas data`,
    },
    {
      title: '7. Retensi Data',
      content: `Kami menyimpan data pribadi Anda selama diperlukan untuk tujuan yang dijelaskan dalam kebijakan ini, atau sesuai dengan persyaratan hukum. Data dapat dihapus setelah periode retensi yang berlaku.`,
    },
    {
      title: '8. Perubahan Kebijakan',
      content: `Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan akan diberitahukan melalui aplikasi atau email. Kami menyarankan Anda untuk meninjau kebijakan ini secara berkala.`,
    },
    {
      title: '9. Kontak',
      content: `Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami:
- Email: privacy@aerotravel.co.id
- Telepon: +62 812 3456 7890
- Alamat: Bandar Lampung, Indonesia`,
    },
  ];

  return (
    <>
      {/* Hero */}
      <Section className="bg-gradient-to-br from-primary/5 via-background to-aero-teal/5">
        <Container>
          <div className="py-6 sm:py-8 md:py-12 text-center">
            <h1 className="mb-3 sm:mb-4 text-xl sm:text-2xl md:text-3xl font-bold">Kebijakan Privasi</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </Container>
      </Section>

      {/* Content */}
      <Section>
        <Container className="py-4">
          <div className="space-y-3 sm:space-y-4">
            {sections.map((section, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="mb-2 sm:mb-3 text-base sm:text-lg font-bold text-slate-900">{section.title}</h2>
                  <div className="prose prose-sm max-w-none text-slate-700">
                    <p className="whitespace-pre-line leading-relaxed text-xs sm:text-sm">{section.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
