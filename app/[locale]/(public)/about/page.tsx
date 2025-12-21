/**
 * About Us Page
 * Route: /[locale]/about
 */

import { Award, Heart, Shield, Target, Users } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Card, CardContent } from '@/components/ui/card';
import { locales } from '@/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Tentang Kami - Aero Travel',
    description:
      'Aero Travel adalah travel agency terpercaya yang menyediakan paket wisata bahari terbaik di Indonesia.',
    alternates: {
      canonical: `${baseUrl}/${locale}/about`,
    },
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const values = [
    {
      icon: Shield,
      title: 'Keamanan',
      description:
        'Standar keselamatan tinggi dengan asuransi dan prosedur darurat.',
    },
    {
      icon: Heart,
      title: 'Pelayanan',
      description: 'Tim profesional yang siap melayani dengan sepenuh hati.',
    },
    {
      icon: Award,
      title: 'Kualitas',
      description: 'Pengalaman wisata premium dengan harga yang kompetitif.',
    },
    {
      icon: Users,
      title: 'Komunitas',
      description:
        'Membangun komunitas traveler yang saling berbagi pengalaman.',
    },
  ];

  const stats = [
    { value: '5+', label: 'Tahun Pengalaman' },
    { value: '500+', label: 'Trip Sukses' },
    { value: '10K+', label: 'Traveler Puas' },
    { value: '4.9', label: 'Rating Rata-rata' },
  ];

  return (
    <>
      {/* Hero */}
      <Section className="bg-gradient-to-br from-primary/5 via-background to-aero-teal/5">
        <Container>
          <div className="py-8 sm:py-12 md:py-16 text-center">
            <h1 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-bold">Tentang Aero Travel</h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
              Mitra perjalanan terpercaya untuk menjelajahi keindahan laut
              Indonesia
            </p>
          </div>
        </Container>
      </Section>

      {/* Story */}
      <Section>
        <Container>
          <div className="grid gap-8 sm:gap-12 py-8 sm:py-12 md:grid-cols-2 md:items-center">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Cerita Kami</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Aero Travel didirikan dengan satu visi: memberikan pengalaman
                wisata bahari terbaik dengan standar keselamatan tinggi. Berawal
                dari kecintaan terhadap keindahan laut Indonesia, kami
                berkomitmen untuk membawa setiap traveler menikmati surga bawah
                laut yang memukau.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
                Dengan tim profesional dan guide berpengalaman, kami telah
                melayani ribuan traveler dari berbagai daerah. Setiap perjalanan
                adalah kesempatan bagi kami untuk berbagi keajaiban alam
                Indonesia.
              </p>
            </div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-aero-teal/20">
              <div className="flex h-full items-center justify-center text-8xl">
                🌊
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Stats */}
      <Section className="bg-primary text-primary-foreground">
        <Container>
          <div className="grid grid-cols-2 gap-4 sm:gap-8 py-8 sm:py-12 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{stat.value}</p>
                <p className="mt-2 text-xs sm:text-sm opacity-90">{stat.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section>
        <Container>
          <div className="py-8 sm:py-12 md:py-16">
            <div className="mb-8 sm:mb-12 text-center">
              <h2 className="mb-4 text-xl sm:text-2xl md:text-3xl font-bold">Nilai-nilai Kami</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Prinsip yang menjadi landasan setiap layanan kami
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => (
                <Card key={index} className="border-none shadow-md">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <value.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="mb-2 font-semibold">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Vision Mission */}
      <Section className="bg-muted/30">
        <Container>
          <div className="grid gap-6 sm:gap-8 py-8 sm:py-12 md:grid-cols-2">
            <Card className="border-none shadow-md">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-4 text-lg sm:text-xl font-bold">Visi</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Menjadi travel agency marine tourism terdepan di Indonesia
                  yang mengutamakan keamanan, kenyamanan, dan pengalaman tak
                  terlupakan bagi setiap traveler.
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-4 text-lg sm:text-xl font-bold">Misi</h3>
                <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                  <li>
                    • Menyediakan paket wisata berkualitas dengan harga
                    terjangkau
                  </li>
                  <li>• Menerapkan standar keselamatan tertinggi</li>
                  <li>• Memberdayakan masyarakat lokal sebagai mitra</li>
                  <li>• Menjaga kelestarian lingkungan bahari</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
