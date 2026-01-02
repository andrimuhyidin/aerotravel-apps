/**
 * SEO Structured Data (JSON-LD)
 * Generates schema.org structured data for SEO
 */

import type {
  ArticleSchemaInput,
  AuthorSchemaInput,
  ReviewSchemaInput as EnhancedReviewSchemaInput,
  HowToSchemaInput,
  ImageSchemaInput,
  VideoSchemaInput,
} from './types';

// Re-export types for backward compatibility
export type {
  BreadcrumbItem,
  FAQItem,
  PackageSchemaInput,
  SeoPageSchemaInput,
} from './types';

// ============================================
// Base Schemas
// ============================================

// Organization Schema
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'MyAeroTravel',
    alternateName: 'Aero Travel',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id',
    logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id'}/logo.png`,
    description:
      'Platform travel management terpercaya untuk pengalaman wisata terbaik di Indonesia',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ID',
      addressLocality: 'Lampung',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+62-xxx-xxx-xxxx',
      contactType: 'customer service',
      availableLanguage: ['Indonesian', 'English'],
    },
    sameAs: [
      'https://www.instagram.com/aerotravel',
      'https://www.facebook.com/aerotravel',
    ],
  };
}

// Website Schema
export function generateWebsiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MyAeroTravel',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/packages?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// Package/Product Schema
// Type imported from ./types.ts

export function generatePackageSchema(
  pkg: import('./types').PackageSchemaInput
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: pkg.name,
    description: pkg.description,
    url: `${baseUrl}/packages/detail/${pkg.slug}`,
    touristType: 'Leisure',
    offers: {
      '@type': 'Offer',
      price: pkg.price,
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'TravelAgency',
        name: 'MyAeroTravel',
      },
    },
    itinerary: {
      '@type': 'ItemList',
      name: pkg.destination,
      description: pkg.duration || 'Trip duration varies',
    },
  };

  if (pkg.imageUrl) {
    schema.image = pkg.imageUrl;
  }

  if (pkg.rating && pkg.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: pkg.rating,
      reviewCount: pkg.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

// Breadcrumb Schema
// Type imported from ./types.ts

export function generateBreadcrumbSchema(
  items: import('./types').BreadcrumbItem[]
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

// FAQ Schema
// Type imported from ./types.ts

export function generateFAQSchema(faqs: import('./types').FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Review Schema (basic version)
type BasicReviewInput = {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
  itemReviewed: {
    name: string;
    type: 'TouristTrip' | 'TravelAgency';
  };
};

export function generateReviewSchema(review: BasicReviewInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.reviewBody,
    datePublished: review.datePublished,
    itemReviewed: {
      '@type': review.itemReviewed.type,
      name: review.itemReviewed.name,
    },
  };
}

// SEO Landing Page Schema (for programmatic SEO pages)
// Type imported from ./types.ts

export function generateSeoPageSchema(
  page: import('./types').SeoPageSchemaInput
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: page.title,
    description: page.description,
    url: `${baseUrl}/packages/from/${page.originCity.toLowerCase()}/${page.slug}`,
    touristType: 'Leisure',
    itinerary: {
      '@type': 'ItemList',
      name: `${page.packageName} dari ${page.originCity}`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: page.originCity,
          description: 'Kota keberangkatan',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: page.packageDestination,
          description: 'Destinasi wisata',
        },
      ],
    },
    ...(page.price && {
      offers: {
        '@type': 'Offer',
        price: page.price,
        priceCurrency: 'IDR',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'TravelAgency',
          name: 'MyAeroTravel',
        },
      },
    }),
    provider: {
      '@type': 'TravelAgency',
      name: 'MyAeroTravel',
      url: baseUrl,
    },
    ...(page.keywords && {
      keywords: page.keywords.join(', '),
    }),
  };
}

// Local Business Schema
export function generateLocalBusinessSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${baseUrl}/#organization`,
    name: 'MyAeroTravel',
    alternateName: 'Aero Travel Indonesia',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    image: `${baseUrl}/og-image.jpg`,
    description:
      'Platform travel management terpercaya untuk pengalaman wisata terbaik di Indonesia. Menyediakan paket wisata Pahawang, Kiluan, dan destinasi Lampung lainnya.',
    telephone: '+62-xxx-xxx-xxxx',
    email: 'info@myaerotravel.id',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Jl. Example No. 123',
      addressLocality: 'Bandar Lampung',
      addressRegion: 'Lampung',
      postalCode: '35132',
      addressCountry: 'ID',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -5.4294,
      longitude: 105.262,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '17:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '08:00',
        closes: '12:00',
      },
    ],
    priceRange: 'Rp 500.000 - Rp 5.000.000',
    paymentAccepted: ['Cash', 'Credit Card', 'Bank Transfer'],
    areaServed: {
      '@type': 'Country',
      name: 'Indonesia',
    },
    sameAs: [
      'https://www.instagram.com/aerotravel',
      'https://www.facebook.com/aerotravel',
      'https://www.tiktok.com/@aerotravel',
    ],
  };
}

// Combined Schema for SEO pages
export function generateCombinedSeoSchema(
  page: import('./types').SeoPageSchemaInput
) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      generateLocalBusinessSchema(),
      generateSeoPageSchema(page),
      generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Paket Wisata', url: '/packages' },
        {
          name: `Dari ${page.originCity}`,
          url: `/packages/from/${page.originCity.toLowerCase()}`,
        },
        {
          name: page.packageName,
          url: `/packages/from/${page.originCity.toLowerCase()}/${page.slug}`,
        },
      ]),
    ],
  };
}

// Serialize to JSON-LD script tag content
export function serializeSchema(schema: Record<string, unknown>): string {
  return JSON.stringify(schema);
}

// ============================================
// Advanced Schemas for AI & GEO, E-E-A-T
// ============================================

/**
 * Article Schema - for informative content pages
 * Supports AI extraction and Google Discover
 */
export function generateArticleSchema(article: ArticleSchemaInput) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author.name,
      ...(article.author.jobTitle && { jobTitle: article.author.jobTitle }),
      ...(article.author.url && { url: article.author.url }),
      ...(article.author.sameAs && { sameAs: article.author.sameAs }),
    },
    datePublished: article.datePublished,
    ...(article.dateModified && { dateModified: article.dateModified }),
    publisher: {
      '@type': 'Organization',
      name: 'MyAeroTravel',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    ...(article.image && { image: article.image }),
    ...(article.url && {
      url: article.url.startsWith('http')
        ? article.url
        : `${baseUrl}${article.url}`,
    }),
    ...(article.keywords && { keywords: article.keywords.join(', ') }),
    ...(article.articleSection && { articleSection: article.articleSection }),
    ...(article.wordCount && { wordCount: article.wordCount }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url?.startsWith('http')
        ? article.url
        : `${baseUrl}${article.url || '/'}`,
    },
  };

  return schema;
}

/**
 * HowTo Schema - for tutorials and guides
 * Optimized for featured snippets
 */
export function generateHowToSchema(howTo: HowToSchemaInput) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
      ...(step.url && {
        url: step.url.startsWith('http') ? step.url : `${baseUrl}${step.url}`,
      }),
    })),
    ...(howTo.totalTime && { totalTime: howTo.totalTime }),
    ...(howTo.estimatedCost && {
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: howTo.estimatedCost.currency,
        value: howTo.estimatedCost.value,
      },
    }),
    ...(howTo.supply && {
      supply: howTo.supply.map((item) => ({
        '@type': 'HowToSupply',
        name: item,
      })),
    }),
    ...(howTo.tool && {
      tool: howTo.tool.map((item) => ({
        '@type': 'HowToTool',
        name: item,
      })),
    }),
    ...(howTo.image && { image: howTo.image }),
  };

  return schema;
}

/**
 * Author/Person Schema - for E-E-A-T signals
 * Links to social profiles and expertise
 */
export function generateAuthorSchema(author: AuthorSchemaInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    ...(author.jobTitle && { jobTitle: author.jobTitle }),
    ...(author.description && { description: author.description }),
    ...(author.image && { image: author.image }),
    ...(author.url && { url: author.url }),
    ...(author.email && { email: author.email }),
    ...(author.sameAs && { sameAs: author.sameAs }),
    ...(author.worksFor && {
      worksFor: {
        '@type': 'Organization',
        name: author.worksFor.name,
        ...(author.worksFor.url && { url: author.worksFor.url }),
      },
    }),
  };

  return schema;
}

/**
 * Video Schema - for multimodal SEO
 * Optimized for video search results
 */
export function generateVideoSchema(video: VideoSchemaInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    ...(video.duration && { duration: video.duration }),
    ...(video.contentUrl && { contentUrl: video.contentUrl }),
    ...(video.embedUrl && { embedUrl: video.embedUrl }),
    ...(video.interactionCount && {
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'WatchAction' },
        userInteractionCount: video.interactionCount,
      },
    }),
    ...(video.publisher && {
      publisher: {
        '@type': 'Organization',
        name: video.publisher.name,
        ...(video.publisher.logo && {
          logo: {
            '@type': 'ImageObject',
            url: video.publisher.logo,
          },
        }),
      },
    }),
  };

  return schema;
}

/**
 * Image Gallery Schema - for photo galleries
 * Supports rich image search results
 */
export function generateImageGallerySchema(images: ImageSchemaInput[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    image: images.map((img) => ({
      '@type': 'ImageObject',
      url: img.url,
      ...(img.caption && { caption: img.caption }),
      ...(img.alt && { name: img.alt }),
      ...(img.width && { width: img.width }),
      ...(img.height && { height: img.height }),
      ...(img.author && {
        author: {
          '@type': 'Person',
          name: img.author,
        },
      }),
      ...(img.dateCreated && { dateCreated: img.dateCreated }),
      ...(img.location && {
        contentLocation: {
          '@type': 'Place',
          name: img.location,
        },
      }),
    })),
  };
}

/**
 * Enhanced Review Schema - with full author info
 * For E-E-A-T compliance
 */
export function generateReviewSchemaEnhanced(
  review: EnhancedReviewSchemaInput
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author.name,
      ...(review.author.url && { url: review.author.url }),
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.reviewBody,
    datePublished: review.datePublished,
    itemReviewed: {
      '@type': review.itemReviewed.type,
      name: review.itemReviewed.name,
      ...(review.itemReviewed.url && {
        url: review.itemReviewed.url.startsWith('http')
          ? review.itemReviewed.url
          : `${baseUrl}${review.itemReviewed.url}`,
      }),
    },
  };
}

/**
 * ItemList Schema - for collection pages
 */
export type ItemListItem = {
  position: number;
  item: {
    '@type': string;
    name: string;
    url: string;
    [key: string]: unknown;
  };
};

export function generateItemListSchema(items: ItemListItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((listItem) => ({
      '@type': 'ListItem',
      position: listItem.position,
      item: listItem.item,
    })),
  };
}

/**
 * About Page Schema
 */
export function generateAboutPageSchema(options: {
  name: string;
  description: string;
  url: string;
  foundingDate?: string;
  founders?: AuthorSchemaInput[];
  awards?: string[];
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: options.name,
    description: options.description,
    url: options.url.startsWith('http')
      ? options.url
      : `${baseUrl}${options.url}`,
    mainEntity: {
      '@type': 'TravelAgency',
      name: 'MyAeroTravel',
      url: baseUrl,
      ...(options.foundingDate && { foundingDate: options.foundingDate }),
      ...(options.founders && {
        founder: options.founders.map((f) => ({
          '@type': 'Person',
          name: f.name,
          ...(f.jobTitle && { jobTitle: f.jobTitle }),
          ...(f.sameAs && { sameAs: f.sameAs }),
        })),
      }),
      ...(options.awards && { award: options.awards }),
    },
  };
}

/**
 * Contact Page Schema
 */
export function generateContactPageSchema(options: {
  telephone: string;
  email: string;
  address?: string;
  openingHours?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Hubungi MyAeroTravel',
    url: `${baseUrl}/contact`,
    mainEntity: {
      '@type': 'TravelAgency',
      name: 'MyAeroTravel',
      telephone: options.telephone,
      email: options.email,
      ...(options.address && {
        address: {
          '@type': 'PostalAddress',
          streetAddress: options.address,
          addressCountry: 'ID',
        },
      }),
      ...(options.openingHours && { openingHours: options.openingHours }),
    },
  };
}
