/**
 * Blog Categories
 * Defines content categories for blog articles
 */

export type BlogCategory = {
  slug: string;
  name: string;
  description: string;
  emoji: string;
};

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: 'tips-perjalanan',
    name: 'Tips Perjalanan',
    description: 'Panduan praktis untuk perjalanan wisata yang menyenangkan',
    emoji: '💡',
  },
  {
    slug: 'destinasi',
    name: 'Destinasi',
    description: 'Panduan lengkap destinasi wisata bahari di Indonesia',
    emoji: '🏝️',
  },
  {
    slug: 'packing-list',
    name: 'Packing List',
    description: 'Checklist barang bawaan untuk berbagai jenis trip',
    emoji: '🎒',
  },
  {
    slug: 'pengalaman',
    name: 'Pengalaman',
    description: 'Cerita perjalanan dari traveler lain',
    emoji: '✨',
  },
  {
    slug: 'berita',
    name: 'Berita',
    description: 'Update terbaru seputar wisata dan travel',
    emoji: '📰',
  },
];

export function getCategoryBySlug(slug: string): BlogCategory | undefined {
  return BLOG_CATEGORIES.find((cat) => cat.slug === slug);
}

export function getAllCategories(): BlogCategory[] {
  return BLOG_CATEGORIES;
}

