/**
 * Terms and Conditions Page
 * Route: /[locale]/legal/terms
 */

import { FileText } from 'lucide-react';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Syarat dan Ketentuan - Aero Travel',
    description:
      'Syarat dan ketentuan penggunaan layanan Aero Travel. Baca ketentuan lengkap sebelum menggunakan layanan kami.',
    alternates: {
      canonical: `${baseUrl}/${locale}/legal/terms`,
    },
  };
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      {/* Hero */}
      <Section className="bg-gradient-to-br from-primary/5 via-background to-aero-teal/5">
        <Container>
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-4 text-4xl font-bold">Syarat dan Ketentuan</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Ketentuan penggunaan layanan Aero Travel. Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </Container>
      </Section>

      {/* Terms Content */}
      <Section>
        <Container>
          <div className="mx-auto max-w-4xl py-12">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <div className="prose prose-slate max-w-none">
                  <h2 className="mb-4 text-2xl font-bold text-slate-900">
                    Syarat dan Ketentuan Layanan Aero Travel
                  </h2>

                  <section className="mb-8">
                    <h3 className="mb-3 text-xl font-semibold text-slate-900">1. Definisi</h3>
                    <ul className="list-disc space-y-2 pl-6 text-slate-700">
                      <li>
                        <strong>&quot;Aero Travel&quot;</strong> adalah penyedia jasa perjalanan wisata bahari
                      </li>
                      <li>
                        <strong>&quot;Pelanggan&quot;</strong> adalah pengguna yang memesan layanan
                      </li>
                      <li>
                        <strong>&quot;Guide&quot;</strong> adalah pemandu wisata yang terdaftar dan terverifikasi
                      </li>
                      <li>
                        <strong>&quot;Trip&quot;</strong> adalah perjalanan wisata yang disediakan oleh Aero Travel
                      </li>
                    </ul>
                  </section>

                  <section className="mb-8">
                    <h3 className="mb-3 text-xl font-semibold text-slate-900">
                      2. Pemesanan & Pembayaran
                    </h3>
                    <ul className="list-disc space-y-2 pl-6 text-slate-700">
                      <li>Pemesanan dianggap sah setelah pembayaran DP minimal 50%</li>
                      <li>Pelunasan maksimal H-3 sebelum keberangkatan</li>
                      <li>Pembatalan akan dikenakan biaya sesuai kebijakan</li>
                      <li>Pembayaran dapat dilakukan melalui transfer bank atau metode pembayaran yang tersedia</li>
                    </ul>
                  </section>

                  <section className="mb-8">
                    <h3 className="mb-3 text-xl font-semibold text-slate-900">3. Kebijakan Pembatalan</h3>
                    <ul className="list-disc space-y-2 pl-6 text-slate-700">
                      <li>H-7 atau lebih: Refund 75%</li>
                      <li>H-3 s/d H-6: Refund 50%</li>
                      <li>H-1 s/d H-2: Refund 25%</li>
                      <li>Hari-H: Tidak ada refund</li>
                      <li>
                        Pembatalan oleh Aero Travel karena force majeure akan mendapatkan refund penuh atau
                        penjadwalan ulang
                      </li>
                    </ul>
                  </section>

                  <section className="mb-8">
                    <h3 className="mb-3 text-xl font-semibold text-slate-900">4. Keselamatan</h3>
                    <ul className="list-disc space-y-2 pl-6 text-slate-700">
                      <li>Peserta wajib mengikuti instruksi guide dan petugas keselamatan</li>
                      <li>Peserta bertanggung jawab atas keselamatan pribadi</li>
                      <li>Aero Travel menyediakan asuransi perjalanan dasar</li>
                      <li>
                        Peserta dengan kondisi medis tertentu wajib memberitahu sebelum keberangkatan
                      </li>
                      <li>Peserta di bawah umur harus didampingi oleh orang tua atau wali</li>
                    </ul>
                  </section>

                  <section className="mb-8">
                    <h3 className="mb-3 text-xl font-semibold text-slate-900">5. Force Majeure</h3>
                    <p className="mb-2 text-slate-700">
                      Aero Travel tidak bertanggung jawab atas pembatalan akibat:
                    </p>
                    <ul className="list-disc space-y-2 pl-6 text-slate-700">
                      <li>Cuaca buruk / bencana alam</li>
                      <li>Kebijakan pemerintah</li>
                      <li>Kondisi darurat lainnya</li>
                      <li>Pandemi atau wabah penyakit</li>
                      <li>Perang, kerusuhan, atau konflik</li>
                    </ul>
                  </section>

                  <section className="mb-8">
                    <h3 className="mb-3 text-xl font-semibold text-slate-900">6. Persetujuan Data</h3>
                    <p className="mb-2 text-slate-700">
                      Dengan menyetujui, Anda mengizinkan Aero Travel untuk:
                    </p>
                    <ul className="list-disc space-y-2 pl-6 text-slate-700">
                      <li>Menyimpan data pribadi untuk keperluan pemesanan</li>
                      <li>Menghubungi via WhatsApp/Email untuk informasi trip</li>
                      <li>Menggunakan foto perjalanan untuk keperluan promosi</li>
                      <li>Menggunakan data untuk keperluan analitik dan peningkatan layanan</li>
                    </ul>
                  </section>

                  <section className="mb-8">
                    <h3 className="mb-3 text-xl font-semibold text-slate-900">7. Ketentuan untuk Guide</h3>
                    <ul className="list-disc space-y-2 pl-6 text-slate-700">
                      <li>Guide wajib memiliki sertifikat dan dokumen yang diperlukan</li>
                      <li>Guide bertanggung jawab atas keselamatan peserta selama trip</li>
                      <li>Guide wajib mengikuti SOP dan prosedur keselamatan yang ditetapkan</li>
                      <li>Guide wajib melaporkan insiden atau kejadian yang terjadi selama trip</li>
                      <li>Pembayaran guide akan dilakukan sesuai dengan perjanjian yang telah disepakati</li>
                    </ul>
                  </section>

                  <section className="mb-8">
                    <h3 className="mb-3 text-xl font-semibold text-slate-900">8. Hak Kekayaan Intelektual</h3>
                    <ul className="list-disc space-y-2 pl-6 text-slate-700">
                      <li>
                        Semua konten, logo, dan materi di website dan aplikasi Aero Travel adalah milik Aero Travel
                      </li>
                      <li>Penggunaan konten tanpa izin akan ditindak sesuai hukum yang berlaku</li>
                    </ul>
                  </section>

                  <section className="mb-8">
                    <h3 className="mb-3 text-xl font-semibold text-slate-900">9. Perubahan Ketentuan</h3>
                    <p className="text-slate-700">
                      Aero Travel berhak mengubah syarat dan ketentuan ini kapan saja tanpa pemberitahuan
                      sebelumnya. Perubahan akan berlaku efektif setelah dipublikasikan di website atau aplikasi.
                      Penggunaan layanan setelah perubahan berarti Anda menyetujui ketentuan yang baru.
                    </p>
                  </section>

                  <section className="mb-8">
                    <h3 className="mb-3 text-xl font-semibold text-slate-900">10. Hukum yang Berlaku</h3>
                    <p className="text-slate-700">
                      Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa akan
                      diselesaikan melalui musyawarah, dan jika tidak tercapai kesepakatan, akan diselesaikan
                      melalui pengadilan yang berwenang di Indonesia.
                    </p>
                  </section>

                  <div className="mt-8 rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">
                      <strong>Catatan:</strong> Jika Anda memiliki pertanyaan atau membutuhkan klarifikasi mengenai
                      syarat dan ketentuan ini, silakan hubungi tim support kami melalui email{' '}
                      <a href="mailto:support@aerotravel.co.id" className="text-primary underline">
                        support@aerotravel.co.id
                      </a>{' '}
                      atau WhatsApp{' '}
                      <a href="https://wa.me/6281234567890" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                        +62 812 3456 7890
                      </a>
                      .
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
