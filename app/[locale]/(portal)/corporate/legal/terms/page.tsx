/**
 * Corporate Terms and Conditions Page
 * Route: /[locale]/corporate/legal/terms
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
  themeColor: '#2563eb',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return {
    title: 'Syarat dan Ketentuan - Corporate Portal',
    description: 'Syarat dan ketentuan Corporate Travel Program Aero Travel',
  };
}

export default async function CorporateTermsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Syarat dan Ketentuan</h1>
        <p className="text-sm text-muted-foreground">
          Corporate Travel Program
        </p>
      </div>

      {/* Terms Content */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                1. Corporate Account Agreement
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Perjanjian ini berlaku untuk perusahaan yang terdaftar sebagai
                  corporate client
                </li>
                <li>
                  Corporate account dikelola oleh admin yang ditunjuk oleh
                  perusahaan
                </li>
                <li>Masa perjanjian: 1 tahun dengan auto-renewal</li>
                <li>
                  Terms dapat di-customize untuk large enterprise (min 500
                  employees)
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                2. Deposit System & Top-Up
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Corporate wajib maintain minimum deposit sesuai agreement
                  (default: 10 juta)
                </li>
                <li>
                  Top-up dapat dilakukan via transfer bank atau invoice billing
                </li>
                <li>Booking akan deduct otomatis dari deposit balance</li>
                <li>
                  Notifikasi akan dikirim jika balance di bawah threshold (30%
                  dari min deposit)
                </li>
                <li>
                  Top-up emergency dapat diproses same-day dengan approval
                  khusus
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                3. Employee Management
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Admin dapat add/remove employee ke corporate account</li>
                <li>Employee dapat membuat booking dengan approval workflow</li>
                <li>Admin menetapkan booking limit per employee (optional)</li>
                <li>
                  Employee data (nama, email, employee ID) di-manage via portal
                </li>
                <li>Bulk import employee via CSV/Excel supported</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                4. Booking Approval Workflow
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Admin dapat set approval workflow: auto-approve, manager
                  approval, atau finance approval
                </li>
                <li>
                  Booking di atas threshold tertentu require multi-level
                  approval
                </li>
                <li>Rejected booking akan refund deposit balance otomatis</li>
                <li>
                  Emergency booking dapat bypass approval dengan notification ke
                  admin
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                5. Invoice & Billing Cycle
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Invoice dikeluarkan setiap akhir bulan untuk semua transaksi
                </li>
                <li>
                  Format invoice: PDF dan Excel untuk accounting integration
                </li>
                <li>
                  Invoice breakdown per employee dan cost center (jika di-set)
                </li>
                <li>
                  Payment via transfer bank dengan NET 30 atau NET 60 terms
                </li>
                <li>Late payment dikenakan penalty 2% per bulan</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                6. Credit Limit & Terms
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Credit limit ditetapkan berdasarkan company size dan credit
                  assessment
                </li>
                <li>
                  Corporate dengan good payment history dapat request credit
                  limit increase
                </li>
                <li>
                  Booking di atas credit limit require cash/deposit top-up
                  terlebih dahulu
                </li>
                <li>
                  Credit terms: NET 30 (standard), NET 60 (large enterprise
                  dengan approval)
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                7. Travel Policy Compliance
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Corporate dapat upload travel policy document untuk referensi
                  employee
                </li>
                <li>Admin dapat set budget cap per trip atau per employee</li>
                <li>Booking yang violate policy akan flagged untuk review</li>
                <li>Compliance report tersedia monthly untuk audit purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                8. Cancellation & Refund
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Corporate booking follow standard cancellation policy dengan
                  flexibility tambahan
                </li>
                <li>Cancellation H-7: Full refund to deposit</li>
                <li>Cancellation H-3 s/d H-6: 80% refund</li>
                <li>Cancellation H-1 s/d H-2: 50% refund</li>
                <li>
                  Force majeure dari corporate side dapat dinegosiasikan
                  (company emergency, pandemic)
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                9. Reporting & Analytics
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Dashboard menampilkan travel spend analytics dan trends</li>
                <li>
                  Export report per department, cost center, atau employee
                </li>
                <li>Budget tracking dan variance analysis</li>
                <li>Traveler satisfaction scores dan feedback</li>
                <li>
                  Carbon footprint tracking untuk sustainability reporting
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                10. Dedicated Account Manager
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Corporate account dengan &gt;50 employees mendapat dedicated
                  account manager
                </li>
                <li>Quarterly business review untuk optimize travel program</li>
                <li>Priority support dan custom rates negotiation</li>
                <li>Proactive planning untuk peak season dan company events</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                11. Data Security & Compliance
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Employee data protected dengan encryption dan access control
                </li>
                <li>Compliance dengan GDPR dan local data protection laws</li>
                <li>Regular security audits dan penetration testing</li>
                <li>
                  Data retention sesuai corporate policy dan legal requirements
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-base font-semibold">
                12. Termination & Transition
              </h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Corporate account dapat diakhiri dengan kondisi:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Notice period 60 hari dari salah satu pihak</li>
                <li>Outstanding balance harus dilunasi sebelum terminasi</li>
                <li>Unused deposit akan di-refund penuh tanpa penalty</li>
                <li>Data export dapat di-request untuk transition</li>
                <li>
                  Pelanggaran payment terms berulang dapat trigger termination
                  dari Aero Travel
                </li>
              </ul>
            </section>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-sm text-foreground">
                <strong>Pertanyaan Corporate Program?</strong> Hubungi Corporate
                Account Manager:
                <br />
                Email:{' '}
                <a
                  href="mailto:corporate@aerotravel.co.id"
                  className="text-blue-600 underline"
                >
                  corporate@aerotravel.co.id
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
