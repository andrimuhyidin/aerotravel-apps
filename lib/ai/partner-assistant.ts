/**
 * AI Partner Assistant (Agency Copilot)
 * BRD 10 - AI Travel Assistant (chatbot)
 * Helps travel agents with product questions, package comparisons, and booking assistance
 */

import { retrieveContextWithVector } from '@/lib/ai/rag';
import { chat } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';

export type PartnerContext = {
  partnerId: string;
  branchId?: string | null;
  recentBookings?: Array<{
    bookingCode: string;
    packageName: string;
    tripDate: string;
    status: string;
  }>;
  favoritePackages?: Array<{
    id: string;
    name: string;
    destination: string;
  }>;
};

const SYSTEM_PROMPT = `You are AeroBot, an AI assistant for travel agents using the Aero Partner Portal.
You help travel agents with:
- Product questions (packages, destinations, pricing, inclusions)
- Package comparisons
- Booking assistance
- Pricing and availability queries
- General travel information

Your knowledge base includes:
- All Aero travel packages with detailed information
- Pricing tiers (B2B NTA prices)
- Package inclusions/exclusions
- Child policy and age limits
- Seasonality and availability
- Booking policies and terms

Guidelines:
1. Answer questions based on package data and knowledge base
2. Be helpful and professional
3. If you don't know something, say so clearly
4. Always respond in Indonesian (Bahasa Indonesia) unless asked otherwise
5. For pricing, mention it's B2B NTA (Net To Agent) pricing
6. Encourage agents to check availability calendar for specific dates

Be concise but informative. Travel agents are busy and need quick, accurate answers.`;

/**
 * Detect if question is product-specific
 */
function isProductQuestion(question: string): boolean {
  const productKeywords = [
    'paket',
    'package',
    'harga',
    'price',
    'include',
    'termasuk',
    'usia',
    'age',
    'itinerary',
    'jadwal',
    'custom',
    'kustom',
  ];
  const lowerQuestion = question.toLowerCase();
  return productKeywords.some((keyword) => lowerQuestion.includes(keyword));
}

/**
 * Chat with AI assistant for partner/agency
 * @param question - User question
 * @param context - Partner context (optional)
 */
export async function chatPartnerAssistant(
  question: string,
  context?: PartnerContext
): Promise<string> {
  // If question seems product-specific, suggest using product Q&A
  if (isProductQuestion(question) && !context?.favoritePackages?.length) {
    return 'Pertanyaan Anda sepertinya tentang produk spesifik. Silakan gunakan fitur Q&A di halaman detail paket untuk jawaban yang lebih akurat.';
  }
  try {
    // Retrieve relevant package data using RAG
    const ragContext = await retrieveContextWithVector(
      question,
      context?.branchId || null,
      0.7,
      5
    );

    // Build context string
    let contextString = '';

    if (context) {
      if (context.recentBookings && context.recentBookings.length > 0) {
        contextString += '\nRECENT BOOKINGS:\n';
        context.recentBookings.slice(0, 5).forEach((booking) => {
          contextString += `- ${booking.bookingCode}: ${booking.packageName} (${booking.tripDate}) - ${booking.status}\n`;
        });
      }

      if (context.favoritePackages && context.favoritePackages.length > 0) {
        contextString += '\nFAVORITE PACKAGES:\n';
        context.favoritePackages.slice(0, 5).forEach((pkg) => {
          contextString += `- ${pkg.name} (${pkg.destination})\n`;
        });
      }
    }

    // Add RAG context (packages and documents)
    if (ragContext.packagePrices && ragContext.packagePrices.length > 0) {
      contextString += '\n\nRELEVANT PACKAGES:\n';
      ragContext.packagePrices.forEach((pkg: unknown, idx: number) => {
        const p = pkg as {
          package_name?: string;
          destination?: string;
          price_nta?: number;
          min_pax?: number;
          max_pax?: number;
        };
        contextString += `${idx + 1}. ${p.package_name || 'Package'} - ${p.destination || 'Destination'}\n`;
        contextString += `   NTA Price: Rp ${(p.price_nta || 0).toLocaleString('id-ID')}/pax\n`;
        contextString += `   Pax Range: ${p.min_pax || 0}-${p.max_pax || 0}\n\n`;
      });
    }

    if (ragContext.documents && ragContext.documents.length > 0) {
      contextString += '\n\nRELEVANT INFORMATION:\n';
      ragContext.documents.forEach((doc: unknown, idx: number) => {
        const d = doc as { title?: string; content?: string };
        contextString += `${idx + 1}. ${d.title || 'Document'}\n`;
        contextString += `${(d.content || '').slice(0, 300)}${(d.content || '').length > 300 ? '...' : ''}\n\n`;
      });
    }

    // Build prompt
    const prompt = `${contextString}

Agent Question: ${question}

Please provide a helpful answer based on the information above.`;

    // Call Gemini AI
    const response = await chat(
      [{ role: 'user', content: prompt }],
      SYSTEM_PROMPT,
      'gemini-1.5-flash' // Use flash for faster responses
    );

    logger.info('AI Partner Assistant response generated', {
      questionLength: question.length,
      hasContext: !!context,
      packagesFound: ragContext.packagePrices?.length || 0,
      documentsFound: ragContext.documents?.length || 0,
    });

    return response || 'Maaf, tidak bisa menjawab pertanyaan Anda saat ini. Silakan hubungi customer service.';
  } catch (error) {
    logger.error('AI Partner Assistant error', error, {
      question,
      hasContext: !!context,
    });
    return 'Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi atau hubungi customer service.';
  }
}

/**
 * Get partner context for AI assistant
 */
export async function getPartnerContext(partnerId: string): Promise<PartnerContext> {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    // Get partner info
    const { data: partner } = await client
      .from('users')
      .select('id, branch_id')
      .eq('id', partnerId)
      .single();

    // Get recent bookings (last 5)
    const { data: recentBookings } = await client
      .from('bookings')
      .select(`
        booking_code,
        trip_date,
        status,
        package:packages(name)
      `)
      .eq('mitra_id', partnerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get favorite packages (most booked, top 5)
    const { data: favoritePackages } = await client
      .from('bookings')
      .select(`
        package_id,
        package:packages(id, name, destination)
      `)
      .eq('mitra_id', partnerId)
      .is('deleted_at', null)
      .not('package_id', 'is', null)
      .limit(100); // Get more to calculate favorites

    // Count package bookings
    const packageCounts = new Map<string, { count: number; pkg: unknown }>();
    favoritePackages?.forEach((booking: { package_id: string; package: unknown }) => {
      if (booking.package_id && booking.package) {
        const current = packageCounts.get(booking.package_id) || { count: 0, pkg: booking.package };
        packageCounts.set(booking.package_id, { count: current.count + 1, pkg: current.pkg });
      }
    });

    // Sort by count and take top 5
    const topPackages = Array.from(packageCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => {
        const pkg = item.pkg as { id: string; name: string; destination: string };
        return {
          id: pkg.id,
          name: pkg.name,
          destination: pkg.destination,
        };
      });

    return {
      partnerId,
      branchId: partner?.branch_id || null,
      recentBookings: recentBookings?.map((b: {
        booking_code: string;
        trip_date: string;
        status: string;
        package: { name: string } | null;
      }) => ({
        bookingCode: b.booking_code,
        packageName: b.package?.name || 'Unknown Package',
        tripDate: b.trip_date,
        status: b.status,
      })) || [],
      favoritePackages: topPackages,
    };
  } catch (error) {
    logger.error('Failed to get partner context', error, { partnerId });
    return {
      partnerId,
      branchId: null,
      recentBookings: [],
      favoritePackages: [],
    };
  }
}

