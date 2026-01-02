/**
 * Public Chat API Route
 * POST /api/public/chat - AI chat for public users
 * Rate limited by IP for anonymous users
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { checkRateLimit, getRequestIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/api/public-rate-limit';
import { chat } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { sanitizeInput } from '@/lib/utils/sanitize';

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting
  const identifier = getRequestIdentifier(request);
  const rateLimit = checkRateLimit(`chat:${identifier}`, RATE_LIMIT_CONFIGS.AI);
  
  if (!rateLimit.success) {
    logger.warn('Rate limit exceeded for chat', { identifier });
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment.' },
      { status: 429 }
    );
  }

  logger.info('POST /api/public/chat', { ip: identifier });

  const body = await request.json();
  const { message } = body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json(
      { error: 'Message is required' },
      { status: 400 }
    );
  }

  if (message.length > 500) {
    return NextResponse.json(
      { error: 'Message too long (max 500 characters)' },
      { status: 400 }
    );
  }

  // Sanitize user input to prevent XSS
  const sanitizedMessage = sanitizeInput(message);

  try {
    const supabase = await createClient();

    // Fetch packages for context
    const { data: packages } = await supabase
      .from('packages')
      .select(`
        id,
        name,
        slug,
        destination,
        province,
        duration_days,
        duration_nights,
        package_type,
        min_pax,
        max_pax,
        package_prices (
          min_pax,
          max_pax,
          price_publish
        )
      `)
      .eq('status', 'published')
      .limit(10);

    // Build context for AI
    const packageContext = packages?.map((pkg) => {
      const prices = pkg.package_prices as { min_pax: number; max_pax: number; price_publish: number }[] || [];
      const lowestPrice = prices.length > 0 
        ? Math.min(...prices.map((p) => p.price_publish)) 
        : 0;
      
      return {
        name: pkg.name,
        destination: pkg.destination,
        province: pkg.province,
        duration: `${pkg.duration_days}H${pkg.duration_nights}M`,
        type: pkg.package_type === 'open_trip' ? 'Open Trip' : 'Private Trip',
        pax: `${pkg.min_pax}-${pkg.max_pax} orang`,
        price: `Rp ${lowestPrice.toLocaleString('id-ID')}`,
      };
    }) || [];

    // System prompt for public AeroBot
    const systemPrompt = `Anda adalah AeroBot, asisten AI untuk Aero Travel - platform wisata terpercaya di Indonesia.

TENTANG AERO TRAVEL:
- Spesialisasi: Paket wisata ke Lampung (Pahawang, Kiluan, Way Kambas, dll)
- Jenis trip: Open Trip (gabungan) dan Private Trip (grup sendiri)
- Layanan: Booking online, pembayaran mudah, guide berpengalaman

PAKET TERSEDIA:
${JSON.stringify(packageContext, null, 2)}

PANDUAN MENJAWAB:
1. Jawab dengan ramah dan informatif dalam Bahasa Indonesia
2. Jika ditanya harga, berikan range harga dan sarankan untuk cek halaman paket
3. Jika ditanya ketersediaan tanggal, arahkan untuk booking atau hubungi CS
4. Rekomendasikan paket yang sesuai berdasarkan pertanyaan user
5. Untuk pertanyaan di luar travel, katakan tidak bisa membantu dan fokus ke wisata

CONTOH RESPONS:
- "Untuk trip ke Pahawang, kami punya paket Open Trip mulai Rp 450.000/pax..."
- "Paket keluarga? Saya rekomendasikan Private Trip agar lebih fleksibel..."

JANGAN:
- Memberikan informasi sensitif (harga internal, komisi, dll)
- Menjawab pertanyaan politik atau kontroversial
- Membuat janji yang tidak bisa dipenuhi

Jika tidak yakin, arahkan ke customer service via WhatsApp.`;

    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: sanitizedMessage },
    ];

    const response = await chat(messages, systemPrompt);

    if (!response) {
      return NextResponse.json({
        response: 'Maaf, saya tidak bisa menjawab saat ini. Silakan hubungi customer service kami.',
        remaining: rateLimit.remaining,
      });
    }

    return NextResponse.json({
      response,
      remaining: rateLimit.remaining,
    });
  } catch (error) {
    logger.error('Public chat error', error);
    return NextResponse.json({
      response: 'Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi customer service.',
      remaining: rateLimit.remaining,
    });
  }
});

