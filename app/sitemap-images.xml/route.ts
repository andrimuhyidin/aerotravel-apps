/**
 * Image Sitemap Generator
 * Generates XML sitemap for images (packages, destinations, blog)
 * 
 * Route: /sitemap-images.xml
 */

import { NextResponse } from 'next/server';

import { getAllArticles } from '@/lib/blog/articles';
import { getAllDestinations } from '@/lib/destinations/data';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate every 24 hours

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';
  const supabase = await createClient();

  const imageUrls: Array<{
    loc: string;
    caption?: string;
    title?: string;
    geoLocation?: string;
    license?: string;
  }> = [];

  // Fetch packages
  const { data: packages } = await supabase
    .from('packages')
    .select('slug, name, image_url, destination')
    .eq('is_published', true)
    .limit(1000);

  if (packages) {
    packages.forEach((pkg) => {
      if (pkg.image_url) {
        imageUrls.push({
          loc: pkg.image_url.startsWith('http')
            ? pkg.image_url
            : `${baseUrl}${pkg.image_url}`,
          caption: pkg.name,
          title: `${pkg.name} - Paket Wisata ${pkg.destination}`,
        });
      }
    });
  }

  // Fetch destinations
  const destinations = await getAllDestinations();
  destinations.forEach((dest) => {
    if (dest.featuredImage) {
      imageUrls.push({
        loc: dest.featuredImage.startsWith('http')
          ? dest.featuredImage
          : `${baseUrl}${dest.featuredImage}`,
        caption: dest.name,
        title: `Destinasi ${dest.name}, ${dest.province}`,
        geoLocation: `${dest.coordinates.lat},${dest.coordinates.lng}`,
      });
    }

    // Add gallery images
    dest.gallery.forEach((img) => {
      imageUrls.push({
        loc: img.startsWith('http') ? img : `${baseUrl}${img}`,
        caption: `${dest.name} Gallery`,
        title: `Galeri ${dest.name}`,
      });
    });
  });

  // Fetch blog articles
  const { articles } = await getAllArticles({ limit: 1000 });
  articles.forEach((article) => {
    if (article.featuredImage) {
      imageUrls.push({
        loc: article.featuredImage.startsWith('http')
          ? article.featuredImage
          : `${baseUrl}${article.featuredImage}`,
        caption: article.title,
        title: article.title,
      });
    }
  });

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${imageUrls
    .map(
      (img) => `
  <url>
    <loc>${baseUrl}</loc>
    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>
      ${img.caption ? `<image:caption>${escapeXml(img.caption)}</image:caption>` : ''}
      ${img.title ? `<image:title>${escapeXml(img.title)}</image:title>` : ''}
      ${img.geoLocation ? `<image:geo_location>${escapeXml(img.geoLocation)}</image:geo_location>` : ''}
      ${img.license ? `<image:license>${escapeXml(img.license)}</image:license>` : ''}
    </image:image>
  </url>`
    )
    .join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

