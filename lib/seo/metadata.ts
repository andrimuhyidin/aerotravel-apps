/**
 * SEO Metadata Helper
 * Generate metadata untuk Next.js pages dengan SEO best practices
 */

import { Metadata } from 'next';

export type SEOMetadataParams = {
  title: string;
  description: string;
  keywords?: string[];
  url?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
};

/**
 * Generate comprehensive SEO metadata
 */
export function generateMetadata(params: SEOMetadataParams): Metadata {
  const {
    title,
    description,
    keywords = [],
    url,
    image,
    type = 'website',
    publishedTime,
    modifiedTime,
  } = params;

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';
  // Ensure URL starts with / and handle locale
  const cleanUrl = url?.startsWith('/') ? url : url ? `/${url}` : '/';
  const fullUrl = `${siteUrl}${cleanUrl}`;
  const ogImage = image || `${siteUrl}/og-image.jpg`;

  return {
    title: {
      default: title,
      template: '%s | MyAeroTravel ID',
    },
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'Aero Travel Indonesia' }],
    creator: 'Aero Travel Indonesia',
    publisher: 'Aero Travel Indonesia',
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      type: type === 'product' ? 'website' : type,
      url: fullUrl,
      title,
      description,
      siteName: 'MyAeroTravel ID',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      publishedTime,
      modifiedTime,
      locale: 'id_ID',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Generate structured data (JSON-LD) untuk SEO
 */
export function generateStructuredData(params: {
  type: 'Product' | 'TravelAction' | 'Organization';
  data: Record<string, unknown>;
}): string {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': params.type,
    ...params.data,
  };

  return JSON.stringify(baseSchema);
}

/**
 * Product schema untuk paket wisata
 */
export function generateProductSchema(product: {
  name: string;
  description: string;
  price: number;
  currency?: string;
  image?: string;
  url: string;
}): string {
  return generateStructuredData({
    type: 'Product',
    data: {
      name: product.name,
      description: product.description,
      image: product.image,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency || 'IDR',
        availability: 'https://schema.org/InStock',
        url: product.url,
      },
    },
  });
}

/**
 * TravelAction schema untuk booking
 */
export function generateTravelActionSchema(travel: {
  name: string;
  description: string;
  destination: string;
  origin: string;
  price: number;
}): string {
  return generateStructuredData({
    type: 'TravelAction',
    data: {
      name: travel.name,
      description: travel.description,
      target: {
        '@type': 'Place',
        name: travel.destination,
      },
      object: {
        '@type': 'Place',
        name: travel.origin,
      },
      price: travel.price,
      priceCurrency: 'IDR',
    },
  });
}

