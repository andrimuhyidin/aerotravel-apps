/**
 * Guide About Page
 * Route: /[locale]/guide/about
 */

import { Award, Heart, TrendingUp, Users } from 'lucide-react';
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
    title: 'Tentang Guide App - Aero Travel',
    description: 'Informasi tentang Guide App dan komunitas guide Aero Travel',
  };
}

export default async function GuideAboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description:
        'Jenjang karir jelas dari Junior Guide hingga Senior Coordinator',
    },
    {
      icon: Award,
      title: 'Rewards & Bonuses',
      description:
        'Program reward points, challenges monthly, dan trip bonuses',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Bergabung dengan komunitas guide profesional se-Indonesia',
    },
    {
      icon: Heart,
      title: 'Training & Support',
      description: 'Training mandatory gratis dan continuous skill development',
    },
  ];

  const careerPath = [
    {
      level: 'Junior Guide',
      requirements: 'Sertifikasi basic, 0-10 trips',
      benefits: 'Training intensive, mentorship program',
    },
    {
      level: 'Senior Guide',
      requirements: '50+ trips, rating 4.5+, sertifikasi advanced',
      benefits: 'Trip priority, higher rates, leadership roles',
    },
    {
      level: 'Lead Guide',
      requirements: '100+ trips, rating 4.7+, trainer certified',
      benefits: 'Multi-trip coordination, training facilitator',
    },
    {
      level: 'Guide Coordinator',
      requirements: '200+ trips, proven leadership, ops experience',
      benefits: 'Team management, ops planning, strategic role',
    },
  ];

  return (
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 text-6xl">🏝️</div>
        <h1 className="mb-2 text-2xl font-bold">Tentang Guide App</h1>
        <p className="text-sm text-muted-foreground">
          Your Partner in Marine Tourism Excellence
        </p>
      </div>

      {/* Intro */}
      <Card className="mb-6 border-none shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-3 text-base font-semibold">Kami Siapa?</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Guide App adalah platform digital yang dirancang khusus untuk para
              guide profesional Aero Travel. Kami percaya bahwa guide adalah
              jantung dari setiap trip, dan kami berkomitmen untuk memberikan
              tools dan support terbaik agar Anda dapat fokus pada apa yang
              paling penting: memberikan pengalaman tak terlupakan bagi setiap
              traveler.
            </p>
            <p>
              Dengan Guide App, Anda dapat mengelola trip assignment,
              attendance, manifest, earnings, dan career development dalam satu
              platform yang mudah digunakan. Kami terus berinovasi untuk membuat
              pekerjaan guide lebih efisien dan rewarding.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="mb-6">
        <div className="mb-4 text-center">
          <h2 className="mb-2 text-base font-semibold">Kenapa Bergabung?</h2>
          <p className="text-sm text-muted-foreground">
            Benefits yang Anda dapatkan sebagai guide Aero Travel
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-none shadow-sm">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                  <benefit.icon className="h-5 w-5 text-emerald-600" />
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

      {/* Career Path */}
      <div className="mb-6">
        <div className="mb-4 text-center">
          <h2 className="mb-2 text-base font-semibold">Jenjang Karir</h2>
          <p className="text-sm text-muted-foreground">
            Jalur karir yang jelas untuk pengembangan profesional
          </p>
        </div>
        <div className="space-y-3">
          {careerPath.map((path, index) => (
            <Card key={index} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-emerald-600">
                    {path.level}
                  </h3>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium">
                    Level {index + 1}
                  </span>
                </div>
                <p className="mb-1 text-xs text-muted-foreground">
                  <strong>Requirements:</strong> {path.requirements}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Benefits:</strong> {path.benefits}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Community Stats */}
      <Card className="mb-6 border-none bg-emerald-600 text-white shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-4 text-center text-base font-semibold">
            Komunitas Guide Aero Travel
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">150+</p>
              <p className="mt-1 text-xs opacity-90">Active Guides</p>
            </div>
            <div>
              <p className="text-2xl font-bold">5,000+</p>
              <p className="mt-1 text-xs opacity-90">Trips/Year</p>
            </div>
            <div>
              <p className="text-2xl font-bold">4.8</p>
              <p className="mt-1 text-xs opacity-90">Avg Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-3 text-base font-semibold">Support Channels</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Guide Coordinator:</strong>
              <br />
              Phone/WhatsApp: +62 812 3456 7890
              <br />
              Email: guide-support@aerotravel.co.id
            </p>
            <p>
              <strong>In-App Chat:</strong>
              <br />
              Available 24/7 untuk emergency support
            </p>
            <p>
              <strong>Feedback & Suggestions:</strong>
              <br />
              Kami selalu terbuka untuk feedback. Kirim via form feedback di app
              atau email.
            </p>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
