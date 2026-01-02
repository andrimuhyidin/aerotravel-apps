/**
 * Article Card Component
 * Displays article preview in listing pages
 */

import { Calendar, Clock, User } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import type { BlogArticle } from '@/lib/blog/articles';
import { getCategoryBySlug } from '@/lib/blog/categories';

type ArticleCardProps = {
  article: BlogArticle;
  locale: string;
};

export function ArticleCard({ article, locale }: ArticleCardProps) {
  const category = getCategoryBySlug(article.category);

  return (
    <Link
      href={`/${locale}/blog/${article.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-lg dark:bg-slate-800"
    >
      {/* Featured Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/20 to-blue-500/20">
        <div className="flex h-full items-center justify-center text-6xl">
          {category?.emoji || '📝'}
        </div>
        {/* Category Badge */}
        {category && (
          <div className="absolute left-3 top-3">
            <Badge variant="secondary" className="bg-white/95 backdrop-blur">
              {category.emoji} {category.name}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
          {article.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{article.author.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{article.readTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

