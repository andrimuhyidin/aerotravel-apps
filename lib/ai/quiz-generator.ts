/**
 * AI Quiz Generator
 * Generate quiz questions based on trip context
 */

import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';
import type { TripContext } from './trip-assistant';

export type GeneratedQuizQuestion = {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options?: Array<{ text: string; is_correct: boolean }>;
  correct_answer?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
};

/**
 * Generate quiz questions based on trip context
 */
export async function generateQuizQuestions(
  context: TripContext,
  count: number = 5
): Promise<GeneratedQuizQuestion[]> {
  try {
    // Build context string
    let contextStr = `TRIP CONTEXT:
- Trip Code: ${context.tripCode || 'N/A'}
- Trip Date: ${context.tripDate || 'N/A'}
- Package: ${context.packageName || 'N/A'}
- Total Passengers: ${context.totalPax || 0}
`;

    if (context.itinerary && context.itinerary.length > 0) {
      contextStr += `\nItinerary:\n${context.itinerary.map((i) => `- ${i.time}: ${i.activity}${i.location ? ` (${i.location})` : ''}`).join('\n')}`;
    }

    // Build prompt
    const prompt = `Anda adalah AI yang membantu membuat quiz interaktif untuk tamu wisata. Buat ${count} pertanyaan quiz yang relevan dengan konteks trip berikut:

${contextStr}

Buat pertanyaan yang:
1. Edukatif dan menarik tentang destinasi, kehidupan laut, atau informasi umum tentang wisata
2. Sesuai untuk tamu wisata (bisa mudah hingga sedang)
3. Bisa multiple choice (4 pilihan) atau true/false
4. Mencakup berbagai kategori: destination (tentang destinasi), marine_life (kehidupan laut), safety (keselamatan), general (umum)

Format JSON array:
[
  {
    "question_text": "Pertanyaan quiz",
    "question_type": "multiple_choice" | "true_false",
    "options": [{"text": "Opsi A", "is_correct": false}, {"text": "Opsi B", "is_correct": true}, ...] (jika multiple_choice),
    "correct_answer": "True" atau "False" (jika true_false),
    "category": "destination" | "marine_life" | "safety" | "general",
    "difficulty": "easy" | "medium" | "hard",
    "explanation": "Penjelasan singkat jawaban (opsional)"
  }
]

Return ONLY the JSON array, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-flash');

    try {
      // Clean response (remove markdown code blocks if any)
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const questions = JSON.parse(cleaned) as GeneratedQuizQuestion[];

      // Validate questions
      const validQuestions = questions
        .slice(0, count)
        .filter((q) => {
          // Validate required fields
          if (!q.question_text || !q.question_type || !q.category || !q.difficulty) {
            return false;
          }

          // Validate question_type
          if (q.question_type === 'multiple_choice') {
            if (!q.options || q.options.length < 2) return false;
            // Ensure exactly one correct answer
            const correctCount = q.options.filter((opt) => opt.is_correct).length;
            if (correctCount !== 1) return false;
          } else if (q.question_type === 'true_false') {
            if (!q.correct_answer || !['True', 'False'].includes(q.correct_answer)) return false;
          }

          // Validate category
          const validCategories = ['destination', 'marine_life', 'safety', 'general'];
          if (!validCategories.includes(q.category)) {
            q.category = 'general'; // Default fallback
          }

          // Validate difficulty
          const validDifficulties = ['easy', 'medium', 'hard'];
          if (!validDifficulties.includes(q.difficulty)) {
            q.difficulty = 'medium'; // Default fallback
          }

          return true;
        });

      logger.info('Quiz questions generated', {
        tripId: context.tripId,
        requestedCount: count,
        generatedCount: validQuestions.length,
      });

      return validQuestions;
    } catch (parseError) {
      logger.error('Failed to parse AI-generated quiz questions', parseError, {
        response: response.slice(0, 500),
      });
      throw new Error('Gagal memparse hasil quiz dari AI');
    }
  } catch (error) {
    logger.error('Failed to generate quiz questions', error, {
      tripId: context.tripId,
    });
    throw new Error('Gagal menghasilkan quiz dari AI');
  }
}
