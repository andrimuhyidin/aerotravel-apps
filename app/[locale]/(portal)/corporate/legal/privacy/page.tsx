/**
 * Corporate Privacy Policy Page
 * Route: /[locale]/corporate/legal/privacy
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
  themeColor: '#2563eb',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return {
    title: 'Kebijakan Privasi - Corporate Portal',
    description: 'Kebijakan privasi Corporate Portal Aero Travel',
  };
}

export default async function CorporatePrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sections = [
    {
      title: '1. Data Corporate yang Kami Kumpulkan',
      content: `Kami mengumpulkan data berikut untuk Corporate Travel Program:
- Data Perusahaan: Nama perusahaan, NPWP, alamat kantor, industry type
- Data Admin: Nama PIC, email, nomor telepon, employee ID
- Data Bank: Untuk deposit top-up dan refund processing
- Corporate Documents: Company profile, travel policy, approval workflow settings`,
    },
    {
      title: '2. Data Employee',
      content: `Corporate admin dapat add employee ke system:
- Data Employee: Nama, email, employee ID, department, cost center
- Booking Data: Travel history, preferences, spending patterns
- Approval Chain: Manager hierarchy untuk approval workflow
- Employee data HANYA diakses oleh admin corporate dan tidak dibagikan ke pihak lain tanpa consent`,
    },
    {
      title: '3. Data Booking & Travel',
      content: `Kami mencatat semua corporate booking:
- Booking details per employee (tanggal, destination, package, cost)
- Approval status dan history
- Payment dan invoice records
- Travel satisfaction scores dan feedback
- Data ini digunakan untuk analytics, reporting, dan compliance audit`,
    },
    {
      title: '4. Invoice & Financial Data',
      content: `Financial data yang disimpan:
- Invoice history dan payment records
- Deposit balance dan transaction log
- Tax documents dan withholding receipts
- Credit limit dan payment terms
- Data financial di-encrypt dan hanya diakses by authorized finance team`,
    },
    {
      title: '5. Usage Analytics',
      content: `Corporate portal analytics untuk optimize user experience:
- Dashboard usage patterns
- Feature adoption rates
- Search dan filter preferences
- Response times dan performance metrics
- Analytics data di-aggregate dan tidak personally identifiable`,
    },
    {
      title: '6. Penggunaan Data',
      content: `Data corporate digunakan untuk:
- Processing bookings dan payment settlements
- Generating invoices dan financial reports
- Travel policy compliance monitoring
- Dashboard analytics dan business intelligence
- Account management dan relationship building
- Platform improvement berdasarkan feedback`,
    },
    {
      title: '7. Pembagian Data',
      content: `Kami TIDAK menjual corporate data. Data hanya dibagikan kepada:
- Internal teams (ops, finance, account management)
- Payment gateway untuk payment processing
- Tax authorities untuk compliance (jika diperlukan)
- Legal authorities dalam case of investigation
- Third-party service providers dengan NDA (cloud hosting, email service)`,
    },
    {
      title: '8. Keamanan Data',
      content: `Kami melindungi corporate data dengan:
- Enterprise-grade encryption (AES-256) untuk data at rest
- SSL/TLS untuk data in transit
- Role-based access control (RBAC)
- Multi-factor authentication (MFA) untuk admin accounts
- Regular security audits dan compliance checks
- SOC 2 compliance (in progress)
- Disaster recovery dan backup automated`,
    },
    {
      title: '9. Hak Corporate atas Data',
      content: `Corporate admin berhak untuk:
- Mengakses semua data yang tersimpan
- Export data (booking history, invoices, employee data) dalam berbagai format
- Meminta koreksi data yang tidak akurat
- Mengajukan penghapusan data setelah account termination (dengan retention period)
- Audit trail untuk compliance purposes`,
    },
    {
      title: '10. Employee Privacy Rights',
      content: `Setiap employee berhak untuk:
- Akses ke personal booking history mereka
- Request deletion setelah resign dari company
- Opt-out dari marketing communications (tapi not from operational notifications)
- Privacy settings untuk hide travel data dari other employees
- Corporate admin wajib inform employees about data collection practices`,
    },
    {
      title: '11. Data Retention',
      content: `Corporate data disimpan selama:
- Selama masa corporate account aktif
- 7 tahun setelah account termination untuk tax compliance
- Employee data dapat dihapus earlier jika employee request setelah resign
- Financial records (invoices, payments) follow local tax regulations (min 10 tahun)`,
    },
    {
      title: '12. GDPR & Compliance',
      content: `Untuk international corporate clients:
- GDPR compliant untuk EU corporate accounts
- Data Processing Agreement (DPA) available on request
- Data residency options untuk sensitive corporate data
- Regular compliance audits dan certifications
- Appointed Data Protection Officer (DPO) untuk large accounts`,
    },
  ];

  return (
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Kebijakan Privasi</h1>
        <p className="text-sm text-muted-foreground">
          Corporate Portal - Terakhir diperbarui:{' '}
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
      <Card className="mt-6 border-none bg-blue-500/5 shadow-sm">
        <CardContent className="p-6">
          <p className="text-sm text-foreground">
            <strong>Pertanyaan tentang Data Privacy?</strong>
            <br />
            Hubungi Corporate Account Manager atau Data Protection Officer:
            <br />
            Email:{' '}
            <a
              href="mailto:privacy@aerotravel.co.id"
              className="text-blue-600 underline"
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
