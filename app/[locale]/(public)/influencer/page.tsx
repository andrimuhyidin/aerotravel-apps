/**
 * Influencer / KOL Program Landing
 * Public landing for Influencer Trip collaboration
 */

import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { Button } from '@/components/ui/button';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('common');

  return {
    title: `Influencer Trip Program - ${t('app_name')}`,
    description:
      'Program kolaborasi KOL & Influencer untuk Trip Eksklusif bersama Aero Travel.',
  };
}

export default async function InfluencerLandingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const benefits = [
    {
      title: 'Trip Eksklusif dengan Brand Kuat',
      description:
        'Bawa komunitas kamu ke pengalaman liburan premium dengan standar keselamatan tinggi.',
    },
    {
      title: 'Revenue Share yang Transparan',
      description:
        'Skema komisi jelas untuk setiap kursi terjual & opsi fee flat per campaign.',
    },
    {
      title: 'Support Operasional Penuh',
      description:
        'Tim Aero meng-handle operasional end-to-end, kamu fokus ke konten & komunitas.',
    },
  ];

  const requirements = [
    'Minimal 10.000 followers aktif di salah satu platform (Instagram, TikTok, YouTube).',
    'Konten relevan dengan travel, lifestyle, atau outdoor.',
    'Memiliki engagement rate yang sehat dan audience real.',
    'Bersedia mengikuti SOP keselamatan dan standar layanan Aero Travel.',
  ];

  return (
    <div className="flex min-h-[100vh] flex-col bg-background">
      <main className="flex-1 pb-24">
        {/* Hero Section */}
        <Section className="bg-gradient-to-br from-primary/10 via-primary/5 to-teal-50" spacing="lg">
          <Container>
            <div className="text-center">
              <h1 className="mb-3 text-2xl sm:text-3xl font-bold text-foreground">
                Influencer Trip Program
              </h1>
              <p className="mb-5 text-sm sm:text-base text-muted-foreground">
                Kolaborasi dengan Aero Travel untuk bikin trip eksklusif
                bareng komunitas kamu. Kami urus operasional, kamu fokus
                bangun pengalaman & konten.
              </p>
              <div className="flex flex-col gap-2">
              <Button asChild size="lg" className="w-full">
                <Link href={`/${locale}/influencer/apply`}>
                  Daftar sebagai KOL / Influencer
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 w-full justify-center text-xs text-muted-foreground"
              >
                <Link href={`/${locale}/packages`}>
                  Lihat contoh trip & paket yang tersedia
                </Link>
              </Button>
              </div>
            </div>
          </Container>
        </Section>

        {/* Benefits Section */}
        <Section spacing="lg">
          <Container>
            <div className="mb-4 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Untuk KOL & Influencer
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-foreground">
                Kenapa kolaborasi dengan Aero?
              </h2>
            </div>
            <div className="space-y-3">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-card-foreground">
                    {benefit.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* Requirements Section */}
        <Section spacing="lg">
          <Container>
            <div className="mb-4 text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Kriteria KOL / Influencer
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Beberapa hal dasar yang kami cari dari partner Influencer.
              </p>
            </div>
            <div className="space-y-2.5">
              {requirements.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-card p-3 text-sm text-card-foreground shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </Container>
        </Section>
      </main>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 z-20 border-t border-primary/20 bg-gradient-to-r from-primary to-primary/90 px-4 pb-4 pt-3">
        <Container>
          <div className="flex flex-col gap-2 text-center">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-primary-foreground">
              Siap bikin Influencer Trip pertama?
            </h2>
            <p className="text-xs text-primary-foreground/90">
              Daftar sebagai KOL sekarang, tim kami akan kurasi dan hubungi kamu.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary" className="w-full">
            <Link href={`/${locale}/influencer/apply`}>
              Daftar Program Influencer Trip
            </Link>
          </Button>
          </div>
        </Container>
      </div>
    </div>
  );
}


