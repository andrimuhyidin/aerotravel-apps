/**
 * SEO Schema Types
 * TypeScript types for all structured data schema generators
 */

// ============================================
// Article Schema Types
// ============================================

export type ArticleSchemaInput = {
  headline: string;
  description: string;
  author: AuthorSchemaInput;
  datePublished: string; // ISO 8601 format
  dateModified?: string;
  image?: string;
  url?: string;
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
};

// ============================================
// HowTo Schema Types
// ============================================

export type HowToStep = {
  name: string;
  text: string;
  image?: string;
  url?: string;
};

export type HowToSchemaInput = {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration format (e.g., "PT30M")
  estimatedCost?: {
    currency: string;
    value: number;
  };
  supply?: string[];
  tool?: string[];
  image?: string;
};

// ============================================
// Author/Person Schema Types
// ============================================

export type AuthorSchemaInput = {
  name: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  url?: string;
  email?: string;
  sameAs?: string[]; // Social profile URLs (LinkedIn, Twitter, etc.)
  worksFor?: {
    name: string;
    url?: string;
  };
};

// ============================================
// Video Schema Types
// ============================================

export type VideoSchemaInput = {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string; // ISO 8601 format
  duration?: string; // ISO 8601 duration format (e.g., "PT5M30S")
  contentUrl?: string;
  embedUrl?: string;
  interactionCount?: number;
  publisher?: {
    name: string;
    logo?: string;
  };
};

// ============================================
// Image Schema Types
// ============================================

export type ImageSchemaInput = {
  url: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
  author?: string;
  dateCreated?: string;
  location?: string;
};

// ============================================
// Review Schema Types (Enhanced)
// ============================================

export type ReviewSchemaInput = {
  author: {
    name: string;
    url?: string;
  };
  rating: number;
  reviewBody: string;
  datePublished: string;
  itemReviewed: {
    name: string;
    type: 'TouristTrip' | 'TravelAgency' | 'Product' | 'Place';
    url?: string;
  };
};

// ============================================
// FAQ Schema Types
// ============================================

export type FAQItem = {
  question: string;
  answer: string;
};

// ============================================
// Breadcrumb Schema Types
// ============================================

export type BreadcrumbItem = {
  name: string;
  url: string;
};

// ============================================
// Package/TouristTrip Schema Types
// ============================================

export type PackageSchemaInput = {
  name: string;
  description: string;
  slug: string;
  price: number;
  destination: string;
  duration?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
};

// ============================================
// Organization Schema Types
// ============================================

export type OrganizationSchemaInput = {
  name: string;
  alternateName?: string;
  url: string;
  logo: string;
  description: string;
  address?: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  contactPoint?: {
    telephone: string;
    contactType: string;
    availableLanguage?: string[];
  };
  sameAs?: string[];
  foundingDate?: string;
  numberOfEmployees?: number;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
};

// ============================================
// Local Business Schema Types
// ============================================

export type LocalBusinessSchemaInput = {
  name: string;
  description: string;
  url: string;
  telephone: string;
  email?: string;
  address: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: {
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }[];
  priceRange?: string;
  image?: string;
  sameAs?: string[];
};

// ============================================
// SEO Page Schema Types (for Programmatic SEO)
// ============================================

export type SeoPageSchemaInput = {
  title: string;
  description: string;
  slug: string;
  originCity: string;
  packageName: string;
  packageDestination: string;
  price?: number;
  keywords?: string[];
};

// ============================================
// Component Props Types
// ============================================

export type AISummaryProps = {
  summary: string;
  bulletPoints?: string[];
  className?: string;
};

export type DirectAnswersProps = {
  type: 'bullets' | 'numbered' | 'table';
  items: string[] | TableRow[];
  title?: string;
  className?: string;
};

export type TableRow = {
  cells: string[];
};

export type AuthorBioProps = {
  name: string;
  role: string;
  image?: string;
  bio?: string;
  linkedIn?: string;
  twitter?: string;
  email?: string;
  verified?: boolean;
  className?: string;
};

export type TrustSignalsProps = {
  stats?: {
    value: string;
    label: string;
  }[];
  certifications?: {
    name: string;
    logo?: string;
  }[];
  className?: string;
};

export type ExternalReferenceProps = {
  title: string;
  url: string;
  source: string;
  date?: string;
};

export type RelatedContentProps = {
  title?: string;
  links: {
    title: string;
    href: string;
    description?: string;
  }[];
  className?: string;
};

