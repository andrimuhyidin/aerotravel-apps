/**
 * Partner Terms and Conditions Page
 * Route: /[locale]/partner/legal/terms
 */

import { FileText } from 'lucide-react';
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
    title: 'Syarat dan Ketentuan - Partner Portal',
    description: 'Syarat dan ketentuan kemitraan dengan Aero Travel',
  };
}

export default async function PartnerTermsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
          <FileText className="h-8 w-8 text-orange-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Syarat dan Ketentuan</h1>
        <p className="text-sm text-muted-foreground">
          Perjanjian Kemitraan Aero Travel
        </p>
      </div>

      {/* Terms Content */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                1. Perjanjian Kemitraan
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Perjanjian ini berlaku antara Aero Travel dan Partner
                  terdaftar
                </li>
                <li>
                  Partner setuju untuk menyediakan paket wisata sesuai standar
                  yang ditetapkan
                </li>
                <li>
                  Aero Travel bertindak sebagai platform marketplace dan
                  marketing channel
                </li>
                <li>
                  Masa perjanjian: 1 tahun, diperpanjang otomatis kecuali ada
                  terminasi
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                2. Komisi & Settlement
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Struktur komisi: 15-25% dari harga paket tergantung volume dan
                  kategori
                </li>
                <li>
                  Settlement dilakukan setiap 2 minggu (NET 15) atau bulanan
                  (NET 30)
                </li>
                <li>
                  Payment melalui transfer bank ke rekening partner terdaftar
                </li>
                <li>
                  Komisi dihitung setelah trip completed dan tidak ada dispute
                </li>
                <li>
                  Partner akan menerima invoice detail untuk setiap settlement
                  period
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                3. Product & Package Listing
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Partner bertanggung jawab atas akurasi informasi paket
                  (deskripsi, harga, itinerary)
                </li>
                <li>
                  Perubahan harga atau availability harus di-update maksimal H-1
                </li>
                <li>
                  Foto dan deskripsi harus original atau memiliki izin
                  penggunaan
                </li>
                <li>
                  Aero Travel berhak menolak atau menonaktifkan paket yang tidak
                  sesuai standar
                </li>
                <li>
                  Partner tidak boleh mencantumkan kontak langsung untuk bypass
                  booking
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                4. Booking Management
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Partner wajib konfirmasi booking maksimal 4 jam setelah
                  customer booking
                </li>
                <li>
                  Partner tidak boleh menolak booking tanpa alasan valid (force
                  majeure, overbooking)
                </li>
                <li>
                  Jika terjadi overbooking, partner bertanggung jawab mencari
                  alternatif setara
                </li>
                <li>
                  Partner wajib menyediakan customer support selama trip
                  berlangsung
                </li>
                <li>
                  Cancellation dari partner kurang dari H-3 akan dikenakan
                  penalty
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">5. Payment Terms</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Customer payment di-hold oleh Aero Travel hingga trip
                  completed
                </li>
                <li>
                  Partner menerima payment (minus komisi) sesuai settlement
                  schedule
                </li>
                <li>
                  Dispute atau refund request akan menunda settlement hingga
                  resolved
                </li>
                <li>
                  Partner wajib menyediakan invoice untuk setiap transaksi B2B
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                6. White-Label Branding
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Partner dengan volume tinggi dapat menggunakan white-label
                  branding (additional fee)
                </li>
                <li>
                  White-label memungkinkan custom domain, logo, dan color scheme
                </li>
                <li>
                  Partner tetap harus mengikuti platform rules dan quality
                  standards
                </li>
                <li>
                  Aero Travel menyediakan API integration untuk white-label
                  partners
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                7. Performance Requirements
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Partner harus maintain rating minimal 4.0/5.0</li>
                <li>Response time untuk booking confirmation maksimal 4 jam</li>
                <li>Cancellation rate tidak boleh lebih dari 5% per bulan</li>
                <li>
                  Partner dengan performa rendah akan mendapat warning dan
                  coaching
                </li>
                <li>
                  Pelanggaran berulang dapat menyebabkan suspension atau
                  terminasi
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                8. Quality & Safety Standards
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Partner wajib memiliki izin usaha dan dokumen legal yang valid
                </li>
                <li>Equipment dan boat harus memenuhi standar keselamatan</li>
                <li>
                  Guide partner harus memiliki sertifikasi sesuai jenis trip
                </li>
                <li>
                  Asuransi wajib untuk semua trip yang melibatkan water
                  activities
                </li>
                <li>Partner harus comply dengan environmental regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                9. Dispute & Refund Policy
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Customer dispute akan di-mediasi oleh Aero Travel</li>
                <li>
                  Jika partner terbukti fault, refund ditanggung oleh partner
                </li>
                <li>
                  Partial refund dapat dinegosiasikan untuk service tidak sesuai
                </li>
                <li>
                  Aero Travel berhak mem-block settlement jika ada dispute
                  unresolved
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                10. Termination Conditions
              </h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Perjanjian dapat diakhiri oleh Aero Travel jika:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Partner melanggar terms & conditions secara berulang</li>
                <li>Rating turun di bawah 3.5 selama 3 bulan berturut-turut</li>
                <li>Terbukti melakukan fraud atau misconduct</li>
                <li>Partner tidak aktif (no booking) selama 6 bulan</li>
                <li>Dokumen legal expired dan tidak di-renew</li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Partner dapat mengakhiri perjanjian dengan notice period 30
                hari. Settlement terakhir akan diproses sesuai jadwal.
              </p>
            </section>

            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="text-sm text-foreground">
                <strong>Pertanyaan Kemitraan?</strong> Hubungi Partnership
                Manager kami:
                <br />
                Email:{' '}
                <a
                  href="mailto:partner@aerotravel.co.id"
                  className="text-orange-600 underline"
                >
                  partner@aerotravel.co.id
                </a>
                <br />
                Phone: +62 812 3456 7890
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
