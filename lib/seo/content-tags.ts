/**
 * Content Tags & Categories
 * For content organization and SEO structure
 */

// ============================================
// Tag Types
// ============================================

export type ContentTag = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: TagCategory;
  parentId?: string;
};

export type TagCategory = 'destination' | 'activity' | 'budget' | 'duration' | 'audience';

// ============================================
// Destinations
// ============================================

export const DESTINATION_TAGS: ContentTag[] = [
  {
    id: 'lampung',
    name: 'Lampung',
    slug: 'lampung',
    description: 'Destinasi wisata di Provinsi Lampung',
    category: 'destination',
  },
  {
    id: 'pahawang',
    name: 'Pulau Pahawang',
    slug: 'pahawang',
    description: 'Pulau eksotis dengan terumbu karang indah',
    category: 'destination',
    parentId: 'lampung',
  },
  {
    id: 'kiluan',
    name: 'Teluk Kiluan',
    slug: 'kiluan',
    description: 'Habitat lumba-lumba di selatan Lampung',
    category: 'destination',
    parentId: 'lampung',
  },
  {
    id: 'krakatau',
    name: 'Anak Krakatau',
    slug: 'krakatau',
    description: 'Gunung berapi legendaris di Selat Sunda',
    category: 'destination',
    parentId: 'lampung',
  },
  {
    id: 'labuan-bajo',
    name: 'Labuan Bajo',
    slug: 'labuan-bajo',
    description: 'Gerbang menuju Taman Nasional Komodo',
    category: 'destination',
  },
  {
    id: 'raja-ampat',
    name: 'Raja Ampat',
    slug: 'raja-ampat',
    description: 'Surga diving dengan biodiversitas tertinggi',
    category: 'destination',
  },
];

// ============================================
// Activities
// ============================================

export const ACTIVITY_TAGS: ContentTag[] = [
  {
    id: 'snorkeling',
    name: 'Snorkeling',
    slug: 'snorkeling',
    description: 'Menjelajah keindahan bawah laut',
    category: 'activity',
  },
  {
    id: 'diving',
    name: 'Diving',
    slug: 'diving',
    description: 'Menyelam ke dalam lautan',
    category: 'activity',
  },
  {
    id: 'island-hopping',
    name: 'Island Hopping',
    slug: 'island-hopping',
    description: 'Menjelajah pulau-pulau eksotis',
    category: 'activity',
  },
  {
    id: 'dolphin-watching',
    name: 'Dolphin Watching',
    slug: 'dolphin-watching',
    description: 'Menyaksikan lumba-lumba liar',
    category: 'activity',
  },
  {
    id: 'sailing',
    name: 'Sailing',
    slug: 'sailing',
    description: 'Berlayar mengarungi lautan',
    category: 'activity',
  },
  {
    id: 'sunset-cruise',
    name: 'Sunset Cruise',
    slug: 'sunset-cruise',
    description: 'Menikmati matahari terbenam di laut',
    category: 'activity',
  },
];

// ============================================
// Budget Categories
// ============================================

export const BUDGET_TAGS: ContentTag[] = [
  {
    id: 'budget',
    name: 'Budget',
    slug: 'budget',
    description: 'Paket hemat untuk backpacker',
    category: 'budget',
  },
  {
    id: 'mid-range',
    name: 'Mid Range',
    slug: 'mid-range',
    description: 'Paket dengan fasilitas standar',
    category: 'budget',
  },
  {
    id: 'premium',
    name: 'Premium',
    slug: 'premium',
    description: 'Paket dengan fasilitas terbaik',
    category: 'budget',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    slug: 'luxury',
    description: 'Pengalaman mewah dan eksklusif',
    category: 'budget',
  },
];

// ============================================
// Duration Categories
// ============================================

export const DURATION_TAGS: ContentTag[] = [
  {
    id: 'day-trip',
    name: 'Day Trip',
    slug: 'day-trip',
    description: 'Perjalanan satu hari',
    category: 'duration',
  },
  {
    id: 'weekend',
    name: 'Weekend',
    slug: 'weekend',
    description: 'Perjalanan 2-3 hari',
    category: 'duration',
  },
  {
    id: 'long-weekend',
    name: 'Long Weekend',
    slug: 'long-weekend',
    description: 'Perjalanan 3-4 hari',
    category: 'duration',
  },
  {
    id: 'week-trip',
    name: 'Week Trip',
    slug: 'week-trip',
    description: 'Perjalanan 5-7 hari',
    category: 'duration',
  },
];

// ============================================
// Audience Categories
// ============================================

export const AUDIENCE_TAGS: ContentTag[] = [
  {
    id: 'family',
    name: 'Family',
    slug: 'family',
    description: 'Cocok untuk keluarga dengan anak',
    category: 'audience',
  },
  {
    id: 'couple',
    name: 'Couple',
    slug: 'couple',
    description: 'Romantis untuk pasangan',
    category: 'audience',
  },
  {
    id: 'group',
    name: 'Group',
    slug: 'group',
    description: 'Ideal untuk rombongan',
    category: 'audience',
  },
  {
    id: 'solo',
    name: 'Solo',
    slug: 'solo',
    description: 'Untuk traveler solo',
    category: 'audience',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    slug: 'corporate',
    description: 'Untuk acara perusahaan',
    category: 'audience',
  },
];

// ============================================
// All Tags Combined
// ============================================

export const ALL_TAGS: ContentTag[] = [
  ...DESTINATION_TAGS,
  ...ACTIVITY_TAGS,
  ...BUDGET_TAGS,
  ...DURATION_TAGS,
  ...AUDIENCE_TAGS,
];

// ============================================
// Helper Functions
// ============================================

/**
 * Get tag by ID
 */
export function getTag(id: string): ContentTag | undefined {
  return ALL_TAGS.find((t) => t.id === id);
}

/**
 * Get tag by slug
 */
export function getTagBySlug(slug: string): ContentTag | undefined {
  return ALL_TAGS.find((t) => t.slug === slug);
}

/**
 * Get tags by category
 */
export function getTagsByCategory(category: TagCategory): ContentTag[] {
  return ALL_TAGS.filter((t) => t.category === category);
}

/**
 * Get child tags of a parent
 */
export function getChildTags(parentId: string): ContentTag[] {
  return ALL_TAGS.filter((t) => t.parentId === parentId);
}

/**
 * Get tags for SEO keywords
 */
export function getTagKeywords(tagIds: string[]): string[] {
  return tagIds
    .map((id) => getTag(id)?.name)
    .filter((name): name is string => Boolean(name));
}

/**
 * Generate URL for tag page
 */
export function getTagUrl(tag: ContentTag): string {
  switch (tag.category) {
    case 'destination':
      return `/packages?destination=${tag.slug}`;
    case 'activity':
      return `/packages?activity=${tag.slug}`;
    case 'budget':
      return `/packages?budget=${tag.slug}`;
    case 'duration':
      return `/packages?duration=${tag.slug}`;
    case 'audience':
      return `/packages?audience=${tag.slug}`;
    default:
      return `/packages?tag=${tag.slug}`;
  }
}

/**
 * Get popular tags for homepage/sidebar
 */
export function getPopularTags(limit = 10): ContentTag[] {
  // Return a mix of popular tags
  return [
    getTag('pahawang'),
    getTag('kiluan'),
    getTag('snorkeling'),
    getTag('island-hopping'),
    getTag('weekend'),
    getTag('family'),
    getTag('labuan-bajo'),
    getTag('diving'),
    getTag('budget'),
    getTag('couple'),
  ]
    .filter((t): t is ContentTag => Boolean(t))
    .slice(0, limit);
}

/**
 * Get related tags based on current tags
 */
export function getRelatedTags(currentTagIds: string[], limit = 5): ContentTag[] {
  const currentTags = currentTagIds.map((id) => getTag(id)).filter(Boolean) as ContentTag[];

  // Get tags from same categories that are not already selected
  const relatedTags = ALL_TAGS.filter((tag) => {
    if (currentTagIds.includes(tag.id)) return false;

    // Check if any current tag shares the same parent or category
    return currentTags.some(
      (ct) => ct.parentId === tag.parentId || ct.category === tag.category
    );
  });

  return relatedTags.slice(0, limit);
}

