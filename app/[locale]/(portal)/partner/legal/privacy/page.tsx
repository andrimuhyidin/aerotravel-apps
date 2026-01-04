/**
 * Partner Privacy Policy Page
 * Route: /[locale]/partner/legal/privacy
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
  themeColor: '#ea580c',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return {
    title: 'Kebijakan Privasi - Partner Portal',
    description: 'Kebijakan privasi Partner Portal Aero Travel',
  };
}

export default async function PartnerPrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sections = [
    {
      title: '1. Data Partner yang Kami Kumpulkan',
      content: `Kami mengumpulkan data berikut untuk operasional Partner Portal:
- Data Perusahaan: Nama perusahaan, NPWP, alamat kantor, dokumen legal
- Data Kontak: Nama PIC, email, nomor telepon, WhatsApp
- Data Bank: Nama rekening, nomor rekening, nama bank (untuk settlement)
- Data Produk: Deskripsi paket, harga, foto, itinerary, availability
- Dokumen Legalitas: SIUP, TDP, izin usaha, asuransi`,
    },
    {
      title: '2. Data Booking & Customer',
      content: `Partner memiliki akses ke data customer untuk keperluan operasional:
- Nama customer, kontak, dan jumlah peserta
- Detail booking (tanggal, paket, special requests)
- Payment status dan proof of payment
- Partner TIDAK boleh menggunakan data customer untuk marketing langsung di luar platform
- Data customer tetap menjadi property Aero Travel`,
    },
    {
      title: '3. Data Komisi & Transaksi',
      content: `Kami mencatat semua transaksi dan komisi:
- Riwayat booking dan revenue per paket
- Perhitungan komisi dan fee structure
- Settlement history dan payment records
- Invoice dan tax documents
- Data ini digunakan untuk financial reporting dan compliance`,
    },
    {
      title: '4. Analytics & Reporting Data',
      content: `Partner dashboard menampilkan analytics:
- Booking trends dan peak seasons
- Rating dan review dari customers
- Performance metrics (response time, cancellation rate)
- Revenue analytics dan forecasting
- Data ini membantu partner optimize pricing dan availability`,
    },
    {
      title: '5. White-Label Customization',
      content: `Untuk white-label partners:
- Logo dan branding assets yang di-upload
- Custom domain configuration
- Color scheme dan theme preferences
- API keys dan integration settings
- Data ini disimpan securely dan tidak dibagikan ke pihak lain`,
    },
    {
      title: '6. Penggunaan Data',
      content: `Data partner digunakan untuk:
- Processing bookings dan settlements
- Performance evaluation dan reporting
- Marketing promotion (dengan consent)
- Platform improvement dan analytics
- Compliance dengan tax dan legal regulations
- Customer support dan dispute resolution`,
    },
    {
      title: '7. Pembagian Data',
      content: `Kami TIDAK menjual data partner. Data hanya dibagikan kepada:
- Internal teams (ops, finance, support)
- Payment gateway untuk settlement processing
- Tax authorities untuk compliance (jika diperlukan)
- Legal authorities jika ada investigation
- Third-party service providers dengan NDA`,
    },
    {
      title: '8. Keamanan Data',
      content: `Kami melindungi data partner dengan:
- SSL/TLS encryption untuk data transmission
- Database encryption untuk sensitive data (bank info, NPWP)
- Role-based access control
- Regular security audits dan penetration testing
- Backup automated untuk disaster recovery
- 2FA available untuk partner account security`,
    },
    {
      title: '9. Hak Partner atas Data',
      content: `Partner berhak untuk:
- Mengakses semua data yang tersimpan
- Meminta koreksi data yang tidak akurat
- Export data (booking history, invoices, reports)
- Mengajukan penghapusan data setelah terminasi (dengan retention period)
- Opt-out dari marketing communications (tetapi tidak bisa opt-out dari operational emails)`,
    },
    {
      title: '10. Retensi Data',
      content: `Data partner disimpan selama:
- Selama masa partnership aktif
- 5 tahun setelah terminasi untuk keperluan audit dan legal compliance
- Data financial (invoices, settlements) disimpan sesuai tax regulations (min 10 tahun)
- Setelah periode retensi, data akan dihapus atau dianonimkan`,
    },
    {
      title: '11. Cookies & Tracking',
      content: `Partner Portal menggunakan:
- Session cookies untuk authentication
- Analytics cookies untuk usage tracking (Google Analytics, PostHog)
- Performance cookies untuk monitoring dashboard load time
- Partner dapat manage cookie preferences di settings`,
    },
    {
      title: '12. Perubahan Kebijakan',
      content: `Kami dapat update kebijakan privasi ini dari waktu ke waktu. Changes akan dinotifikasikan via:
- Email ke semua partner aktif
- Banner notification di Partner Portal
- Announcement di dashboard
Continued use of portal after changes = acceptance of new terms.`,
    },
  ];

  return (
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Kebijakan Privasi</h1>
        <p className="text-sm text-muted-foreground">
          Partner Portal - Terakhir diperbarui:{' '}
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
      <Card className="mt-6 border-none bg-primary/5 shadow-sm">
        <CardContent className="p-6">
          <p className="text-sm text-foreground">
            <strong>Pertanyaan tentang Privasi?</strong>
            <br />
            Hubungi Partnership Manager:
            <br />
            Email:{' '}
            <a
              href="mailto:partner@aerotravel.co.id"
              className="text-primary underline"
            >
              partner@aerotravel.co.id
            </a>
            <br />
            Phone: +62 812 3456 7890
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
