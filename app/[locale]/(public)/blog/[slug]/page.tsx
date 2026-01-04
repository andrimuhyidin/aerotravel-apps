/**
 * Blog Article Detail Page
 * Displays full article content
 * 
 * Route: /[locale]/blog/[slug]
 */

import { Calendar, ChevronLeft, Clock, User } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArticleCard } from '@/components/blog/article-card';
import { ArticleContent } from '@/components/blog/article-content';
import { ArticleViewTracker } from '@/components/blog/article-view-tracker';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { AuthorByline } from '@/components/seo/author-bio';
import { InternalLinks } from '@/components/seo/internal-links';
import { JsonLd } from '@/components/seo/json-ld';
import { locales } from '@/i18n';
import { getArticleBySlug, getRelatedArticles } from '@/lib/blog/articles';
import { getCategoryBySlug } from '@/lib/blog/categories';
import { generateArticleSpeakable } from '@/lib/seo/speakable-schema';
import {
  generateArticleSchema,
  generateAuthorSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo/structured-data';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale, slug: 'placeholder' }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  const article = await getArticleBySlug(slug);
  if (!article) {
    return { title: 'Article Not Found' };
  }

  return {
    title: `${article.title} | Blog Aero Travel`,
    description: article.excerpt,
    alternates: {
      canonical: `${baseUrl}/${locale}/blog/${slug}`,
      languages: {
        id: `${baseUrl}/id/blog/${slug}`,
        en: `${baseUrl}/en/blog/${slug}`,
        'x-default': `${baseUrl}/id/blog/${slug}`,
      },
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `${baseUrl}/${locale}/blog/${slug}`,
      siteName: 'MyAeroTravel',
      images: [{ url: article.featuredImage, width: 1200, height: 630 }],
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author.name],
      tags: article.tags,
    },
    keywords: article.tags.join(', '),
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = await getArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  const category = getCategoryBySlug(article.category);
  const relatedArticles = await getRelatedArticles(slug, 3);

  // Structured data
  const articleSchema = generateArticleSchema({
    headline: article.title,
    description: article.excerpt,
    author: {
      name: article.author.name,
      jobTitle: 'Travel Writer',
      url: article.author.avatar,
    },
    datePublished: article.publishedAt,
    image: article.featuredImage,
    url: `/${locale}/blog/${slug}`,
    keywords: article.tags,
  });

  const authorSchema = generateAuthorSchema({
    name: article.author.name,
    jobTitle: 'Travel Writer',
    description: article.author.bio,
    image: article.author.avatar,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: article.title, url: `/blog/${slug}` },
  ]);

  const speakableSchema = generateArticleSpeakable({
    title: article.title,
    excerpt: article.excerpt,
    slug: slug,
    locale,
  });

  return (
    <>
      <JsonLd data={[articleSchema, authorSchema, breadcrumbSchema, speakableSchema]} />
      <ArticleViewTracker articleId={article.id} />

      <Section>
        <Container className="max-w-4xl">
          {/* Back Button */}
          <Link
            href={`/${locale}/blog`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Kembali ke Blog
          </Link>

          {/* Article Header */}
          <article>
            {/* Category Badge */}
            {category && (
              <div className="mb-4">
                <Link
                  href={`/${locale}/blog?category=${category.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  <span>{category.emoji}</span>
                  {category.name}
                </Link>
              </div>
            )}

            {/* Title */}
            <h1 className="article-headline mb-4 text-3xl font-bold leading-tight md:text-4xl">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{article.author.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{article.readTime} menit baca</span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20">
              <div className="flex aspect-[16/9] items-center justify-center text-8xl">
                {category?.emoji || '📝'}
              </div>
            </div>

            {/* Content */}
            <ArticleContent content={article.content} className="mb-8" />

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="mb-8 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author Bio */}
            <div className="border-t pt-6">
              <AuthorByline
                name={article.author.name}
                role="Travel Writer"
                image={article.author.avatar}
              />
              {article.author.bio && (
                <p className="mt-2 text-sm text-muted-foreground">{article.author.bio}</p>
              )}
            </div>
          </article>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-12 border-t pt-8">
              <h2 className="mb-6 text-2xl font-bold">Artikel Terkait</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {relatedArticles.map((related) => (
                  <ArticleCard
                    key={related.id}
                    article={related}
                    locale={locale}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Internal Links */}
          <div className="mt-12 border-t pt-8">
            <InternalLinks
              currentPage={`/blog/${slug}`}
              type="related"
              category={article.category}
              locale={locale}
            />
          </div>
        </Container>
      </Section>
    </>
  );
}

