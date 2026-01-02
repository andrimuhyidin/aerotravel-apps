/**
 * Speakable Schema Generator
 * For voice search and Google Assistant readability
 */

export type SpeakableSchemaInput = {
  headline: string;
  summary: string;
  cssSelectors?: string[];
  url: string;
};

export function generateSpeakableSchema(options: SpeakableSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: options.headline,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: options.cssSelectors || [
        '.ai-summary',
        '.article-headline',
        '.key-points',
        '.package-headline',
        '.destination-description',
      ],
    },
    url: options.url,
  };
}

/**
 * Generate speakable for package pages
 */
export function generatePackageSpeakable(packageData: {
  name: string;
  description: string;
  destination: string;
  duration: string;
  price: number;
  slug: string;
  locale: string;
}) {
  const summary = `${packageData.name}. Paket wisata ${packageData.duration} ke ${packageData.destination}. Harga mulai ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(packageData.price)} per orang.`;

  return generateSpeakableSchema({
    headline: packageData.name,
    summary,
    cssSelectors: ['.package-headline', '.ai-summary', '.key-points'],
    url: `${process.env.NEXT_PUBLIC_APP_URL}/${packageData.locale}/packages/detail/${packageData.slug}`,
  });
}

/**
 * Generate speakable for blog articles
 */
export function generateArticleSpeakable(articleData: {
  title: string;
  excerpt: string;
  slug: string;
  locale: string;
}) {
  return generateSpeakableSchema({
    headline: articleData.title,
    summary: articleData.excerpt,
    cssSelectors: ['.article-headline', '.ai-summary', 'article p'],
    url: `${process.env.NEXT_PUBLIC_APP_URL}/${articleData.locale}/blog/${articleData.slug}`,
  });
}

/**
 * Generate speakable for destination pages
 */
export function generateDestinationSpeakable(destinationData: {
  name: string;
  description: string;
  province: string;
  slug: string;
  locale: string;
}) {
  const summary = `${destinationData.name}, ${destinationData.province}. ${destinationData.description}`;

  return generateSpeakableSchema({
    headline: destinationData.name,
    summary,
    cssSelectors: ['.destination-description', '.ai-summary', '.highlights'],
    url: `${process.env.NEXT_PUBLIC_APP_URL}/${destinationData.locale}/destinations/${destinationData.slug}`,
  });
}

/**
 * Generate speakable for FAQ pages
 */
export function generateFAQSpeakable(faqData: {
  title: string;
  description: string;
  locale: string;
}) {
  return generateSpeakableSchema({
    headline: faqData.title,
    summary: faqData.description,
    cssSelectors: ['.faq-question', '.faq-answer'],
    url: `${process.env.NEXT_PUBLIC_APP_URL}/${faqData.locale}/help`,
  });
}

