/**
 * API: AI-Powered Dynamic Greeting
 * GET /api/guide/greeting - Generate personalized greeting based on time, weather, and context
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { chat } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Get current time
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay =
      hour >= 5 && hour < 12
        ? 'pagi'
        : hour >= 12 && hour < 17
          ? 'siang'
          : hour >= 17 && hour < 21
            ? 'sore'
            : 'malam';

    // Get guide profile (use users table for full_name)
    const { data: userProfile } = await client
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .eq('role', 'guide')
      .maybeSingle();

    const guideName = userProfile?.full_name || 'Guide';

    // Get active trip
    const { data: activeTrip } = await client
      .from('trip_guides')
      .select(
        `
        trips:trip_id (
          id,
          trip_code,
          name,
          date,
          status
        )
      `,
      )
      .eq('guide_id', user.id)
      .eq('is_lead_guide', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const trip = activeTrip?.trips;
    const hasActiveTrip = trip && (trip.status === 'ongoing' || trip.status === 'upcoming');

    // Get weather data (if available)
    let weatherContext = null;
    try {
      const weatherRes = await fetch(`${request.nextUrl.origin}/api/guide/weather?lat=-5.45&lng=105.27`);
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        weatherContext = {
          temp: weatherData.current?.temp || 0,
          description: weatherData.current?.weather?.description || 'Unknown',
          main: weatherData.current?.weather?.main || 'Clear',
          hasAlert: (weatherData.alerts?.length || 0) > 0,
          alerts: weatherData.alerts || [],
        };
      }
    } catch (error) {
      logger.debug('Weather fetch failed for greeting', { error: error instanceof Error ? error.message : String(error) });
    }

    // Get today's stats
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const { data: todayTrips } = await client
      .from('trip_guides')
      .select('id')
      .eq('guide_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', todayEnd.toISOString());

    const todayTripsCount = todayTrips?.length || 0;

    // Build context for AI
    const context = {
      timeOfDay,
      hour,
      guideName,
      hasActiveTrip,
      tripName: trip?.name || trip?.trip_code || null,
      tripStatus: trip?.status || null,
      weather: weatherContext,
      todayTripsCount,
    };

    // Generate AI greeting - greeting should be short, subtitle should be informative
    const prompt = `Kamu adalah asisten AI yang ramah dan hangat untuk aplikasi tour guide. Buatkan sapaan yang personal untuk guide.

Context:
- Waktu: ${timeOfDay} (jam ${hour}:${String(now.getMinutes()).padStart(2, '0')})
- Nama Guide: ${guideName}
- Status: ${hasActiveTrip ? `Ada trip ${trip?.status === 'ongoing' ? 'yang sedang berlangsung' : 'yang akan datang'}` : 'Tidak ada trip aktif'}
${trip?.name ? `- Nama Trip: ${trip.name}` : ''}
${weatherContext ? `- Cuaca: ${weatherContext.description}, ${Math.round(weatherContext.temp)}°C${weatherContext.hasAlert ? ' (ada peringatan cuaca)' : ''}` : ''}
- Trip hari ini: ${todayTripsCount} trip

Buatkan DUA bagian dalam format JSON:

1. "greeting" (Sapaan pendek, maksimal 8 kata):
   - Hanya sapaan berdasarkan waktu (Selamat pagi/Siang/Sore/Malam atau Halo)
   - SELALU sertakan nama guide (${guideName}) di akhir sapaan
   - Gunakan 1 emoji yang sesuai (👋, ☀️, 🌅, 🌤️, 🌙, dll)
   - Contoh: "Selamat pagi, ${guideName}! ☀️"
   - Contoh: "Selamat siang, ${guideName}! 👋"
   - Contoh: "Selamat malam, ${guideName}! 🌙"
   - PENTING: Selalu sertakan nama guide di akhir sapaan, jangan tambahkan informasi lain

2. "subtitle" (Pesan lebih informatif, maksimal 2 kalimat):
   - Menyemangati dan positif
   - Bisa menyebutkan context yang relevan (cuaca, trip, aktivitas hari ini)
   - Friendly tapi tetap profesional
   - Bahasa Indonesia yang natural dan conversation
   - Contoh: "Semoga siang ini produktif! Siap untuk petualangan hari ini?"
   - Contoh: "Cuaca cerah hari ini, semoga trip-nya lancar ya!"
   - Contoh: "Masih semangat untuk trip berikutnya? Tetap jaga kesehatan!"

WAJIB return dalam format JSON yang valid, hanya JSON tanpa text lain:
{
  "greeting": "Sapaan pendek dengan emoji",
  "subtitle": "Pesan yang lebih panjang dan menyemangati"
}`;

    let greetingText: string;
    let subtitleText: string;
    
    try {
      const aiResponse = await chat(
        [{ role: 'user', content: prompt }],
        'Kamu adalah asisten AI yang ramah untuk tour guide. Return HANYA JSON valid dengan format: {"greeting": "sapaan pendek dengan emoji", "subtitle": "pesan lebih panjang"}. Jangan tambahkan text lain selain JSON.',
      );

      // Try to parse JSON response
      let parsed: { greeting?: string; subtitle?: string } | null = null;
      
      // Clean response: remove markdown code blocks if any
      let cleanedResponse = aiResponse.trim();
      cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
      cleanedResponse = cleanedResponse.trim();
      
      try {
        parsed = JSON.parse(cleanedResponse) as { greeting?: string; subtitle?: string };
      } catch {
        // Try to extract JSON from response if wrapped in text
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]) as { greeting?: string; subtitle?: string };
          } catch {
            // Ignore, use fallback
          }
        }
      }

      if (parsed?.greeting && parsed?.subtitle) {
        greetingText = parsed.greeting.trim();
        subtitleText = parsed.subtitle.trim();
      } else {
        // Fallback if parsing fails
        throw new Error('Failed to parse AI response');
      }
    } catch (error) {
      logger.warn('AI greeting generation failed, using fallback', { error, context });
      
      // Fallback to time-based greeting
      const fallbackGreetings: Record<string, string[]> = {
        pagi: [
          `Selamat pagi, ${guideName}! ☀️`,
          `Pagi yang cerah, ${guideName}! 🌅`,
          `Halo, ${guideName}! 👋`,
        ],
        siang: [
          `Selamat siang, ${guideName}! ☀️`,
          `Halo, ${guideName}! 👋`,
          `Siang yang terik, ${guideName}! 🌤️`,
        ],
        sore: [
          `Selamat sore, ${guideName}! 🌅`,
          `Sore yang indah, ${guideName}! 🌇`,
          `Halo, ${guideName}! 👋`,
        ],
        malam: [
          `Selamat malam, ${guideName}! 🌙`,
          `Malam yang tenang, ${guideName}! ⭐`,
          `Halo, ${guideName}! 👋`,
        ],
      };

      const fallbackSubtitles: Record<string, string[]> = {
        pagi: [
          'Semoga hari ini penuh dengan petualangan menyenangkan!',
          'Siap untuk memulai hari yang produktif?',
          'Hari baru, semangat baru!',
        ],
        siang: [
          'Semoga siang ini produktif! Siap untuk petualangan hari ini?',
          'Semoga aktivitas hari ini berjalan lancar!',
          'Tetap semangat ya!',
        ],
        sore: [
          'Semoga hari ini menyenangkan!',
          'Masih semangat untuk trip berikutnya?',
          'Terima kasih sudah bekerja keras hari ini!',
        ],
        malam: [
          'Istirahat yang cukup ya!',
          'Semoga besok lebih baik lagi!',
          'Terima kasih untuk hari ini!',
        ],
      };

      const greetings = fallbackGreetings[timeOfDay] || fallbackGreetings.pagi || [];
      const subtitles = fallbackSubtitles[timeOfDay] || fallbackSubtitles.pagi || [];
      
      greetingText = greetings[Math.floor(Math.random() * greetings.length)] || `Halo, ${guideName}! 👋`;
      subtitleText = subtitles[Math.floor(Math.random() * subtitles.length)] || 'Siap untuk petualangan hari ini?';
    }

    return NextResponse.json({
      greeting: greetingText,
      subtitle: subtitleText,
      timeOfDay,
      context,
    });
    } catch (error) {
      logger.error('Failed to generate greeting', error, { userId: user.id });
    // Ultimate fallback
    const hour = new Date().getHours();
    const timeOfDay =
      hour >= 5 && hour < 12
        ? 'pagi'
        : hour >= 12 && hour < 17
          ? 'siang'
          : hour >= 17 && hour < 21
            ? 'sore'
            : 'malam';

    const { data: userProfile } = await client
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .eq('role', 'guide')
      .maybeSingle();
    
    const guideName = userProfile?.full_name || 'Guide';

    return NextResponse.json({
      greeting: `Halo, ${guideName}! 👋`,
      subtitle: 'Siap untuk petualangan hari ini?',
      timeOfDay,
      context: null,
    });
  }
});

