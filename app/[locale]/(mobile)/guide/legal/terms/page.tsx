/**
 * Guide Terms and Conditions Page
 * Route: /[locale]/guide/legal/terms
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
  themeColor: '#10b981',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return {
    title: 'Syarat dan Ketentuan - Guide App',
    description:
      'Syarat dan ketentuan penggunaan layanan Guide App Aero Travel',
  };
}

export default async function GuideTermsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <FileText className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Syarat dan Ketentuan</h1>
        <p className="text-sm text-muted-foreground">
          Ketentuan untuk Guide Aero Travel
        </p>
      </div>

      {/* Terms Content */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                1. Penugasan Trip & SOP
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Guide wajib menerima penugasan trip yang telah dikonfirmasi
                  minimal H-2
                </li>
                <li>
                  Guide harus mengikuti Standard Operating Procedure (SOP) yang
                  telah ditetapkan
                </li>
                <li>
                  Penolakan trip tanpa alasan valid dapat mempengaruhi rating
                  dan penugasan selanjutnya
                </li>
                <li>
                  Guide bertanggung jawab penuh atas keselamatan peserta selama
                  trip
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                2. Attendance & Check-In
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Check-in wajib dilakukan via GPS di meeting point maksimal 30
                  menit sebelum departure
                </li>
                <li>
                  Keterlambatan check-in tanpa konfirmasi akan dikenakan penalty
                </li>
                <li>
                  Guide wajib mengaktifkan tracking lokasi selama trip untuk
                  keamanan
                </li>
                <li>
                  Check-out dilakukan setelah semua peserta safely kembali ke
                  meeting point
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                3. Manifest Management
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Guide wajib memverifikasi identitas semua peserta sebelum
                  departure
                </li>
                <li>
                  Passenger consent form harus dikumpulkan dan di-upload ke
                  sistem
                </li>
                <li>
                  Guide bertanggung jawab atas boarding status dan dokumentasi
                  trip
                </li>
                <li>
                  Link dokumentasi (foto/video) wajib di-upload maksimal H+1
                  setelah trip
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                4. Payment & Earnings
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Pembayaran gaji guide dilakukan setiap akhir bulan via
                  transfer ke rekening terdaftar
                </li>
                <li>
                  Perhitungan earnings berdasarkan jumlah trip, durasi, dan
                  performa rating
                </li>
                <li>
                  Bonus reward points dapat ditukar dengan voucher atau cash
                  sesuai kebijakan
                </li>
                <li>
                  Guide wajib melaporkan pengeluaran trip dengan bukti foto
                  untuk reimbursement
                </li>
                <li>
                  Settlement dilakukan maksimal 7 hari kerja setelah approval
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                5. Certification & License
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Guide wajib memiliki sertifikasi yang valid (Dive Master,
                  First Aid, CPR, dll)
                </li>
                <li>
                  Renewal sertifikasi wajib dilakukan sebelum masa berlaku habis
                </li>
                <li>
                  Guide dengan sertifikasi expired tidak akan mendapat penugasan
                  trip
                </li>
                <li>
                  Perusahaan menyediakan training mandatory untuk perpanjangan
                  sertifikasi
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                6. Performance & Ratings
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Rating guide dihitung berdasarkan feedback customer dan
                  evaluasi ops team
                </li>
                <li>
                  Guide dengan rating di bawah 4.0 akan mendapat coaching dan
                  monitoring khusus
                </li>
                <li>
                  Performance review dilakukan setiap 3 bulan untuk career
                  progression
                </li>
                <li>
                  Guide dengan rating konsisten tinggi mendapat prioritas trip
                  premium
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                7. Incident Reporting
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Guide wajib melaporkan setiap insiden (injury, equipment
                  failure, dll) via form insiden
                </li>
                <li>
                  Laporan harus dibuat maksimal 2 jam setelah insiden terjadi
                </li>
                <li>
                  Insiden critical harus diikuti dengan telepon ke ops
                  coordinator
                </li>
                <li>
                  Guide bertanggung jawab atas dokumentasi foto/video bukti
                  insiden
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                8. Equipment & Safety Gear
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Guide wajib melakukan pengecekan equipment sebelum dan setelah
                  trip
                </li>
                <li>
                  Equipment rusak atau hilang menjadi tanggung jawab guide
                  sesuai perjanjian
                </li>
                <li>
                  Guide wajib memastikan semua peserta menggunakan safety gear
                  dengan benar
                </li>
                <li>
                  Pelaporan kerusakan equipment dilakukan via app maksimal H+1
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                9. Rewards & Challenges
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Guide berhak mengikuti program rewards dan challenges untuk
                  mendapat bonus
                </li>
                <li>
                  Reward points dapat ditukar dengan voucher, merchandise, atau
                  cash
                </li>
                <li>
                  Challenges bersifat sukarela dan tidak mempengaruhi penugasan
                  regular trip
                </li>
                <li>Pemenang challenges diumumkan setiap akhir bulan</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                10. Termination & Suspension
              </h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Perusahaan berhak melakukan suspension atau termination terhadap
                guide dalam kondisi:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Pelanggaran SOP yang membahayakan keselamatan peserta</li>
                <li>Rating konsisten di bawah 3.5 setelah coaching period</li>
                <li>
                  Keterlambatan atau no-show tanpa konfirmasi lebih dari 3x
                </li>
                <li>Fraud atau misconduct dalam laporan expense/dokumentasi</li>
                <li>Sertifikasi expired tanpa upaya renewal</li>
              </ul>
            </section>

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-sm text-foreground">
                <strong>Ada Pertanyaan?</strong> Hubungi Guide Coordinator
                melalui Chat atau email{' '}
                <a
                  href="mailto:guide-support@aerotravel.co.id"
                  className="text-emerald-600 underline"
                >
                  guide-support@aerotravel.co.id
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
