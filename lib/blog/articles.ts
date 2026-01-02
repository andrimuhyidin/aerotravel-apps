/**
 * Blog Articles Data Layer
 * Fetches and manages blog article data
 */

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

/**
 * Get all published articles
 */
export async function getAllArticles(options?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<{ articles: BlogArticle[]; total: number }> {
  // TODO: Replace with actual database query
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
 * Get article by slug
 */
export async function getArticleBySlug(
  slug: string
): Promise<BlogArticle | null> {
  // TODO: Replace with actual database query
  const articles = getSampleArticles();
  return articles.find((a) => a.slug === slug) || null;
}

/**
 * Get related articles
 */
export async function getRelatedArticles(
  slug: string,
  limit: number = 3
): Promise<BlogArticle[]> {
  // TODO: Implement smarter related article logic
  const currentArticle = await getArticleBySlug(slug);
  if (!currentArticle) return [];

  const { articles } = await getAllArticles({
    category: currentArticle.category,
  });

  return articles
    .filter((a) => a.slug !== slug)
    .slice(0, limit);
}

/**
 * Get popular articles
 */
export async function getPopularArticles(limit: number = 5): Promise<BlogArticle[]> {
  // TODO: Implement views-based sorting from database
  const { articles } = await getAllArticles();
  return articles
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, limit);
}

/**
 * Get recent articles
 */
export async function getRecentArticles(limit: number = 5): Promise<BlogArticle[]> {
  const { articles } = await getAllArticles({ limit });
  return articles;
}

/**
 * Sample articles (placeholder data)
 * TODO: Remove this when database is connected
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

