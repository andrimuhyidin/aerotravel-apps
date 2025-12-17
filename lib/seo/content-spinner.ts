/**
 * AI Content Spinner untuk Programmatic SEO
 * Sesuai PRD 5.2.C - AI Content Spinner (SEO Generator)
 * PRD 5.3.A - Programmatic SEO Architecture
 *
 * Generate konten unik untuk setiap kombinasi paket + kota asal
 * Menghindari duplicate content penalty dari Google
 */

import { chat } from '@/lib/gemini';

export type ContentSpinnerParams = {
  packageName: string;
  packageDescription: string;
  originCity: string;
  destination: string;
  price?: number;
};

export type SpunContent = {
  title: string;
  description: string;
  metaDescription: string;
  h1: string;
  h2: string[];
  content: string;
  keywords: string[];
};

/**
 * Generate unique content untuk kombinasi paket + kota asal
 */
export async function spinContent(
  params: ContentSpinnerParams
): Promise<SpunContent> {
  const prompt = buildSpinnerPrompt(params);

  const systemPrompt = `Anda adalah SEO Content Writer untuk travel agency.
Tugas Anda: Menulis konten unik dan SEO-friendly untuk landing page paket wisata.
Konten harus natural, informatif, dan tidak terlihat seperti template.
Hindari duplicate content - setiap kombinasi kota asal harus menghasilkan konten yang berbeda.

Format output: JSON dengan struktur:
{
  "title": "Judul SEO-friendly (60 karakter)",
  "description": "Deskripsi singkat (150 karakter)",
  "metaDescription": "Meta description untuk SEO (160 karakter)",
  "h1": "Heading utama",
  "h2": ["Subheading 1", "Subheading 2", "Subheading 3"],
  "content": "Paragraf konten lengkap (minimal 300 kata)",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    {
      role: 'user',
      content: prompt,
    },
  ];

  const content = await chat(messages, systemPrompt);

  try {
    // Extract JSON dari response (bisa ada markdown code block)
    const jsonMatch =
      content.match(/```json\s*([\s\S]*?)\s*```/) ||
      content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
    const spun = JSON.parse(jsonStr) as SpunContent;

    return spun;
  } catch (error) {
    console.error('Content spinner parsing error:', error);
    // Fallback content
    return generateFallbackContent(params);
  }
}

function buildSpinnerPrompt(params: ContentSpinnerParams): string {
  return `Buat konten SEO untuk landing page paket wisata:

Paket: ${params.packageName}
Destinasi: ${params.destination}
Kota Asal: ${params.originCity}
${params.price ? `Harga: Rp ${params.price.toLocaleString('id-ID')}` : ''}

Deskripsi Paket:
${params.packageDescription}

Tulis konten yang:
1. Menekankan perjalanan dari ${params.originCity} ke ${params.destination}
2. Menyebutkan keuntungan booking dari ${params.originCity}
3. Natural dan tidak terlihat seperti template
4. SEO-friendly dengan keyword yang relevan
5. Minimal 300 kata untuk konten utama`;
}

function generateFallbackContent(params: ContentSpinnerParams): SpunContent {
  return {
    title: `Paket Wisata ${params.packageName} dari ${params.originCity}`,
    description: `Nikmati perjalanan ke ${params.destination} dengan paket wisata terbaik dari ${params.originCity}`,
    metaDescription: `Paket wisata ${params.packageName} dari ${params.originCity}. Destinasi ${params.destination} dengan harga terbaik.`,
    h1: `Paket Wisata ${params.packageName} dari ${params.originCity}`,
    h2: [
      `Mengapa Pilih Paket ${params.packageName}?`,
      `Itinerary Perjalanan`,
      `Fasilitas yang Didapat`,
    ],
    content: `Paket wisata ${params.packageName} adalah pilihan tepat untuk Anda yang ingin berlibur ke ${params.destination} dari ${params.originCity}. Dengan paket ini, Anda akan mendapatkan pengalaman liburan yang tak terlupakan dengan harga yang terjangkau.`,
    keywords: [
      `paket wisata ${params.packageName}`,
      `wisata dari ${params.originCity}`,
      `destinasi ${params.destination}`,
    ],
  };
}

/**
 * Generate multiple content variations untuk batch processing
 */
export async function batchSpinContent(
  packages: Array<{ id: string; name: string; description: string }>,
  cities: string[]
): Promise<Map<string, SpunContent>> {
  const results = new Map<string, SpunContent>();

  for (const pkg of packages) {
    for (const city of cities) {
      const key = `${pkg.id}-${city}`;
      try {
        const content = await spinContent({
          packageName: pkg.name,
          packageDescription: pkg.description,
          originCity: city,
          destination: pkg.name,
        });
        results.set(key, content);
      } catch (error) {
        console.error(`Error spinning content for ${key}:`, error);
      }
    }
  }

  return results;
}
