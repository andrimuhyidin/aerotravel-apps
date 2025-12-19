/**
 * Automated Briefing Generator
 * Generate personalized briefing points berdasarkan profil rombongan
 */

import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type BriefingContext = {
  tripId: string;
  tripCode: string;
  tripDate: string;
  packageName?: string;
  destination?: string;
  tripType?: string;
  duration?: number;
  totalPax: number;
  passengers: Array<{
    name: string;
    type: string; // 'adult', 'child', 'infant'
    age?: number;
    allergy?: string;
    specialRequest?: string;
    medicalCondition?: string;
  }>;
  itinerary?: Array<{
    time: string;
    activity: string;
    location?: string;
  }>;
  weather?: {
    temp: number;
    description: string;
    hasAlert: boolean;
  };
};

export type BriefingPoint = {
  title: string;
  points: string[];
  priority: 'high' | 'medium' | 'low';
};

export type BriefingPoints = {
  sections: BriefingPoint[];
  estimatedDuration: number; // minutes
  targetAudience: 'all' | 'elderly' | 'young' | 'families' | 'mixed';
  summary: string;
};

/**
 * Analyze passenger profile untuk determine target audience
 */
function analyzePassengerProfile(passengers: BriefingContext['passengers']): {
  targetAudience: BriefingPoints['targetAudience'];
  ageDistribution: { elderly: number; adult: number; young: number; children: number };
  hasSpecialNeeds: boolean;
  specialNeedsSummary: string[];
} {
  const ageDistribution = {
    elderly: 0, // 60+
    adult: 0, // 18-59
    young: 0, // 13-17
    children: 0, // <13
  };

  const specialNeeds: string[] = [];

  passengers.forEach((p) => {
    if (p.age) {
      if (p.age >= 60) ageDistribution.elderly++;
      else if (p.age >= 18) ageDistribution.adult++;
      else if (p.age >= 13) ageDistribution.young++;
      else ageDistribution.children++;
    } else {
      // Estimate dari type
      if (p.type === 'infant' || p.type === 'child') ageDistribution.children++;
      else if (p.type === 'adult') ageDistribution.adult++;
    }

    if (p.allergy) specialNeeds.push(`Alergi: ${p.allergy}`);
    if (p.medicalCondition) specialNeeds.push(`Kondisi medis: ${p.medicalCondition}`);
    if (p.specialRequest) specialNeeds.push(`Request khusus: ${p.specialRequest}`);
  });

  // Determine target audience
  let targetAudience: BriefingPoints['targetAudience'] = 'all';
  const total = passengers.length;

  if (ageDistribution.elderly / total > 0.4) {
    targetAudience = 'elderly';
  } else if (ageDistribution.young / total > 0.4 || (ageDistribution.young + ageDistribution.adult) / total > 0.6) {
    targetAudience = 'young';
  } else if (ageDistribution.children / total > 0.3) {
    targetAudience = 'families';
  } else if (ageDistribution.elderly > 0 && ageDistribution.children > 0) {
    targetAudience = 'mixed';
  }

  return {
    targetAudience,
    ageDistribution,
    hasSpecialNeeds: specialNeeds.length > 0,
    specialNeedsSummary: specialNeeds,
  };
}

/**
 * Generate briefing points berdasarkan trip context
 */
export async function generateBriefingPoints(
  context: BriefingContext
): Promise<BriefingPoints> {
  try {
    // Analyze passenger profile
    const profile = analyzePassengerProfile(context.passengers);

    // Build context string untuk AI
    const passengerList = context.passengers
      .map(
        (p) =>
          `- ${p.name} (${p.type}${p.age ? `, ${p.age} tahun` : ''})${p.allergy ? ` - ⚠️ Alergi: ${p.allergy}` : ''}${p.medicalCondition ? ` - ⚠️ Kondisi medis: ${p.medicalCondition}` : ''}${p.specialRequest ? ` - Request: ${p.specialRequest}` : ''}`
      )
      .join('\n');

    const itineraryStr = context.itinerary
      ? context.itinerary.map((i) => `${i.time} - ${i.activity}${i.location ? ` @ ${i.location}` : ''}`).join('\n')
      : 'Tidak ada itinerary detail';

    const weatherStr = context.weather
      ? `Cuaca: ${context.weather.description}, ${context.weather.temp}°C${context.weather.hasAlert ? ' - ⚠️ ALERT CUACA' : ''}`
      : 'Informasi cuaca tidak tersedia';

    const prompt = `Anda adalah asisten AI untuk tour guide. Generate poin-poin briefing yang dipersonalisasi untuk rombongan ini.

PROFIL ROMBONGAN:
- Total: ${context.totalPax} penumpang
- Target Audience: ${profile.targetAudience}
- Distribusi Usia: Lansia (60+): ${profile.ageDistribution.elderly}, Dewasa (18-59): ${profile.ageDistribution.adult}, Remaja (13-17): ${profile.ageDistribution.young}, Anak (<13): ${profile.ageDistribution.children}
${profile.hasSpecialNeeds ? `\n⚠️ KEBUTUHAN KHUSUS:\n${profile.specialNeedsSummary.join('\n')}` : ''}

DETAIL PENUMPANG:
${passengerList}

INFORMASI TRIP:
- Trip Code: ${context.tripCode}
- Tanggal: ${context.tripDate}
- Package: ${context.packageName || 'N/A'}
- Destination: ${context.destination || 'N/A'}
- Trip Type: ${context.tripType || 'general'}
- Durasi: ${context.duration || 1} hari
${weatherStr}

ITINERARY:
${itineraryStr}

Berdasarkan profil rombongan, generate poin-poin briefing dengan fokus:
${profile.targetAudience === 'elderly' ? '- FOKUS: Keselamatan, kecepatan yang nyaman, aksesibilitas, bantuan medis' : ''}
${profile.targetAudience === 'young' ? '- FOKUS: Aktivitas seru, spot foto, adventure, interaksi sosial' : ''}
${profile.targetAudience === 'families' ? '- FOKUS: Keselamatan anak, aktivitas ramah keluarga, waktu istirahat' : ''}
${profile.targetAudience === 'mixed' ? '- FOKUS: Keseimbangan antara keselamatan dan aktivitas, perhatian khusus untuk lansia dan anak' : ''}
${profile.hasSpecialNeeds ? '- PERHATIAN KHUSUS: Kebutuhan medis, alergi, dan request khusus' : ''}
${context.weather?.hasAlert ? '- PERHATIAN: Kondisi cuaca yang perlu diwaspadai' : ''}

Return JSON format:
{
  "sections": [
    {
      "title": "Judul section (contoh: Keselamatan, Aktivitas, Logistik)",
      "points": ["point 1", "point 2", "point 3"],
      "priority": "high" | "medium" | "low"
    }
  ],
  "estimatedDuration": 10, // menit
  "targetAudience": "${profile.targetAudience}",
  "summary": "Ringkasan singkat briefing (2-3 kalimat)"
}

Sections yang harus ada:
1. Keselamatan (priority: high) - Safety rules, emergency procedures
2. Aktivitas (priority: high/medium) - Activities sesuai profil
3. Logistik (priority: medium) - Meeting point, schedule, equipment
4. Kebutuhan Khusus (priority: high jika ada) - Hanya jika ada special needs

Return ONLY the JSON object, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-pro');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const briefing = JSON.parse(cleaned) as BriefingPoints;

      // Validate dan enhance
      return enhanceBriefingPoints(briefing, profile);
    } catch (parseError) {
      logger.error('Failed to parse briefing response', parseError, {
        tripId: context.tripId,
        responseLength: response.length,
      });
      return getFallbackBriefing(context, profile);
    }
  } catch (error) {
    logger.error('Failed to generate briefing points', error, {
      tripId: context.tripId,
    });
    return getFallbackBriefing(context, analyzePassengerProfile(context.passengers));
  }
}

/**
 * Enhance briefing points dengan validasi
 */
function enhanceBriefingPoints(
  briefing: BriefingPoints,
  profile: ReturnType<typeof analyzePassengerProfile>
): BriefingPoints {
  // Ensure required sections exist
  const requiredSections = ['Keselamatan', 'Aktivitas', 'Logistik'];
  const existingTitles = briefing.sections.map((s) => s.title.toLowerCase());

  requiredSections.forEach((required) => {
    if (!existingTitles.some((title) => title.includes(required.toLowerCase()))) {
      briefing.sections.push({
        title: required,
        points: [`Poin ${required} akan ditambahkan`],
        priority: required === 'Keselamatan' ? 'high' : 'medium',
      });
    }
  });

  // Add special needs section if needed
  if (profile.hasSpecialNeeds && !existingTitles.some((title) => title.includes('kebutuhan'))) {
    briefing.sections.push({
      title: 'Kebutuhan Khusus',
      points: profile.specialNeedsSummary,
      priority: 'high',
    });
  }

  // Ensure estimated duration is reasonable
  if (briefing.estimatedDuration < 5) briefing.estimatedDuration = 10;
  if (briefing.estimatedDuration > 30) briefing.estimatedDuration = 20;

  return briefing;
}

/**
 * Fallback briefing jika AI generation gagal
 */
function getFallbackBriefing(
  context: BriefingContext,
  profile: ReturnType<typeof analyzePassengerProfile>
): BriefingPoints {
  const sections: BriefingPoint[] = [
    {
      title: 'Keselamatan',
      points: [
        'Ikuti instruksi guide selama perjalanan',
        'Gunakan life jacket saat di perahu/kapal',
        'Jangan berpisah dari grup tanpa izin',
        'Bawa obat-obatan pribadi jika diperlukan',
      ],
      priority: 'high',
    },
    {
      title: 'Aktivitas',
      points: [
        'Nikmati aktivitas sesuai itinerary',
        'Foto dan dokumentasi diperbolehkan',
        'Hormati lingkungan dan budaya lokal',
      ],
      priority: 'medium',
    },
    {
      title: 'Logistik',
      points: [
        'Meeting point sesuai jadwal',
        'Bawa perlengkapan pribadi yang diperlukan',
        'Informasikan jika ada kebutuhan khusus',
      ],
      priority: 'medium',
    },
  ];

  if (profile.hasSpecialNeeds) {
    sections.push({
      title: 'Kebutuhan Khusus',
      points: profile.specialNeedsSummary,
      priority: 'high',
    });
  }

  return {
    sections,
    estimatedDuration: 10,
    targetAudience: profile.targetAudience,
    summary: `Briefing untuk ${context.totalPax} penumpang dengan fokus ${profile.targetAudience === 'elderly' ? 'keselamatan dan kenyamanan' : profile.targetAudience === 'young' ? 'aktivitas seru' : 'keseimbangan'}.`,
  };
}
