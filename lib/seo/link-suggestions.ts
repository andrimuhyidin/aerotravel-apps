/**
 * Link Suggestions Utility
 * AI-powered or rule-based link suggestions for internal linking
 */

type LinkSuggestion = {
  title: string;
  href: string;
  relevance: number; // 0-1
  type: 'package' | 'destination' | 'article';
  description?: string;
};

/**
 * Get link suggestions based on content
 */
export async function getLinkSuggestions(options: {
  currentPage: string;
  content?: string;
  keywords?: string[];
  category?: string;
  limit?: number;
}): Promise<LinkSuggestion[]> {
  const { currentPage, content, keywords = [], category, limit = 4 } = options;

  // TODO: Implement AI-powered suggestions using embeddings/similarity
  // For now, use simple rule-based matching

  const suggestions: LinkSuggestion[] = [];

  // Match by keywords
  if (keywords.length > 0) {
    // Add destination links if destination keywords found
    const destinationKeywords = [
      'pahawang',
      'kiluan',
      'labuan bajo',
      'raja ampat',
      'karimunjawa',
      'tanjung lesung',
    ];
    destinationKeywords.forEach((dest) => {
      if (keywords.some((k) => k.toLowerCase().includes(dest))) {
        suggestions.push({
          title: `Destinasi ${dest.charAt(0).toUpperCase() + dest.slice(1)}`,
          href: `/destinations/${dest.toLowerCase().replace(/\s+/g, '-')}`,
          relevance: 0.8,
          type: 'destination',
        });
      }
    });

    // Add article links if activity keywords found
    const activityKeywords = ['snorkeling', 'diving', 'island hopping', 'packing'];
    activityKeywords.forEach((activity) => {
      if (keywords.some((k) => k.toLowerCase().includes(activity))) {
        suggestions.push({
          title: `Tips ${activity.charAt(0).toUpperCase() + activity.slice(1)}`,
          href: `/blog?q=${activity}`,
          relevance: 0.7,
          type: 'article',
        });
      }
    });
  }

  // Match by category
  if (category) {
    if (category.includes('destination')) {
      suggestions.push({
        title: 'Semua Destinasi',
        href: '/destinations',
        relevance: 0.6,
        type: 'destination',
      });
    }
    if (category.includes('package')) {
      suggestions.push({
        title: 'Paket Wisata Lainnya',
        href: '/packages',
        relevance: 0.6,
        type: 'package',
      });
    }
  }

  // Sort by relevance and limit
  return suggestions
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string): string[] {
  // Simple keyword extraction
  // TODO: Implement better NLP-based keyword extraction
  const words = text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);

  // Remove common words
  const stopWords = [
    'yang',
    'untuk',
    'dengan',
    'dari',
    'ini',
    'itu',
    'adalah',
    'akan',
    'atau',
    'juga',
    'dapat',
    'pada',
    'sebagai',
  ];

  const keywords = words.filter((w) => !stopWords.includes(w));

  // Return unique keywords
  return Array.from(new Set(keywords)).slice(0, 10);
}

