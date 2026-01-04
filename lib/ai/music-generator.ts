/**
 * AI Music Reference Generator
 * Generate music playlist references based on trip context
 */

import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';
import type { TripContext } from './trip-assistant';

export type GeneratedMusicReference = {
  name: string;
  category: string;
  description: string;
  genre?: string;
  mood?: string;
  suitable_for?: string[];
};

/**
 * Generate music playlist references based on trip context
 */
export async function generateMusicReferences(
  context: TripContext
): Promise<GeneratedMusicReference[]> {
  try {
    // Build context string
    let contextStr = `TRIP CONTEXT:
- Trip Code: ${context.tripCode || 'N/A'}
- Package: ${context.packageName || 'N/A'}
- Total Passengers: ${context.totalPax || 0}
`;

    if (context.itinerary && context.itinerary.length > 0) {
      contextStr += `\nItinerary:\n${context.itinerary.map((i) => `- ${i.time}: ${i.activity}${i.location ? ` (${i.location})` : ''}`).join('\n')}`;
    }

    // Build prompt
    const prompt = `Anda adalah AI yang membantu memberikan referensi musik untuk trip wisata. Buat 3-5 referensi playlist musik yang cocok untuk konteks trip berikut:

${contextStr}

Buat referensi playlist yang:
1. Cocok dengan suasana trip (relaxing untuk perjalanan, upbeat untuk aktivitas, ambient untuk snorkeling, dll)
2. Memiliki kategori jelas (relaxing, upbeat, ambient, traditional, etc.)
3. Include genre dan mood yang sesuai
4. Sesuai untuk berbagai momen dalam trip

Format JSON array:
[
  {
    "name": "Nama Playlist",
    "category": "relaxing" | "upbeat" | "ambient" | "traditional" | "chill",
    "description": "Deskripsi kapan dan untuk apa playlist ini cocok digunakan",
    "genre": "Genre musik (opsional)",
    "mood": "Mood/atmosfer (opsional)",
    "suitable_for": ["kapan cocok digunakan"]
  }
]

Return ONLY the JSON array, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-flash');

    try {
      // Clean response (remove markdown code blocks if any)
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const references = JSON.parse(cleaned) as GeneratedMusicReference[];

      // Validate references
      const validReferences = references
        .slice(0, 5)
        .filter((ref) => {
          // Validate required fields
          if (!ref.name || !ref.category || !ref.description) {
            return false;
          }

          // Validate category
          const validCategories = ['relaxing', 'upbeat', 'ambient', 'traditional', 'chill', 'party'];
          if (!validCategories.includes(ref.category)) {
            ref.category = 'chill'; // Default fallback
          }

          return true;
        });

      logger.info('Music references generated', {
        tripId: context.tripId,
        generatedCount: validReferences.length,
      });

      return validReferences;
    } catch (parseError) {
      logger.error('Failed to parse AI-generated music references', parseError, {
        response: response.slice(0, 500),
      });
      throw new Error('Gagal memparse referensi musik dari AI');
    }
  } catch (error) {
    logger.error('Failed to generate music references', error, {
      tripId: context.tripId,
    });
    throw new Error('Gagal menghasilkan referensi musik dari AI');
  }
}
