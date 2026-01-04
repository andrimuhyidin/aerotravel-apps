/**
 * Product Q&A Engine
 * BRD 10 - AI Q&A on Products
 * Answers product-specific questions based on package data
 */

import { retrieveContextWithVector } from '@/lib/ai/rag';
import { chat } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';

export type ProductQuestion = {
  question: string;
  packageId: string;
  context?: {
    partnerId?: string;
    branchId?: string | null;
  };
};

export type ProductAnswer = {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  sources?: Array<{
    type: 'package_data' | 'faq' | 'documentation';
    reference: string;
  }>;
  suggestedQuestions?: string[];
};

const SYSTEM_PROMPT = `You are an AI assistant helping travel agents answer questions about travel packages.
You have access to detailed package information including:
- Package details (name, destination, duration, inclusions, exclusions)
- Pricing information (NTA prices, tiers)
- Age limits and child policy
- Itinerary and activities
- Terms and conditions
- FAQ data

Your role:
1. Answer questions accurately based on package data
2. Be specific and helpful
3. If information is not available, say so clearly
4. Always respond in Indonesian (Bahasa Indonesia) unless asked otherwise
5. For pricing questions, mention it's B2B NTA pricing

Guidelines:
- Age limits: Check package child_policy data
- Inclusions: List what's included in the package
- Custom itinerary: Explain if customization is possible
- Pricing: Reference NTA prices and tiers
- Availability: Direct to availability calendar

Be concise but informative.`;

/**
 * Get package data for context
 */
async function getPackageData(packageId: string): Promise<{
  name: string;
  destination: string;
  description: string | null;
  durationDays: number;
  durationNights: number;
  minPax: number;
  maxPax: number;
  childMinAge: number | null;
  childMaxAge: number | null;
  infantMaxAge: number | null;
  childDiscountPercent: number | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  itinerary: unknown;
  packagePrices: Array<{
    minPax: number;
    maxPax: number;
    priceNTA: number;
    pricePublish: number;
  }>;
} | null> {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    const { data: packageData, error } = await client
      .from('packages')
      .select(`
        id,
        name,
        destination,
        description,
        duration_days,
        duration_nights,
        min_pax,
        max_pax,
        child_min_age,
        child_max_age,
        infant_max_age,
        child_discount_percent,
        inclusions,
        exclusions,
        itinerary,
        package_prices(
          min_pax,
          max_pax,
          price_nta,
          price_publish
        )
      `)
      .eq('id', packageId)
      .single();

    if (error || !packageData) {
      logger.warn('Package not found for Q&A', { packageId, error });
      return null;
    }

    return {
      name: packageData.name,
      destination: packageData.destination,
      description: packageData.description,
      durationDays: packageData.duration_days,
      durationNights: packageData.duration_nights,
      minPax: packageData.min_pax,
      maxPax: packageData.max_pax,
      childMinAge: packageData.child_min_age,
      childMaxAge: packageData.child_max_age,
      infantMaxAge: packageData.infant_max_age,
      childDiscountPercent: packageData.child_discount_percent,
      inclusions: packageData.inclusions,
      exclusions: packageData.exclusions,
      itinerary: packageData.itinerary,
      packagePrices: (packageData.package_prices || []).map((p: unknown) => {
        const price = p as {
          min_pax: number;
          max_pax: number;
          price_nta: number;
          price_publish: number;
        };
        return {
          minPax: price.min_pax,
          maxPax: price.max_pax,
          priceNTA: Number(price.price_nta),
          pricePublish: Number(price.price_publish),
        };
      }),
    };
  } catch (error) {
    logger.error('Failed to get package data for Q&A', error, { packageId });
    return null;
  }
}

/**
 * Detect question type untuk better context
 */
function detectQuestionType(question: string): {
  type: 'age_limit' | 'inclusions' | 'pricing' | 'itinerary' | 'custom' | 'general';
  keywords: string[];
} {
  const lowerQuestion = question.toLowerCase();

  if (/(usia|age|umur|batas|limit)/i.test(lowerQuestion)) {
    return { type: 'age_limit', keywords: ['age', 'limit', 'usia', 'umur'] };
  }

  if (/(include|termasuk|dalam|apa saja|fasilitas)/i.test(lowerQuestion)) {
    return { type: 'inclusions', keywords: ['include', 'inclusions', 'termasuk'] };
  }

  if (/(harga|price|biaya|cost|nta|publish)/i.test(lowerQuestion)) {
    return { type: 'pricing', keywords: ['price', 'harga', 'biaya'] };
  }

  if (/(itinerary|jadwal|schedule|aktivitas|activity)/i.test(lowerQuestion)) {
    return { type: 'itinerary', keywords: ['itinerary', 'jadwal', 'aktivitas'] };
  }

  if (/(custom|kustom|ubah|modify|tambah|add)/i.test(lowerQuestion)) {
    return { type: 'custom', keywords: ['custom', 'kustom', 'ubah'] };
  }

  return { type: 'general', keywords: [] };
}

/**
 * Answer product question dengan package context
 */
export async function answerProductQuestion(
  question: ProductQuestion
): Promise<ProductAnswer> {
  try {
    // Get package data
    const packageData = await getPackageData(question.packageId);

    if (!packageData) {
      return {
        answer: 'Maaf, paket tidak ditemukan. Silakan coba lagi atau hubungi customer service.',
        confidence: 'low',
      };
    }

    // Detect question type
    const questionType = detectQuestionType(question.question);

    // Build package context string
    let packageContext = `PACKAGE INFORMATION:\n`;
    packageContext += `Name: ${packageData.name}\n`;
    packageContext += `Destination: ${packageData.destination}\n`;
    packageContext += `Duration: ${packageData.durationDays} days, ${packageData.durationNights} nights\n`;
    packageContext += `Pax Range: ${packageData.minPax}-${packageData.maxPax} pax\n`;

    if (packageData.description) {
      packageContext += `Description: ${packageData.description}\n`;
    }

    // Age limits
    if (packageData.childMinAge !== null || packageData.childMaxAge !== null) {
      packageContext += `Child Policy:\n`;
      if (packageData.childMinAge !== null) {
        packageContext += `  - Child age: ${packageData.childMinAge}-${packageData.childMaxAge || 'N/A'} years\n`;
      }
      if (packageData.infantMaxAge !== null) {
        packageContext += `  - Infant age: 0-${packageData.infantMaxAge} years (free)\n`;
      }
      if (packageData.childDiscountPercent !== null) {
        packageContext += `  - Child discount: ${packageData.childDiscountPercent}%\n`;
      }
    }

    // Inclusions
    if (packageData.inclusions && packageData.inclusions.length > 0) {
      packageContext += `Inclusions:\n`;
      packageData.inclusions.forEach((inc) => {
        packageContext += `  - ${inc}\n`;
      });
    }

    // Exclusions
    if (packageData.exclusions && packageData.exclusions.length > 0) {
      packageContext += `Exclusions:\n`;
      packageData.exclusions.forEach((exc) => {
        packageContext += `  - ${exc}\n`;
      });
    }

    // Pricing
    if (packageData.packagePrices.length > 0) {
      packageContext += `Pricing (B2B NTA):\n`;
      packageData.packagePrices.forEach((price) => {
        packageContext += `  - ${price.minPax}-${price.maxPax} pax: Rp ${price.priceNTA.toLocaleString('id-ID')}/pax\n`;
      });
    }

    // Retrieve FAQ/documentation context jika perlu
    let faqContext = '';
    if (questionType.type === 'general' || questionType.type === 'custom') {
      try {
        const ragContext = await retrieveContextWithVector(
          question.question,
          question.context?.branchId || null,
          0.7,
          3
        );

        if (ragContext.documents && ragContext.documents.length > 0) {
          faqContext = '\n\nRELEVANT FAQ/DOCUMENTATION:\n';
          ragContext.documents.forEach((doc: unknown, idx: number) => {
            const d = doc as { title?: string; content?: string };
            faqContext += `${idx + 1}. ${d.title || 'Document'}\n`;
            faqContext += `${(d.content || '').slice(0, 300)}${(d.content || '').length > 300 ? '...' : ''}\n\n`;
          });
        }
      } catch (ragError) {
        logger.warn('RAG retrieval failed for product Q&A', {
          error: ragError,
          question: question.question,
        });
      }
    }

    // Build prompt
    const prompt = `${packageContext}${faqContext}

Question: ${question.question}

Please provide a helpful answer based on the package information above.`;

    // Generate answer
    const answer = await chat(
      [{ role: 'user', content: prompt }],
      SYSTEM_PROMPT,
      'gemini-1.5-flash'
    );

    // Determine confidence based on question type dan answer quality
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (questionType.type !== 'general' && packageData) {
      confidence = 'high';
    }
    if (answer && answer.length > 50 && !answer.toLowerCase().includes('tidak tahu')) {
      confidence = 'high';
    }

    // Generate suggested questions
    const suggestedQuestions = generateSuggestedQuestions(
      questionType.type,
      packageData
    );

    logger.info('Product Q&A answer generated', {
      packageId: question.packageId,
      questionType: questionType.type,
      confidence,
      answerLength: answer?.length || 0,
    });

    return {
      answer: answer || 'Maaf, tidak bisa menjawab pertanyaan Anda saat ini. Silakan hubungi customer service.',
      confidence,
      sources: [
        {
          type: 'package_data',
          reference: packageData.name,
        },
      ],
      suggestedQuestions,
    };
  } catch (error) {
    logger.error('Failed to answer product question', error, {
      packageId: question.packageId,
      question: question.question,
    });
    return {
      answer: 'Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi atau hubungi customer service.',
      confidence: 'low',
    };
  }
}

/**
 * Generate suggested questions based on question type
 */
function generateSuggestedQuestions(
  questionType: string,
  packageData: Awaited<ReturnType<typeof getPackageData>>
): string[] {
  if (!packageData) return [];

  const suggestions: string[] = [];

  switch (questionType) {
    case 'age_limit':
      suggestions.push('Apa saja yang termasuk dalam paket ini?');
      suggestions.push('Berapa harga paket ini?');
      break;
    case 'inclusions':
      suggestions.push('Apa saja yang tidak termasuk?');
      suggestions.push('Bisakah itinerary diubah?');
      break;
    case 'pricing':
      suggestions.push('Apakah ada diskon untuk anak-anak?');
      suggestions.push('Berapa harga untuk grup besar?');
      break;
    case 'itinerary':
      suggestions.push('Apa saja yang termasuk dalam paket?');
      suggestions.push('Bisakah menambah aktivitas?');
      break;
    default:
      suggestions.push('Berapa batas usia untuk anak-anak?');
      suggestions.push('Apa saja yang termasuk dalam paket?');
      suggestions.push('Berapa harga paket ini?');
      suggestions.push('Bisakah itinerary diubah?');
  }

  return suggestions;
}

