/**
 * Blog Articles Data Layer
 * Fetches and manages blog article data from database
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type BlogArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  publishedAt: string;
  readTime: number; // in minutes
  views?: number;
};

type BlogArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  category: string;
  tags: string[] | null;
  author_id: string | null;
  published_at: string | null;
  read_time: number | null;
  views: number | null;
  users: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

/**
 * Get all published articles
 * Public access - shows articles from all branches
 */
export async function getAllArticles(options?: {
  category?: string;
  limit?: number;
  offset?: number;
  branchId?: string | null; // Optional branch filter for admin
}): Promise<{ articles: BlogArticle[]; total: number }> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('blog_articles')
      .select(
        `
        id,
        slug,
        title,
        excerpt,
        content,
        featured_image,
        category,
        tags,
        author_id,
        published_at,
        read_time,
        views,
        users:author_id (
          full_name,
          avatar_url
        )
      `,
        { count: 'exact' }
      )
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('published_at', { ascending: false });

    // Filter by category
    if (options?.category) {
      query = query.eq('category', options.category);
    }

    // Optional branch filter (for admin)
    if (options?.branchId) {
      query = query.eq('branch_id', options.branchId);
    }

    // Pagination
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch blog articles', error);
      // Fallback to sample data
      return getFallbackArticles(options);
    }

    const articles: BlogArticle[] =
      data?.map(transformArticleRow) || getFallbackArticles(options).articles;

    return {
      articles,
      total: count || articles.length,
    };
  } catch (error) {
    logger.error('Error fetching blog articles', error);
    // Fallback to sample data
    return getFallbackArticles(options);
  }
}

/**
 * Get article by slug
 * Public access - can read from any branch
 */
export async function getArticleBySlug(
  slug: string,
  branchId?: string | null
): Promise<BlogArticle | null> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('blog_articles')
      .select(
        `
        id,
        slug,
        title,
        excerpt,
        content,
        featured_image,
        category,
        tags,
        author_id,
        published_at,
        read_time,
        views,
        users:author_id (
          full_name,
          avatar_url
        )
      `
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .is('deleted_at', null)
      .single();

    // Optional branch filter (for admin)
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error || !data) {
      logger.warn('Blog article not found in database', { slug, error });
      // Fallback to sample data
      return getFallbackArticles().articles.find((a) => a.slug === slug) || null;
    }

    return transformArticleRow(data as BlogArticleRow);
  } catch (error) {
    logger.error('Error fetching blog article by slug', error);
    // Fallback to sample data
    return getFallbackArticles().articles.find((a) => a.slug === slug) || null;
  }
}

/**
 * Get related articles
 * Uses tag-based similarity and category matching
 */
export async function getRelatedArticles(
  slug: string,
  limit: number = 3,
  branchId?: string | null
): Promise<BlogArticle[]> {
  try {
    const currentArticle = await getArticleBySlug(slug, branchId);
    if (!currentArticle) return [];

    const supabase = await createClient();

    // Find articles with overlapping tags or same category
    let query = supabase
      .from('blog_articles')
      .select(
        `
        id,
        slug,
        title,
        excerpt,
        content,
        featured_image,
        category,
        tags,
        author_id,
        published_at,
        read_time,
        views,
        users:author_id (
          full_name,
          avatar_url
        )
      `
      )
      .eq('status', 'published')
      .is('deleted_at', null)
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(limit * 2); // Get more to filter for best matches

    // Filter by same category first
    query = query.eq('category', currentArticle.category);

    // Optional branch filter
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // Fallback to any published articles from same category
      const { articles } = await getAllArticles({
        category: currentArticle.category,
        limit: limit * 2,
        branchId,
      });
      return articles.filter((a) => a.slug !== slug).slice(0, limit);
    }

    const articles = data.map(transformArticleRow);

    // Score articles by tag overlap
    const scored = articles.map((article) => {
      const tagOverlap = currentArticle.tags.filter((tag) =>
        article.tags.includes(tag)
      ).length;
      return { article, score: tagOverlap };
    });

    // Sort by score (tag overlap) and take top N
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((item) => item.article);
  } catch (error) {
    logger.error('Error fetching related articles', error);
    // Fallback
    const currentArticle = await getArticleBySlug(slug, branchId);
    if (!currentArticle) return [];
    const { articles } = await getAllArticles({
      category: currentArticle.category,
      limit,
      branchId,
    });
    return articles.filter((a) => a.slug !== slug).slice(0, limit);
  }
}

/**
 * Get popular articles
 * Sorted by views (highest first)
 */
export async function getPopularArticles(
  limit: number = 5,
  branchId?: string | null
): Promise<BlogArticle[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('blog_articles')
      .select(
        `
        id,
        slug,
        title,
        excerpt,
        content,
        featured_image,
        category,
        tags,
        author_id,
        published_at,
        read_time,
        views,
        users:author_id (
          full_name,
          avatar_url
        )
      `
      )
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('views', { ascending: false })
      .limit(limit);

    // Optional branch filter
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error || !data) {
      logger.error('Failed to fetch popular articles', error);
      // Fallback
      const { articles } = await getAllArticles({ limit, branchId });
      return articles.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    return data.map(transformArticleRow);
  } catch (error) {
    logger.error('Error fetching popular articles', error);
    const { articles } = await getAllArticles({ limit, branchId });
    return articles.sort((a, b) => (b.views || 0) - (a.views || 0));
  }
}

/**
 * Get recent articles
 * Sorted by published_at (newest first)
 */
export async function getRecentArticles(
  limit: number = 5,
  branchId?: string | null
): Promise<BlogArticle[]> {
  return getAllArticles({ limit, branchId }).then((result) => result.articles);
}

/**
 * Transform database row to BlogArticle type
 */
function transformArticleRow(row: BlogArticleRow): BlogArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || '',
    content: row.content || '',
    featuredImage: row.featured_image || '/images/blog/default.jpg',
    category: row.category,
    tags: row.tags || [],
    author: {
      id: row.author_id || 'unknown',
      name: row.users?.full_name || 'Unknown Author',
      avatar: row.users?.avatar_url || undefined,
    },
    publishedAt: row.published_at || new Date().toISOString(),
    readTime: row.read_time || 1,
    views: row.views || 0,
  };
}

/**
 * Fallback to sample data if database unavailable
 */
function getFallbackArticles(options?: {
  category?: string;
  limit?: number;
  offset?: number;
}): { articles: BlogArticle[]; total: number } {
  const allArticles = getSampleArticles();
  let filtered = allArticles;

  if (options?.category) {
    filtered = filtered.filter((a) => a.category === options.category);
  }

  const total = filtered.length;
  const offset = options?.offset || 0;
  const limit = options?.limit || 10;

  const articles = filtered.slice(offset, offset + limit);

  return { articles, total };
}

/**
 * Sample articles (fallback data)
 * Used when database is unavailable or as seed data
 */
function getSampleArticles(): BlogArticle[] {
  return [
    {
      id: '1',
      slug: 'tips-perjalanan-pahawang-pertama-kali',
      title: 'Tips Perjalanan ke Pahawang untuk Pertama Kali',
      excerpt:
        'Panduan lengkap untuk traveler yang pertama kali mengunjungi Pulau Pahawang. Mulai dari persiapan hingga tips hemat.',
      content: `
# Tips Perjalanan ke Pahawang untuk Pertama Kali

Pulau Pahawang adalah salah satu destinasi wisata bahari paling populer di Lampung. Jika ini kali pertama Anda berkunjung, berikut tips yang perlu Anda ketahui.

## Persiapan Sebelum Berangkat

### 1. Waktu Terbaik Berkunjung
Waktu terbaik mengunjungi Pahawang adalah April-Oktober saat cuaca cerah dan laut tenang.

### 2. Barang yang Perlu Dibawa
- Sunscreen SPF 50+
- Kacamata renang/snorkeling
- Baju ganti 2-3 set
- Obat-obatan pribadi
- Power bank
- Waterproof bag

## Di Lokasi

### Aktivitas Wajib Coba
1. **Snorkeling** - Air jernih dengan terumbu karang indah
2. **Island Hopping** - Kunjungi pulau-pulau kecil sekitar
3. **Sunset Viewing** - Pemandangan sunset yang memukau

### Tips Hemat
- Pesan paket trip jauh-jauh hari
- Bawa bekal dari rumah
- Datang dengan grup untuk split cost

## Kesimpulan

Pahawang menawarkan pengalaman wisata bahari yang tak terlupakan. Dengan persiapan yang tepat, perjalanan Anda akan lebih menyenangkan!
      `,
      featuredImage: '/images/blog/pahawang-tips.jpg',
      category: 'tips-perjalanan',
      tags: ['pahawang', 'lampung', 'snorkeling', 'island-hopping'],
      author: {
        id: 'author-1',
        name: 'Sarah Traveler',
        avatar: '/images/authors/sarah.jpg',
        bio: 'Travel enthusiast yang sudah mengunjungi 50+ destinasi di Indonesia',
      },
      publishedAt: '2024-01-15T10:00:00Z',
      readTime: 5,
      views: 1250,
    },
    {
      id: '2',
      slug: 'packing-list-snorkeling',
      title: 'Packing List Lengkap untuk Trip Snorkeling',
      excerpt:
        'Checklist barang yang wajib dibawa saat trip snorkeling agar perjalanan Anda lebih nyaman dan aman.',
      content: `
# Packing List Lengkap untuk Trip Snorkeling

Snorkeling adalah aktivitas favorit di wisata bahari. Berikut packing list lengkap agar trip Anda maksimal.

## Essentials

### Peralatan Snorkeling
- Masker snorkeling
- Snorkel (pipe)
- Fin/kaki katak
- Life jacket (biasanya disediakan)

### Pakaian
- Swimwear/baju renang
- Rashguard (untuk melindungi dari matahari)
- Baju ganti 2-3 set
- Handuk microfiber

### Perlindungan
- Sunscreen waterproof SPF 50+
- Lip balm dengan SPF
- Topi/cap
- Kacamata hitam

## Optional tapi Recommended

- Underwater camera/GoPro
- Waterproof phone case
- Anti-seasickness pills
- Dry bag untuk barang berharga

## Tips Pro

1. **Jangan bawa perhiasan** - Bisa hilang saat berenang
2. **Pack light** - Semakin ringan semakin baik
3. **Waterproof everything** - Air laut ada di mana-mana

Happy snorkeling! 🤿
      `,
      featuredImage: '/images/blog/snorkeling-packing.jpg',
      category: 'packing-list',
      tags: ['snorkeling', 'packing-list', 'diving', 'underwater'],
      author: {
        id: 'author-1',
        name: 'Sarah Traveler',
        avatar: '/images/authors/sarah.jpg',
      },
      publishedAt: '2024-01-10T08:00:00Z',
      readTime: 4,
      views: 890,
    },
  ];
}

