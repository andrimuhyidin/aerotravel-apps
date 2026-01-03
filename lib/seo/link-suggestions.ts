/**
 * Link Suggestions Utility
 * AI-powered or rule-based link suggestions for internal linking
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { getAllArticles } from '@/lib/blog/articles';
import { getAllDestinations, getDestinationBySlug } from '@/lib/destinations/data';
import { logger } from '@/lib/utils/logger';

type LinkSuggestion = {
  title: string;
  href: string;
  relevance: number; // 0-1
  type: 'package' | 'destination' | 'article';
  description?: string;
};

/**
 * Get link suggestions based on content
 * Uses multi-signal approach: tag-based matching, destination matching, and popularity
 */
export async function getLinkSuggestions(options: {
  currentPage: string;
  content?: string;
  keywords?: string[];
  category?: string;
  type?: 'package' | 'destination' | 'article';
  limit?: number;
}): Promise<LinkSuggestion[]> {
  const {
    currentPage,
    content,
    keywords = [],
    category,
    type,
    limit = 4,
  } = options;

  try {
    const suggestions: LinkSuggestion[] = [];

    // Extract keywords from content if provided
    const extractedKeywords = content
      ? extractKeywords(content)
      : keywords.length > 0
        ? keywords
        : [];

    // All keywords (extracted + provided)
    const allKeywords = Array.from(
      new Set([...extractedKeywords, ...keywords])
    );

    // 1. Tag-based matching (30% weight) - Match destinations and articles by tags
    if (allKeywords.length > 0) {
      // Get destinations and match by keywords
      const destinations = await getAllDestinations();
      destinations.forEach((dest) => {
        const keywordMatch = allKeywords.filter((kw) =>
          dest.name.toLowerCase().includes(kw.toLowerCase()) ||
          dest.highlights.some((h) =>
            h.toLowerCase().includes(kw.toLowerCase())
          )
        ).length;

        if (keywordMatch > 0) {
          suggestions.push({
            title: dest.name,
            href: `/destinations/${dest.slug}`,
            relevance: Math.min(0.9, 0.3 * keywordMatch), // Max 0.9 for tag match
            type: 'destination',
            description: dest.description,
          });
        }
      });

      // Get articles and match by category/tags
      const { articles } = await getAllArticles({ limit: 20 });
      articles.forEach((article) => {
        const tagMatch = allKeywords.filter((kw) =>
          article.tags.some((tag) =>
            tag.toLowerCase().includes(kw.toLowerCase())
          ) || article.category.includes(kw.toLowerCase())
        ).length;

        if (tagMatch > 0 && !currentPage.includes(`/blog/${article.slug}`)) {
          suggestions.push({
            title: article.title,
            href: `/blog/${article.slug}`,
            relevance: Math.min(0.85, 0.3 * tagMatch),
            type: 'article',
            description: article.excerpt,
          });
        }
      });
    }

    // 2. Destination-based matching (25% weight) - Link packages to destinations
    if (allKeywords.length > 0) {
      const supabase = await createClient();
      
      // Find matching destinations
      const matchingDestinations = destinations.filter((dest) =>
        allKeywords.some((kw) =>
          dest.name.toLowerCase().includes(kw.toLowerCase())
        )
      );

      // Get packages for matching destinations
      const packagePromises = matchingDestinations.map(async (dest) => {
        const { data: packages } = await supabase
          .from('packages')
          .select('id, name, slug, short_description')
          .eq('destination', dest.name)
          .eq('status', 'published')
          .is('deleted_at', null)
          .limit(2);

        return packages || [];
      });

      const allPackages = (await Promise.all(packagePromises)).flat();
      allPackages.forEach((pkg) => {
        if (!currentPage.includes(`/packages/${pkg.slug}`)) {
          suggestions.push({
            title: pkg.name,
            href: `/packages/${pkg.slug}`,
            relevance: 0.25,
            type: 'package',
            description: pkg.short_description || undefined,
          });
        }
      });
    }

    // 3. Category-based matching (20% weight)
    if (category) {
      if (category.includes('destination') || type === 'destination') {
        suggestions.push({
          title: 'Semua Destinasi',
          href: '/destinations',
          relevance: 0.2,
          type: 'destination',
        });
      }
      if (category.includes('package') || type === 'package') {
        suggestions.push({
          title: 'Paket Wisata Lainnya',
          href: '/packages',
          relevance: 0.2,
          type: 'package',
        });
      }
      if (category.includes('article') || type === 'article') {
        suggestions.push({
          title: 'Artikel Terkait',
          href: '/blog',
          relevance: 0.2,
          type: 'article',
        });
      }
    }

    // 4. Popularity boost (10% weight) - Boost popular articles/destinations
    const popularArticles = await getAllArticles({ limit: 3 }).then(
      (result) => result.articles
    );
    popularArticles
      .filter((a) => a.views && a.views > 500)
      .forEach((article) => {
        if (!currentPage.includes(`/blog/${article.slug}`)) {
          const existing = suggestions.find(
            (s) => s.href === `/blog/${article.slug}`
          );
          if (existing) {
            existing.relevance += 0.1; // Boost existing
          } else {
            suggestions.push({
              title: article.title,
              href: `/blog/${article.slug}`,
              relevance: 0.1,
              type: 'article',
              description: article.excerpt,
            });
          }
        }
      });

    // TODO: 5. Embedding similarity (35% weight) - Requires AI infrastructure
    // - Generate embeddings for current content
    // - Search similar content using pgvector
    // - This requires:
    //   a. Content embeddings table
    //   b. Embedding generation (OpenAI/Gemini)
    //   c. Vector similarity search
    //   See: lib/seo/embeddings.ts (to be created)

    // Filter out current page and deduplicate
    const filtered = suggestions.filter(
      (s) => !currentPage.includes(s.href)
    );
    const unique = Array.from(
      new Map(filtered.map((s) => [s.href, s])).values()
    );

    // Sort by relevance and limit
    return unique
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  } catch (error) {
    logger.error('Error generating link suggestions', error);
    // Fallback to simple rule-based matching
    return getFallbackSuggestions(options);
  }
}

/**
 * Fallback suggestions (simple rule-based)
 */
function getFallbackSuggestions(options: {
  currentPage: string;
  keywords?: string[];
  category?: string;
  limit?: number;
}): LinkSuggestion[] {
  const { keywords = [], category, limit = 4 } = options;
  const suggestions: LinkSuggestion[] = [];

  const destinationKeywords = [
    'pahawang',
    'kiluan',
    'labuan bajo',
    'raja ampat',
    'karimunjawa',
    'tanjung lesung',
  ];
  destinationKeywords.forEach((dest) => {
    if (keywords.some((k) => k.toLowerCase().includes(dest))) {
      suggestions.push({
        title: `Destinasi ${dest.charAt(0).toUpperCase() + dest.slice(1)}`,
        href: `/destinations/${dest.toLowerCase().replace(/\s+/g, '-')}`,
        relevance: 0.8,
        type: 'destination',
      });
    }
  });

  if (category) {
    if (category.includes('destination')) {
      suggestions.push({
        title: 'Semua Destinasi',
        href: '/destinations',
        relevance: 0.6,
        type: 'destination',
      });
    }
    if (category.includes('package')) {
      suggestions.push({
        title: 'Paket Wisata Lainnya',
        href: '/packages',
        relevance: 0.6,
        type: 'package',
      });
    }
  }

  return suggestions
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string): string[] {
  // Simple keyword extraction
  // TODO: Implement better NLP-based keyword extraction
  const words = text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);

  // Remove common words
  const stopWords = [
    'yang',
    'untuk',
    'dengan',
    'dari',
    'ini',
    'itu',
    'adalah',
    'akan',
    'atau',
    'juga',
    'dapat',
    'pada',
    'sebagai',
  ];

  const keywords = words.filter((w) => !stopWords.includes(w));

  // Return unique keywords
  return Array.from(new Set(keywords)).slice(0, 10);
}

