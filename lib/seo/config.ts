/**
 * SEO Configuration
 * Centralized configuration for all SEO-related settings
 */

// ============================================
// Company Info
// ============================================

export const COMPANY = {
  name: 'MyAeroTravel',
  alternateName: 'Aero Travel Indonesia',
  tagline: 'Your Trusted Travel Partner',
  foundingDate: '2018-01-01',
  description:
    'Platform travel management terpercaya untuk pengalaman wisata bahari terbaik di Indonesia. Menyediakan paket wisata Pahawang, Kiluan, dan destinasi eksotis lainnya.',
  shortDescription: 'Travel management platform terpercaya di Indonesia',
} as const;

// ============================================
// Contact Info
// ============================================

export const CONTACT = {
  phone: '+62-812-3456-7890',
  email: 'info@myaerotravel.id',
  whatsapp: '+62-812-3456-7890',
  address: {
    street: 'Jl. Raden Intan No. 123',
    city: 'Bandar Lampung',
    province: 'Lampung',
    postalCode: '35132',
    country: 'Indonesia',
    countryCode: 'ID',
  },
  geo: {
    latitude: -5.4294,
    longitude: 105.262,
  },
} as const;

// ============================================
// Social Profiles
// ============================================

export const SOCIAL_PROFILES = {
  instagram: 'https://www.instagram.com/myaerotravel',
  facebook: 'https://www.facebook.com/myaerotravel',
  tiktok: 'https://www.tiktok.com/@myaerotravel',
  youtube: 'https://www.youtube.com/@myaerotravel',
  twitter: 'https://twitter.com/myaerotravel',
  linkedin: 'https://www.linkedin.com/company/myaerotravel',
} as const;

export const SOCIAL_PROFILES_ARRAY = Object.values(SOCIAL_PROFILES);

// ============================================
// Default Images
// ============================================

export const IMAGES = {
  logo: '/logo.png',
  logoSquare: '/logo-square.png',
  ogDefault: '/og-image.jpg',
  favicon: '/favicon.ico',
  placeholder: '/images/placeholder.jpg',
  heroDefault: '/images/hero-default.jpg',
} as const;

// ============================================
// SEO Defaults
// ============================================

export const SEO_DEFAULTS = {
  titleSuffix: ' | MyAeroTravel',
  titleSeparator: ' - ',
  defaultTitle: 'MyAeroTravel - Travel Management Platform',
  defaultDescription:
    'Platform travel management terpercaya untuk pengalaman wisata bahari terbaik di Indonesia. Paket wisata Pahawang, Kiluan, Labuan Bajo.',
  defaultKeywords: [
    'travel indonesia',
    'paket wisata',
    'wisata bahari',
    'pahawang',
    'kiluan',
    'labuan bajo',
    'travel lampung',
    'snorkeling',
    'island hopping',
  ],
  locale: 'id_ID',
  localeAlternate: 'en_US',
  type: 'website',
} as const;

// ============================================
// Business Hours
// ============================================

export const BUSINESS_HOURS = {
  weekdays: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '08:00',
    closes: '17:00',
  },
  saturday: {
    days: ['Saturday'],
    opens: '08:00',
    closes: '12:00',
  },
  sunday: null, // Closed
} as const;

// ============================================
// Price Range
// ============================================

export const PRICE_RANGE = {
  min: 300000,
  max: 15000000,
  currency: 'IDR',
  display: 'Rp 300.000 - Rp 15.000.000',
} as const;

// ============================================
// Credentials & Certifications
// ============================================

export const CERTIFICATIONS = [
  {
    name: 'Member ASITA',
    description: 'Association of The Indonesian Tours and Travel Agencies',
    logo: '/images/certifications/asita.png',
  },
  {
    name: 'Registered Travel Agency',
    description: 'Terdaftar di Kementerian Pariwisata dan Ekonomi Kreatif',
    logo: '/images/certifications/kemenparekraf.png',
  },
] as const;

// ============================================
// Aggregate Stats (for trust signals)
// ============================================

export const STATS = {
  totalCustomers: '10,000+',
  totalTrips: '5,000+',
  yearsInBusiness: '7+',
  satisfactionRate: '98%',
  averageRating: 4.9,
  totalReviews: 1500,
} as const;

// ============================================
// Destinations (for content tags)
// ============================================

export const DESTINATIONS = {
  pahawang: {
    name: 'Pulau Pahawang',
    slug: 'pahawang',
    province: 'Lampung',
    description: 'Destinasi snorkeling terbaik di Lampung dengan terumbu karang yang indah',
  },
  kiluan: {
    name: 'Teluk Kiluan',
    slug: 'kiluan',
    province: 'Lampung',
    description: 'Habitat lumba-lumba dan pantai eksotis di selatan Lampung',
  },
  labuanBajo: {
    name: 'Labuan Bajo',
    slug: 'labuan-bajo',
    province: 'NTT',
    description: 'Gerbang menuju Taman Nasional Komodo dan Raja Ampat-nya Indonesia Timur',
  },
  rajaAmpat: {
    name: 'Raja Ampat',
    slug: 'raja-ampat',
    province: 'Papua Barat',
    description: 'Surga diving dengan biodiversitas laut tertinggi di dunia',
  },
} as const;

// ============================================
// Trip Types (for content tags)
// ============================================

export const TRIP_TYPES = {
  snorkeling: {
    name: 'Snorkeling',
    slug: 'snorkeling',
    description: 'Menjelajah keindahan bawah laut',
  },
  diving: {
    name: 'Diving',
    slug: 'diving',
    description: 'Menyelam ke dalam lautan',
  },
  islandHopping: {
    name: 'Island Hopping',
    slug: 'island-hopping',
    description: 'Menjelajah pulau-pulau eksotis',
  },
  sailing: {
    name: 'Sailing',
    slug: 'sailing',
    description: 'Berlayar mengarungi lautan',
  },
  dolphinWatching: {
    name: 'Dolphin Watching',
    slug: 'dolphin-watching',
    description: 'Menyaksikan lumba-lumba di habitat aslinya',
  },
} as const;

// ============================================
// Helper Functions
// ============================================

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';
}

export function getFullUrl(path: string): string {
  const base = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function getImageUrl(imagePath: string): string {
  if (imagePath.startsWith('http')) return imagePath;
  return getFullUrl(imagePath);
}

