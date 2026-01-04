/**
 * Blog Listing Page
 * Displays all published blog articles
 * 
 * Route: /[locale]/blog
 */

// Force dynamic rendering - uses cookies for Supabase
export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { ArticleCard } from '@/components/blog/article-card';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { JsonLd } from '@/components/seo/json-ld';
import { locales } from '@/i18n';
import { getAllArticles } from '@/lib/blog/articles';
import { getAllCategories } from '@/lib/blog/categories';

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; page?: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Blog - Tips & Panduan Wisata | Aero Travel',
    description:
      'Baca tips perjalanan, panduan destinasi, dan cerita wisata terbaru dari Aero Travel. Informasi lengkap untuk liburan Anda.',
    alternates: {
      canonical: `${baseUrl}/${locale}/blog`,
      languages: {
        id: `${baseUrl}/id/blog`,
        en: `${baseUrl}/en/blog`,
        'x-default': `${baseUrl}/id/blog`,
      },
    },
    openGraph: {
      title: 'Blog - Tips & Panduan Wisata',
      description: 'Tips perjalanan dan panduan destinasi wisata terbaru',
      url: `${baseUrl}/${locale}/blog`,
      siteName: 'MyAeroTravel',
      images: [{ url: `${baseUrl}/og-blog.jpg`, width: 1200, height: 630 }],
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
    },
  };
}

export default async function BlogPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { category } = await searchParams;
  setRequestLocale(locale);

  const categories = getAllCategories();
  const { articles, total } = await getAllArticles({ category });

  // ItemList schema for SEO
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Blog Articles',
    numberOfItems: total,
    itemListElement: articles.map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/blog/${article.slug}`,
    })),
  };

  return (
    <>
      <JsonLd data={itemListSchema} />
      
      <Section className="bg-slate-50 dark:bg-slate-950">
        <Container>
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-3xl font-bold">📝 Blog & Tips</h1>
            <p className="text-muted-foreground">
              Panduan perjalanan dan tips wisata terbaru
            </p>
          </div>

          {/* Category Filter */}
          <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-2">
            <Link
              href={`/${locale}/blog`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                !category
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-muted-foreground hover:bg-muted dark:bg-slate-800'
              }`}
            >
              Semua
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${locale}/blog?category=${cat.slug}`}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  category === cat.slug
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-muted-foreground hover:bg-muted dark:bg-slate-800'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Articles Grid */}
          {articles.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                Belum ada artikel di kategori ini
              </p>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} locale={locale} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}

