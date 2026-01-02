/**
 * About Us Page
 * Route: /[locale]/about
 */

import { Award, Heart, Shield, Target, Users } from 'lucide-react';
import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { AISummary } from '@/components/seo/ai-summary';
import { AuthorCard } from '@/components/seo/author-bio';
import { JsonLd } from '@/components/seo/json-ld';
import { TrustSignals } from '@/components/seo/trust-signals';
import { Card, CardContent } from '@/components/ui/card';
import { locales } from '@/i18n';
import { getAllAuthors } from '@/lib/seo/authors';
import { generateAuthorSchema, generateAboutPageSchema } from '@/lib/seo/structured-data';

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

  const title = 'Tentang Kami - Aero Travel';
  const description =
    'Aero Travel adalah travel agency terpercaya yang menyediakan paket wisata bahari terbaik di Indonesia.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/about`,
      languages: {
        id: `${baseUrl}/id/about`,
        en: `${baseUrl}/en/about`,
        'x-default': `${baseUrl}/id/about`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/about`,
      siteName: 'MyAeroTravel ID',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.jpg`],
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  // Get team authors for schema
  const teamAuthors = getAllAuthors();

  // AboutPage structured data
  const aboutPageSchema = generateAboutPageSchema({
    name: 'Tentang Aero Travel',
    description:
      'Aero Travel adalah travel agency terpercaya yang menyediakan paket wisata bahari terbaik di Indonesia.',
    url: `/${locale}/about`,
    foundingDate: '2019-01-01',
    founders: [teamAuthors[0]], // Founder
    awards: ['Member ASITA', 'Registered Travel Agency'],
  });

  // Generate author schemas for team members
  const teamSchemas = teamAuthors.map((author) =>
    generateAuthorSchema({
      name: author.name,
      jobTitle: author.jobTitle,
      description: author.description,
      image: author.image,
      url: author.url,
      sameAs: author.sameAs,
      worksFor: author.worksFor,
    })
  );

  // AI Summary for the about page
  const aboutSummary =
    'MyAeroTravel adalah travel agency terpercaya di Indonesia yang menyediakan paket wisata bahari terbaik. Didirikan pada 2019, kami telah melayani lebih dari 10.000 traveler dengan rating rata-rata 4.9/5. Tim profesional kami berkomitmen pada keamanan, kualitas layanan, dan pengalaman wisata yang tak terlupakan.';

  const aboutKeyPoints = [
    '5+ tahun pengalaman di industri travel',
    '500+ trip sukses dijalankan',
    '10.000+ traveler puas',
    'Rating rata-rata 4.9/5',
    'Member ASITA resmi',
  ];

  return (
    <>
      <JsonLd data={aboutPageSchema} />
      {teamSchemas.map((schema, idx) => (
        <JsonLd key={idx} data={schema} />
      ))}
      <Container className="py-6">
        {/* AI Summary */}
        <div className="mb-6">
          <AISummary summary={aboutSummary} bulletPoints={aboutKeyPoints} />
        </div>

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

      {/* Trust Signals */}
      <div className="my-8">
        <h2 className="mb-4 text-center text-base font-semibold">
          Dipercaya oleh Ribuan Traveler
        </h2>
        <TrustSignals />
      </div>

      {/* Team Section */}
      <div className="mt-8">
        <div className="mb-4 text-center">
          <h2 className="mb-2 text-base font-semibold">Tim Kami</h2>
          <p className="text-sm text-muted-foreground">
            Profesional berpengalaman yang siap melayani Anda
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {teamAuthors.slice(0, 4).map((author) => (
            <AuthorCard
              key={author.id}
              name={author.name}
              role={author.role}
              image={author.image}
              bio={author.shortBio}
              linkedIn={author.sameAs?.[0]}
              verified={author.verified}
            />
          ))}
        </div>
      </div>
    </Container>
    </>
  );
}
