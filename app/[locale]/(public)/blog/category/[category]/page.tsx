/**
 * Blog Category Listing Page
 * Displays articles filtered by category
 * 
 * Route: /[locale]/blog/category/[category]
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArticleCard } from '@/components/blog/article-card';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { JsonLd } from '@/components/seo/json-ld';
import { Badge } from '@/components/ui/badge';
import { locales } from '@/i18n';
import { getAllArticles } from '@/lib/blog/articles';
import { getCategoryBySlug, getAllCategories } from '@/lib/blog/categories';
import { generateItemListSchema } from '@/lib/seo/structured-data';

type PageProps = {
  params: Promise<{ locale: string; category: string }>;
};

export function generateStaticParams() {
  const categories = getAllCategories();
  return locales.flatMap((locale) =>
    categories.map((cat) => ({ locale, category: cat.slug }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, category } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  const categoryData = getCategoryBySlug(category);
  if (!categoryData) {
    return { title: 'Category Not Found' };
  }

  return {
    title: `${categoryData.name} - Blog Aero Travel`,
    description: categoryData.description,
    alternates: {
      canonical: `${baseUrl}/${locale}/blog/category/${category}`,
      languages: {
        id: `${baseUrl}/id/blog/category/${category}`,
        en: `${baseUrl}/en/blog/category/${category}`,
        'x-default': `${baseUrl}/id/blog/category/${category}`,
      },
    },
    openGraph: {
      title: `${categoryData.name} - Blog Aero Travel`,
      description: categoryData.description,
      url: `${baseUrl}/${locale}/blog/category/${category}`,
      siteName: 'MyAeroTravel',
      images: [{ url: `${baseUrl}/og-blog-category.jpg`, width: 1200, height: 630 }],
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
    },
  };
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  const categoryData = getCategoryBySlug(category);
  if (!categoryData) {
    notFound();
  }

  const { articles, total } = await getAllArticles({ category, limit: 20 });

  // ItemList schema for SEO
  const itemListSchema = generateItemListSchema(
    articles.map((article, index) => ({
      position: index + 1,
      item: {
        '@type': 'Article',
        name: article.title,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/blog/${article.slug}`,
      },
    }))
  );

  return (
    <>
      <JsonLd data={itemListSchema} />

      <Section className="bg-slate-50 dark:bg-slate-950">
        <Container>
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/${locale}/blog`}
              className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Kembali ke Blog
            </Link>
            <div className="mb-4 flex items-center gap-3">
              <span className="text-4xl">{categoryData.emoji}</span>
              <div>
                <h1 className="text-3xl font-bold">{categoryData.name}</h1>
                <p className="text-muted-foreground">{categoryData.description}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {total} artikel
            </Badge>
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

          {/* View All Categories */}
          <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 p-8 text-center">
            <h2 className="mb-4 text-2xl font-bold">Jelajahi Kategori Lainnya</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {getAllCategories()
                .filter((cat) => cat.slug !== category)
                .map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${locale}/blog/category/${cat.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium transition-all hover:bg-primary hover:text-white dark:bg-slate-800"
                  >
                    <span>{cat.emoji}</span>
                    {cat.name}
                  </Link>
                ))}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

