/**
 * Briefing Templates Library
 * Pre-defined templates untuk common scenarios
 */

export type BriefingTemplate = {
  id: string;
  name: string;
  description: string;
  targetAudience: 'elderly' | 'young' | 'families' | 'mixed' | 'all';
  tripType: string[];
  sections: Array<{
    title: string;
    points: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
};

export const briefingTemplates: BriefingTemplate[] = [
  {
    id: 'boat-tour-elderly',
    name: 'Boat Tour - Rombongan Lansia',
    description: 'Template untuk boat tour dengan banyak peserta lansia',
    targetAudience: 'elderly',
    tripType: ['boat', 'cruise', 'snorkeling'],
    sections: [
      {
        title: 'Keselamatan',
        points: [
          'Selalu pakai life jacket selama di kapal',
          'Hindari area yang licin, pegang handrail saat berjalan',
          'Jika merasa tidak nyaman, segera informasikan ke guide',
          'Bawa obat-obatan pribadi (jika ada)',
          'Minum air cukup untuk hindari dehidrasi',
        ],
        priority: 'high',
      },
      {
        title: 'Aktivitas',
        points: [
          'Snorkeling optional - tidak wajib ikut',
          'Bisa tetap di kapal dan menikmati pemandangan',
          'Foto bersama di spot yang aman',
          'Istirahat cukup di antara aktivitas',
        ],
        priority: 'medium',
      },
      {
        title: 'Logistik',
        points: [
          'Meeting point: Dermaga utama jam 08:00',
          'Bawa perlengkapan pribadi (kacamata, topi, sunscreen)',
          'Makan siang disediakan di kapal',
          'Estimasi kembali: 17:00',
        ],
        priority: 'medium',
      },
    ],
  },
  {
    id: 'boat-tour-young',
    name: 'Boat Tour - Rombongan Muda',
    description: 'Template untuk boat tour dengan peserta muda',
    targetAudience: 'young',
    tripType: ['boat', 'cruise', 'snorkeling'],
    sections: [
      {
        title: 'Keselamatan',
        points: [
          'Selalu pakai life jacket saat di air',
          'Jangan berenang terlalu jauh dari grup',
          'Hormati lingkungan laut (jangan sentuh karang)',
          'Ikuti instruksi guide untuk aktivitas',
        ],
        priority: 'high',
      },
      {
        title: 'Aktivitas',
        points: [
          'Snorkeling di 3 spot berbeda',
          'Jumping spot untuk foto seru',
          'Free time untuk explore dan foto',
          'Sunset viewing di spot terbaik',
        ],
        priority: 'high',
      },
      {
        title: 'Logistik',
        points: [
          'Meeting point: Dermaga jam 07:30',
          'Bawa kamera/GoPro untuk dokumentasi',
          'Makan siang + snack disediakan',
          'Estimasi kembali: 18:00',
        ],
        priority: 'medium',
      },
    ],
  },
  {
    id: 'hiking-families',
    name: 'Hiking - Rombongan Keluarga',
    description: 'Template untuk hiking dengan keluarga (ada anak-anak)',
    targetAudience: 'families',
    tripType: ['hiking', 'trekking', 'nature'],
    sections: [
      {
        title: 'Keselamatan',
        points: [
          'Anak-anak harus selalu dalam pengawasan orang tua',
          'Gunakan sepatu hiking yang nyaman',
          'Bawa air minum cukup (minimal 2L per orang)',
          'Jangan terpisah dari grup',
          'Jika lelah, istirahat dan informasikan ke guide',
        ],
        priority: 'high',
      },
      {
        title: 'Aktivitas',
        points: [
          'Trekking dengan pace yang nyaman untuk semua',
          'Foto di spot-spot menarik',
          'Nature observation (flora & fauna)',
          'Picnic di puncak',
        ],
        priority: 'medium',
      },
      {
        title: 'Logistik',
        points: [
          'Meeting point: Base camp jam 06:00',
          'Bawa bekal makanan ringan',
          'Perlengkapan: sepatu hiking, topi, sunscreen, air',
          'Estimasi kembali: 15:00',
        ],
        priority: 'medium',
      },
    ],
  },
];

/**
 * Get template by ID
 */
export function getBriefingTemplate(templateId: string): BriefingTemplate | undefined {
  return briefingTemplates.find((t) => t.id === templateId);
}

/**
 * Get templates by target audience
 */
export function getTemplatesByAudience(
  audience: BriefingTemplate['targetAudience']
): BriefingTemplate[] {
  return briefingTemplates.filter((t) => t.targetAudience === audience || t.targetAudience === 'all');
}

/**
 * Get templates by trip type
 */
export function getTemplatesByTripType(tripType: string): BriefingTemplate[] {
  return briefingTemplates.filter((t) =>
    t.tripType.some((type) => tripType.toLowerCase().includes(type.toLowerCase()))
  );
}
