/**
 * About Us Page
 * Route: /[locale]/about
 */

import { Award, Shield, Target } from 'lucide-react';
import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { AISummary } from '@/components/seo/ai-summary';
import { AuthorCard } from '@/components/seo/author-bio';
import { JsonLd } from '@/components/seo/json-ld';
import { TrustSignals } from '@/components/seo/trust-signals';
import { Card, CardContent } from '@/components/ui/card';
import { locales } from '@/i18n';
import { getAboutContent } from '@/lib/cms/about';
import { getAllAuthors } from '@/lib/seo/authors';
import { generateAuthorSchema, generateAboutPageSchema } from '@/lib/seo/structured-data';
import * as LucideIcons from 'lucide-react';

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

  // Fetch about content from database
  const aboutContent = await getAboutContent();

  // Map icon names to Lucide icons
  const getIcon = (iconName: string | null) => {
    if (!iconName) return Shield;
    const IconComponent = (LucideIcons as Record<string, any>)[iconName];
    return IconComponent || Shield;
  };

  // Transform values with icons
  const values = aboutContent.values.map((value) => ({
    icon: getIcon(value.icon_name),
    title: value.title,
    description: value.description || '',
  }));

  // Transform stats
  const stats = aboutContent.stats.map((stat) => ({
    value: stat.value,
    label: stat.label,
  }));

  // Transform awards
  const awards = aboutContent.awards.map((award) => award.name);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  // Get team authors for schema
  const teamAuthors = getAllAuthors();

  // AboutPage structured data
  const aboutPageSchema = generateAboutPageSchema({
    name: 'Tentang Aero Travel',
    description:
      'Aero Travel adalah travel agency terpercaya yang menyediakan paket wisata bahari terbaik di Indonesia.',
    url: `/${locale}/about`,
    foundingDate: aboutContent.founding_date,
    founders: teamAuthors[0] ? [teamAuthors[0]] : [],
    awards: awards.length > 0 ? awards : ['Member ASITA', 'Registered Travel Agency'],
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
            {aboutContent.story.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
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
              {aboutContent.vision}
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
              {aboutContent.mission.split('\n').map((line, index) => (
                <li key={index}>• {line.trim()}</li>
              ))}
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
