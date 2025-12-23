/**
 * Corporate About Page
 * Route: /[locale]/corporate/about
 */

import { Award, BarChart, Shield, Users } from 'lucide-react';
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
    title: 'Tentang Corporate Program - Aero Travel',
    description: 'Program Corporate Travel Management Aero Travel',
  };
}

export default async function CorporateAboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const benefits = [
    {
      icon: BarChart,
      title: 'Cost Optimization',
      description:
        'Save up to 30% dengan volume discount dan smart booking analytics',
    },
    {
      icon: Shield,
      title: 'Policy Compliance',
      description:
        'Enforce travel policy dengan approval workflow dan budget controls',
    },
    {
      icon: Award,
      title: 'Premium Service',
      description: 'Dedicated account manager dan priority support',
    },
    {
      icon: Users,
      title: 'Easy Management',
      description: 'Centralized employee management dan booking tracking',
    },
  ];

  const features = [
    {
      title: 'Deposit System',
      description:
        'Maintain corporate deposit untuk seamless booking. Auto-deduct dan top-up flexible.',
    },
    {
      title: 'Employee Portal',
      description:
        'Self-service booking untuk employees dengan approval workflow customizable.',
    },
    {
      title: 'Budget Controls',
      description:
        'Set budget caps per employee atau per department. Real-time spend tracking.',
    },
    {
      title: 'Invoice & Reporting',
      description:
        'Monthly invoice dengan breakdown detail. Export reports untuk accounting integration.',
    },
    {
      title: 'Travel Policy',
      description:
        'Upload company travel policy. System akan flag bookings yang violate policy.',
    },
    {
      title: 'Analytics Dashboard',
      description:
        'Comprehensive analytics: spend trends, peak seasons, cost savings, employee satisfaction.',
    },
  ];

  return (
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 text-6xl">🏢</div>
        <h1 className="mb-2 text-2xl font-bold">Corporate Travel Program</h1>
        <p className="text-sm text-muted-foreground">
          Enterprise Travel Management Solution
        </p>
      </div>

      {/* Intro */}
      <Card className="mb-6 border-none shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-3 text-base font-semibold">
            Apa itu Corporate Travel Program?
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Corporate Travel Program adalah solusi B2B untuk perusahaan yang
              ingin mengelola employee travel dengan efisien. Kami menyediakan
              portal khusus dengan features seperti deposit management, approval
              workflow, budget controls, dan comprehensive reporting.
            </p>
            <p>
              Ideal untuk perusahaan dengan 20+ employees yang regularly
              organize team building, client meetings, atau corporate retreats.
              Save time, reduce costs, dan ensure policy compliance dengan our
              enterprise platform.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="mb-6">
        <div className="mb-4 text-center">
          <h2 className="mb-2 text-base font-semibold">Corporate Benefits</h2>
          <p className="text-sm text-muted-foreground">
            Keuntungan untuk perusahaan Anda
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-none shadow-sm">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                  <benefit.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="mb-2 text-sm font-semibold">{benefit.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mb-6">
        <div className="mb-4 text-center">
          <h2 className="mb-2 text-base font-semibold">Key Features</h2>
          <p className="text-sm text-muted-foreground">
            Platform features untuk corporate travel management
          </p>
        </div>
        <div className="space-y-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-sm">
              <CardContent className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-blue-600">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="mb-6">
        <div className="mb-4 text-center">
          <h2 className="mb-2 text-base font-semibold">Pricing Tiers</h2>
          <p className="text-sm text-muted-foreground">
            Based on company size and booking volume
          </p>
        </div>
        <div className="space-y-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">SME Package</h3>
                  <p className="text-xs text-muted-foreground">
                    20-100 employees
                  </p>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  5% discount
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Mid-Market Package</h3>
                  <p className="text-xs text-muted-foreground">
                    100-500 employees
                  </p>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  10% discount
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Enterprise Package</h3>
                  <p className="text-xs text-muted-foreground">
                    500+ employees
                  </p>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  Custom rates
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats */}
      <Card className="mb-6 border-none bg-blue-600 text-white shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-4 text-center text-base font-semibold">
            Corporate Clients
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">50+</p>
              <p className="mt-1 text-xs opacity-90">Active Companies</p>
            </div>
            <div>
              <p className="text-2xl font-bold">2,000+</p>
              <p className="mt-1 text-xs opacity-90">Employees</p>
            </div>
            <div>
              <p className="text-2xl font-bold">30%</p>
              <p className="mt-1 text-xs opacity-90">Avg Cost Savings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-3 text-base font-semibold">
            Interested for Your Company?
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Corporate Account Manager:</strong>
              <br />
              Phone/WhatsApp: +62 812 3456 7890
              <br />
              Email: corporate@aerotravel.co.id
            </p>
            <p>
              <strong>Setup Process:</strong>
              <br />
              Submit application → Credit assessment (3-5 days) → Account setup
              → Admin training → Go live!
            </p>
            <p>
              <strong>Requirements:</strong>
              <br />
              - Min 20 employees
              <br />
              - Valid company documents (NPWP, SIUP)
              <br />- Initial deposit (negotiable based on size)
            </p>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
