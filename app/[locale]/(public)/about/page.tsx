/**
 * About Us Page
 * Route: /[locale]/about
 */

import { Award, Heart, Shield, Target, Users } from 'lucide-react';
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
  themeColor: '#000000',
};

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
    <Container className="py-6">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-4xl">
          🌊
        </div>
        <h1 className="mb-2 text-2xl font-bold">Tentang Aero Travel</h1>
        <p className="text-sm text-muted-foreground">
          Mitra perjalanan terpercaya untuk menjelajahi keindahan laut Indonesia
        </p>
      </div>

      {/* Story */}
      <Card className="mb-6 border-none shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-3 text-base font-semibold">Cerita Kami</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Aero Travel didirikan dengan satu visi: memberikan pengalaman
              wisata bahari terbaik dengan standar keselamatan tinggi. Berawal
              dari kecintaan terhadap keindahan laut Indonesia, kami berkomitmen
              untuk membawa setiap traveler menikmati surga bawah laut yang
              memukau.
            </p>
            <p>
              Dengan tim profesional dan guide berpengalaman, kami telah
              melayani ribuan traveler dari berbagai daerah. Setiap perjalanan
              adalah kesempatan bagi kami untuk berbagi keajaiban alam
              Indonesia.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="mb-6 border-none bg-primary text-primary-foreground shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs opacity-90">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Values */}
      <div className="mb-6">
        <div className="mb-4 text-center">
          <h2 className="mb-2 text-base font-semibold">Nilai-nilai Kami</h2>
          <p className="text-sm text-muted-foreground">
            Prinsip yang menjadi landasan setiap layanan kami
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {values.map((value, index) => (
            <Card key={index} className="border-none shadow-sm">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <value.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-sm font-semibold">{value.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {value.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Vision Mission */}
      <div className="space-y-3">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-3 text-base font-semibold">Visi</h3>
            <p className="text-sm text-muted-foreground">
              Menjadi travel agency marine tourism terdepan di Indonesia yang
              mengutamakan keamanan, kenyamanan, dan pengalaman tak terlupakan
              bagi setiap traveler.
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-3 text-base font-semibold">Misi</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                • Menyediakan paket wisata berkualitas dengan harga terjangkau
              </li>
              <li>• Menerapkan standar keselamatan tertinggi</li>
              <li>• Memberdayakan masyarakat lokal sebagai mitra</li>
              <li>• Menjaga kelestarian lingkungan bahari</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
