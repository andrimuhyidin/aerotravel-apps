/**
 * Corporate Help Page
 * Route: /[locale]/corporate/help
 */

import {
  Clock,
  FileText,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Users,
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
  themeColor: '#2563eb',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return {
    title: 'Bantuan - Corporate Portal',
    description: 'Pusat bantuan Corporate Portal Aero Travel',
  };
}

export default async function CorporateHelpPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const faqItems = [
    {
      question: 'Bagaimana cara mengelola employee di corporate account?',
      answer:
        'Buka halaman Employees, klik "Add Employee". Input nama, email, employee ID, dan department. Untuk bulk import, gunakan fitur "Import CSV". Set booking limit per employee jika diperlukan. Employee akan menerima invitation email untuk access portal.',
    },
    {
      question: 'Bagaimana cara membuat booking untuk employee?',
      answer:
        'Admin dapat create booking atas nama employee dari dashboard. Pilih employee, select package, tentukan tanggal. Booking akan auto-deduct dari corporate deposit. Employee juga dapat self-book dengan approval workflow jika di-enable.',
    },
    {
      question: 'Bagaimana cara top-up deposit corporate?',
      answer:
        'Buka halaman Deposit, pilih nominal top-up. Anda akan menerima invoice dan payment instructions. Transfer ke rekening corporate, lalu upload proof of payment. Deposit akan di-credit dalam 1-2 jam kerja setelah verifikasi.',
    },
    {
      question: 'Bagaimana cara approval booking dari employee?',
      answer:
        'Pending bookings akan muncul di dashboard dengan badge notifikasi. Click untuk review detail booking. Anda dapat approve, reject (dengan reason), atau request modification. Employee akan menerima notifikasi real-time.',
    },
    {
      question: 'Bagaimana cara tracking invoice dan payment?',
      answer:
        'Buka halaman Invoices untuk melihat semua invoice (monthly billing). Filter by status (unpaid/paid), download PDF, atau export ke Excel. Payment can be done via bank transfer dengan NET 30 terms. Late payment akan dinotifikasi via email.',
    },
    {
      question: 'Bagaimana cara set travel policy dan budget cap?',
      answer:
        'Buka Settings > Travel Policy. Upload policy document untuk employee reference. Set budget cap per trip atau per employee per month. Booking yang exceed budget akan flagged dan require manual approval dari admin.',
    },
    {
      question: 'Bagaimana cara melihat travel spend analytics?',
      answer:
        'Dashboard menampilkan spend summary, trends, dan breakdown per department/employee. Export detailed reports untuk accounting. Analytics include budget variance, peak booking periods, dan traveler satisfaction scores.',
    },
    {
      question: 'Bagaimana jika terjadi cancellation dari corporate side?',
      answer:
        'Corporate cancellation follow refund policy: H-7 = full refund, H-3 s/d H-6 = 80%, H-1 s/d H-2 = 50%. Refund akan di-credit kembali ke deposit balance. Untuk force majeure dari company (emergency, pandemic), dapat dinegosiasikan dengan account manager.',
    },
    {
      question: 'Bagaimana cara request custom rates atau volume discount?',
      answer:
        'Corporate dengan high booking volume (>50 trips/month) eligible untuk custom rates. Hubungi account manager untuk negotiation. Volume discount, seasonal rates, dan long-term contracts dapat diatur via corporate agreement amendment.',
    },
    {
      question: 'Bagaimana cara transition atau terminate corporate account?',
      answer:
        'Notice period 60 hari required. Settle outstanding balance terlebih dahulu. Unused deposit will be refunded penuh. Request data export untuk transition ke provider lain. Account manager akan assist dengan off-boarding process.',
    },
  ];

  const contactOptions = [
    {
      icon: Phone,
      title: 'Corporate Hotline',
      value: '+62 812 3456 7890',
      href: 'tel:+6281234567890',
      description: 'Priority line untuk corporate clients',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: '+62 812 3456 7890',
      href: 'https://wa.me/6281234567890',
      description: 'Fast response untuk urgent matters',
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'corporate@aerotravel.co.id',
      href: 'mailto:corporate@aerotravel.co.id',
      description: 'Response dalam 4 jam kerja',
    },
  ];

  const quickLinks = [
    {
      icon: Users,
      title: 'Employee Management',
      description: 'Add/remove employees',
      color: 'bg-blue-500',
    },
    {
      icon: FileText,
      title: 'Invoice & Reports',
      description: 'Download financial docs',
      color: 'bg-emerald-500',
    },
  ];

  return (
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
          <HelpCircle className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Pusat Bantuan</h1>
        <p className="text-sm text-muted-foreground">
          Corporate Portal Support Center
        </p>
      </div>

      {/* Quick Links */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">Quick Access</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((link, index) => (
            <Card key={index} className="border-none shadow-sm">
              <CardContent className="p-4 text-center">
                <div
                  className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${link.color}`}
                >
                  <link.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-1 text-sm font-semibold">{link.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {link.description}
                </p>
              </CardContent>
            </Card>
          ))}
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
                  <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
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
          Hubungi Corporate Account Manager
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold">{option.title}</h3>
                      <p className="text-xs font-medium text-blue-600">
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
      <Card className="border-none bg-blue-500/5 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold">
                Jam Layanan Corporate Support
              </p>
              <p className="text-xs text-muted-foreground">
                Senin - Jumat: 08:00 - 18:00 WIB
                <br />
                Emergency hotline: 24/7
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
