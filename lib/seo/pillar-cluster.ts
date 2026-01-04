/**
 * Pillar-Cluster Content Strategy
 * Defines content hierarchy for topical authority
 */

import { DESTINATIONS, TRIP_TYPES } from './config';

// ============================================
// Pillar Page Types
// ============================================

export type PillarPage = {
  id: string;
  title: string;
  slug: string;
  description: string;
  keywords: string[];
};

export type ClusterPage = {
  id: string;
  pillarId: string;
  title: string;
  slug: string;
  description: string;
  keywords: string[];
};

// ============================================
// Pillar Pages - Main Topic Hubs
// ============================================

export const PILLAR_PAGES: Record<string, PillarPage> = {
  wisataBahari: {
    id: 'wisata-bahari',
    title: 'Panduan Wisata Bahari Indonesia',
    slug: '/wisata-bahari',
    description:
      'Panduan lengkap wisata bahari Indonesia - destinasi, tips, dan paket wisata terbaik untuk snorkeling, diving, dan island hopping.',
    keywords: [
      'wisata bahari',
      'wisata laut indonesia',
      'snorkeling indonesia',
      'diving indonesia',
    ],
  },

  wisataLampung: {
    id: 'wisata-lampung',
    title: 'Wisata Lampung - Destinasi & Panduan Lengkap',
    slug: '/wisata-lampung',
    description:
      'Jelajahi keindahan wisata Lampung - Pahawang, Kiluan, Krakatau, dan destinasi eksotis lainnya. Panduan lengkap dari ahlinya.',
    keywords: [
      'wisata lampung',
      'destinasi lampung',
      'pahawang',
      'kiluan',
      'pantai lampung',
    ],
  },

  snorkeling: {
    id: 'snorkeling',
    title: 'Panduan Snorkeling Indonesia',
    slug: '/snorkeling',
    description:
      'Panduan lengkap snorkeling di Indonesia - spot terbaik, tips keamanan, dan paket wisata snorkeling untuk pemula hingga mahir.',
    keywords: [
      'snorkeling indonesia',
      'spot snorkeling',
      'belajar snorkeling',
      'snorkeling pemula',
    ],
  },

  tripPlanning: {
    id: 'trip-planning',
    title: 'Cara Merencanakan Trip Wisata',
    slug: '/trip-planning',
    description:
      'Panduan lengkap merencanakan trip wisata - budgeting, packing list, tips keamanan, dan checklist perjalanan.',
    keywords: [
      'trip planning',
      'rencana wisata',
      'tips traveling',
      'panduan traveling',
    ],
  },
} as const;

// ============================================
// Cluster Pages - Supporting Content
// ============================================

export const CLUSTER_PAGES: ClusterPage[] = [
  // Wisata Lampung Clusters
  {
    id: 'pahawang-guide',
    pillarId: 'wisata-lampung',
    title: 'Panduan Lengkap Wisata Pulau Pahawang',
    slug: '/wisata-lampung/pahawang',
    description: 'Semua yang perlu kamu tahu tentang wisata ke Pulau Pahawang.',
    keywords: ['pulau pahawang', 'snorkeling pahawang', 'trip pahawang'],
  },
  {
    id: 'kiluan-guide',
    pillarId: 'wisata-lampung',
    title: 'Panduan Lengkap Wisata Teluk Kiluan',
    slug: '/wisata-lampung/kiluan',
    description: 'Panduan wisata ke Teluk Kiluan untuk melihat lumba-lumba.',
    keywords: ['teluk kiluan', 'lumba-lumba kiluan', 'trip kiluan'],
  },
  {
    id: 'krakatau-guide',
    pillarId: 'wisata-lampung',
    title: 'Panduan Wisata Gunung Anak Krakatau',
    slug: '/wisata-lampung/krakatau',
    description: 'Petualangan ke Gunung Anak Krakatau dari Lampung.',
    keywords: ['anak krakatau', 'wisata krakatau', 'gunung krakatau'],
  },

  // Snorkeling Clusters
  {
    id: 'snorkeling-pemula',
    pillarId: 'snorkeling',
    title: 'Panduan Snorkeling untuk Pemula',
    slug: '/snorkeling/pemula',
    description: 'Tips snorkeling untuk pemula - teknik, keamanan, dan persiapan.',
    keywords: ['snorkeling pemula', 'belajar snorkeling', 'tips snorkeling'],
  },
  {
    id: 'spot-snorkeling-lampung',
    pillarId: 'snorkeling',
    title: 'Spot Snorkeling Terbaik di Lampung',
    slug: '/snorkeling/lampung',
    description: 'Daftar spot snorkeling terbaik di Lampung dan sekitarnya.',
    keywords: ['snorkeling lampung', 'spot snorkeling', 'terumbu karang lampung'],
  },
  {
    id: 'peralatan-snorkeling',
    pillarId: 'snorkeling',
    title: 'Panduan Memilih Peralatan Snorkeling',
    slug: '/snorkeling/peralatan',
    description: 'Cara memilih masker, snorkel, dan fin yang tepat.',
    keywords: ['peralatan snorkeling', 'masker snorkeling', 'fin snorkeling'],
  },

  // Trip Planning Clusters
  {
    id: 'packing-list',
    pillarId: 'trip-planning',
    title: 'Packing List Wisata Bahari',
    slug: '/trip-planning/packing-list',
    description: 'Checklist lengkap packing untuk wisata bahari.',
    keywords: ['packing list', 'bawa apa ke pantai', 'persiapan wisata'],
  },
  {
    id: 'budgeting-trip',
    pillarId: 'trip-planning',
    title: 'Cara Budgeting Trip Wisata',
    slug: '/trip-planning/budgeting',
    description: 'Tips mengatur budget untuk liburan tanpa jebol kantong.',
    keywords: ['budget wisata', 'hemat liburan', 'tips budget traveling'],
  },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Get pillar page by ID
 */
export function getPillarPage(id: string): PillarPage | undefined {
  return Object.values(PILLAR_PAGES).find((p) => p.id === id);
}

/**
 * Get all cluster pages for a pillar
 */
export function getClusterPages(pillarId: string): ClusterPage[] {
  return CLUSTER_PAGES.filter((c) => c.pillarId === pillarId);
}

/**
 * Get related internal links for a page
 */
export function getRelatedLinks(
  currentSlug: string,
  limit = 5
): { title: string; href: string }[] {
  // Find the pillar this page belongs to
  const cluster = CLUSTER_PAGES.find((c) => c.slug === currentSlug);
  const pillar = cluster
    ? getPillarPage(cluster.pillarId)
    : Object.values(PILLAR_PAGES).find((p) => p.slug === currentSlug);

  if (!pillar) {
    // Return random pages if no pillar found
    return CLUSTER_PAGES.slice(0, limit).map((c) => ({
      title: c.title,
      href: c.slug,
    }));
  }

  // Get sibling clusters and pillar
  const siblings = getClusterPages(pillar.id)
    .filter((c) => c.slug !== currentSlug)
    .map((c) => ({ title: c.title, href: c.slug }));

  // Add pillar page if current is a cluster
  if (cluster) {
    siblings.unshift({ title: pillar.title, href: pillar.slug });
  }

  return siblings.slice(0, limit);
}

/**
 * Generate breadcrumb items for a page
 */
export function generateBreadcrumbItems(
  currentSlug: string
): { label: string; href?: string }[] {
  const items: { label: string; href?: string }[] = [
    { label: 'Home', href: '/' },
  ];

  // Check if it's a cluster page
  const cluster = CLUSTER_PAGES.find((c) => c.slug === currentSlug);
  if (cluster) {
    const pillar = getPillarPage(cluster.pillarId);
    if (pillar) {
      items.push({ label: pillar.title, href: pillar.slug });
    }
    items.push({ label: cluster.title });
    return items;
  }

  // Check if it's a pillar page
  const pillar = Object.values(PILLAR_PAGES).find((p) => p.slug === currentSlug);
  if (pillar) {
    items.push({ label: pillar.title });
    return items;
  }

  // Default for other pages
  return items;
}

/**
 * Get destination-based content links
 */
export function getDestinationLinks(): { title: string; href: string }[] {
  return Object.values(DESTINATIONS).map((dest) => ({
    title: `Wisata ${dest.name}`,
    href: `/packages?destination=${dest.slug}`,
  }));
}

/**
 * Get trip type content links
 */
export function getTripTypeLinks(): { title: string; href: string }[] {
  return Object.values(TRIP_TYPES).map((type) => ({
    title: `Paket ${type.name}`,
    href: `/packages?type=${type.slug}`,
  }));
}

