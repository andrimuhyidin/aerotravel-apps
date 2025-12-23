/**
 * Partner About Page
 * Route: /[locale]/partner/about
 */

import { Award, TrendingUp, Users, Zap } from 'lucide-react';
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
    title: 'Tentang Partnership - Aero Travel',
    description: 'Program kemitraan B2B Aero Travel',
  };
}

export default async function PartnerAboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Revenue Growth',
      description: 'Akses ke 10K+ active travelers dan marketing channel luas',
    },
    {
      icon: Zap,
      title: 'Fast Settlement',
      description: 'Settlement NET 15 atau NET 30 dengan payment guaranteed',
    },
    {
      icon: Award,
      title: 'Performance Bonus',
      description: 'Bonus untuk partner dengan rating tinggi dan volume besar',
    },
    {
      icon: Users,
      title: 'Dedicated Support',
      description: 'Partnership Manager khusus untuk assist operasional',
    },
  ];

  const partnerTiers = [
    {
      tier: 'Silver Partner',
      requirements: '< 50 bookings/month',
      commission: '15% commission',
      benefits: 'Dashboard access, Standard support',
    },
    {
      tier: 'Gold Partner',
      requirements: '50-100 bookings/month',
      commission: '18% commission',
      benefits: 'Priority listing, Analytics advanced, Dedicated manager',
    },
    {
      tier: 'Platinum Partner',
      requirements: '100-200 bookings/month',
      commission: '20% commission',
      benefits: 'Featured placement, White-label option, Custom rates',
    },
    {
      tier: 'Diamond Partner',
      requirements: '200+ bookings/month',
      commission: '25% commission',
      benefits: 'Full white-label, API integration, Strategic partnership',
    },
  ];

  return (
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 text-6xl">🤝</div>
        <h1 className="mb-2 text-2xl font-bold">Partnership Program</h1>
        <p className="text-sm text-muted-foreground">
          Grow Your Marine Tourism Business with Aero Travel
        </p>
      </div>

      {/* Intro */}
      <Card className="mb-6 border-none shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-3 text-base font-semibold">
            Kenapa Bermitra dengan Kami?
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Aero Travel Partner Portal adalah platform B2B yang menghubungkan
              penyedia paket wisata bahari dengan ribuan travelers aktif. Kami
              menyediakan technology, marketing, dan operational support untuk
              membantu partner scale bisnis mereka.
            </p>
            <p>
              Dengan Partner Portal, Anda dapat focus pada service quality
              sementara kami handle booking management, payment processing, dan
              customer acquisition. Join 100+ partners yang telah trusted Aero
              Travel.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="mb-6">
        <div className="mb-4 text-center">
          <h2 className="mb-2 text-base font-semibold">Partner Benefits</h2>
          <p className="text-sm text-muted-foreground">
            Keuntungan menjadi partner Aero Travel
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-none shadow-sm">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                  <benefit.icon className="h-5 w-5 text-orange-600" />
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

      {/* Partner Tiers */}
      <div className="mb-6">
        <div className="mb-4 text-center">
          <h2 className="mb-2 text-base font-semibold">Partner Tiers</h2>
          <p className="text-sm text-muted-foreground">
            Tingkatkan tier untuk benefits lebih baik
          </p>
        </div>
        <div className="space-y-3">
          {partnerTiers.map((tier, index) => (
            <Card key={index} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-orange-600">
                    {tier.tier}
                  </h3>
                  <span className="rounded-full bg-orange-500/10 px-2 py-1 text-xs font-medium">
                    {tier.commission}
                  </span>
                </div>
                <p className="mb-1 text-xs text-muted-foreground">
                  <strong>Requirements:</strong> {tier.requirements}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Benefits:</strong> {tier.benefits}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats */}
      <Card className="mb-6 border-none bg-orange-600 text-white shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-4 text-center text-base font-semibold">
            Partnership Network
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">100+</p>
              <p className="mt-1 text-xs opacity-90">Active Partners</p>
            </div>
            <div>
              <p className="text-2xl font-bold">10K+</p>
              <p className="mt-1 text-xs opacity-90">Monthly Travelers</p>
            </div>
            <div>
              <p className="text-2xl font-bold">4.6</p>
              <p className="mt-1 text-xs opacity-90">Avg Partner Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Stories */}
      <Card className="mb-6 border-none shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-3 text-base font-semibold">
            Partner Success Story
          </h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="mb-2 text-sm font-semibold">
                &quot;Revenue naik 300% dalam 6 bulan!&quot;
              </p>
              <p className="text-xs text-muted-foreground">
                &quot;Sejak join Aero Travel, booking kami meningkat drastis.
                Platform mudah digunakan, settlement cepat, dan support team
                sangat helpful. Highly recommended!&quot;
              </p>
              <p className="mt-2 text-xs font-medium">
                - PT. Marine Adventure, Gold Partner
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-3 text-base font-semibold">
            Interested to Partner?
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Partnership Manager:</strong>
              <br />
              Phone/WhatsApp: +62 812 3456 7890
              <br />
              Email: partner@aerotravel.co.id
            </p>
            <p>
              <strong>Application Process:</strong>
              <br />
              Submit partnership application → Verification (2-3 hari) →
              Onboarding training → Start selling!
            </p>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
