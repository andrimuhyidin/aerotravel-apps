/**
 * WhatsApp AI Bot with RAG Integration
 * Handles customer inquiries via WhatsApp using AI
 */

import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';

export type MessageIntent = 
  | 'price_inquiry'
  | 'availability_check'
  | 'booking_status'
  | 'complaint'
  | 'general_inquiry'
  | 'unknown';

export type BotResponse = {
  text: string;
  needsHuman: boolean;
  confidence: number;
  intent: MessageIntent;
  suggestedActions?: string[];
};

const INTENT_PATTERNS: Record<MessageIntent, RegExp[]> = {
  price_inquiry: [
    /harga|berapa|biaya|tarif|price|cost|ongkos/i,
    /paket.*berapa|berapa.*paket/i,
  ],
  availability_check: [
    /tersedia|available|ada.*slot|bisa.*kapan|jadwal/i,
    /tanggal.*berapa|kapan.*bisa/i,
  ],
  booking_status: [
    /status.*booking|booking.*status|pesanan.*saya/i,
    /cek.*booking|booking.*code/i,
  ],
  complaint: [
    /keluhan|complaint|masalah|tidak.*puas|kecewa/i,
    /rugi|refund|batal|cancel/i,
  ],
  general_inquiry: [
    /info|informasi|tanya|bagaimana|gimana|apa.*itu/i,
  ],
  unknown: [],
};

const GREETING_PATTERNS = [
  /^(hai|halo|hello|hi|selamat|assalamualaikum|hey)/i,
];

const CLOSING_PATTERNS = [
  /^(terima kasih|makasih|thanks|thank you|thx|ok|oke|siap)/i,
];

/**
 * Detect the intent of a message
 */
export function detectIntent(message: string): { intent: MessageIntent; confidence: number } {
  // Check greeting first
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(message)) {
      return { intent: 'general_inquiry', confidence: 0.9 };
    }
  }

  // Check closing
  for (const pattern of CLOSING_PATTERNS) {
    if (pattern.test(message)) {
      return { intent: 'general_inquiry', confidence: 0.95 };
    }
  }

  // Check intent patterns
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (intent === 'unknown') continue;
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return { intent: intent as MessageIntent, confidence: 0.85 };
      }
    }
  }

  return { intent: 'unknown', confidence: 0.3 };
}

/**
 * Generate response based on intent
 */
async function generateIntentResponse(
  intent: MessageIntent,
  message: string,
  phoneNumber: string
): Promise<BotResponse> {
  switch (intent) {
    case 'price_inquiry':
      return {
        text: `Terima kasih telah menghubungi Aero Travel! 🌊

Kami menawarkan berbagai paket wisata:
• Paket Pahawang 2D1N: Rp 650.000/orang
• Paket Mutun 1 Day: Rp 350.000/orang
• Paket Kiluan 2D1N: Rp 750.000/orang

Harga sudah termasuk:
✅ Transportasi PP
✅ Akomodasi
✅ Makan 3x
✅ Guide lokal
✅ Alat snorkeling

Untuk info lengkap dan booking, kunjungi: aerotravel.co.id

Ada yang ingin ditanyakan lagi? 😊`,
        needsHuman: false,
        confidence: 0.9,
        intent,
        suggestedActions: ['lihat_paket', 'booking_sekarang'],
      };

    case 'availability_check':
      return {
        text: `Untuk mengecek ketersediaan trip, Anda bisa:

1️⃣ Kunjungi website kami: aerotravel.co.id
2️⃣ Pilih paket yang diinginkan
3️⃣ Cek kalender ketersediaan

Atau beritahu kami:
• Paket yang diminati
• Tanggal keberangkatan
• Jumlah peserta

Kami akan bantu cek ketersediaannya! 📅`,
        needsHuman: false,
        confidence: 0.85,
        intent,
      };

    case 'booking_status':
      return {
        text: `Untuk mengecek status booking, mohon berikan:
• Kode booking (format: BK-XXXXXX)
• Atau nama lengkap yang terdaftar

Setelah itu, admin kami akan bantu cek status pesanan Anda. 📋`,
        needsHuman: true,
        confidence: 0.75,
        intent,
      };

    case 'complaint':
      return {
        text: `Mohon maaf atas ketidaknyamanan yang Anda alami 🙏

Tim Customer Service kami akan segera menghubungi Anda untuk menangani masalah ini.

Sambil menunggu, mohon jelaskan:
• Kode booking (jika ada)
• Kronologi masalah
• Tanggal kejadian

Kami akan follow up dalam waktu 1x24 jam. Terima kasih atas kesabaran Anda.`,
        needsHuman: true,
        confidence: 0.9,
        intent,
      };

    case 'general_inquiry':
      return {
        text: `Halo! 👋 Selamat datang di Aero Travel!

Kami siap membantu Anda untuk:
• 🏝️ Info paket wisata
• 📅 Cek ketersediaan
• 💰 Tanya harga
• 📋 Cek status booking

Silakan ketik pertanyaan Anda, atau kunjungi website kami di aerotravel.co.id

Ada yang bisa kami bantu? 😊`,
        needsHuman: false,
        confidence: 0.95,
        intent,
      };

    default:
      return {
        text: `Terima kasih telah menghubungi Aero Travel! 🌊

Mohon maaf, kami belum dapat memahami pertanyaan Anda dengan baik.

Untuk pertanyaan umum, Anda bisa:
• Ketik "harga" untuk info harga paket
• Ketik "jadwal" untuk cek ketersediaan
• Ketik "booking" untuk cek status pesanan

Atau admin kami akan segera membantu Anda.`,
        needsHuman: true,
        confidence: 0.3,
        intent: 'unknown',
      };
  }
}

/**
 * Check rate limit for phone number
 */
async function checkRateLimit(phoneNumber: string): Promise<boolean> {
  // Simple rate limiting: max 10 messages per minute
  // In production, use Redis or similar
  try {
    const supabase = await createClient();
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

    const { count } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
      .eq('phone_number', phoneNumber)
      .gte('created_at', oneMinuteAgo);

    return (count || 0) < 10;
  } catch (error) {
    logger.warn('Rate limit check failed, allowing message', error);
    return true;
  }
}

/**
 * Log message to database
 */
async function logMessage(
  phoneNumber: string,
  message: string,
  response: BotResponse,
  direction: 'inbound' | 'outbound'
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from('whatsapp_messages').insert({
      phone_number: phoneNumber,
      message: message,
      direction,
      intent: response.intent,
      confidence: response.confidence,
      needs_human: response.needsHuman,
    });
  } catch (error) {
    logger.warn('Failed to log WhatsApp message', error);
  }
}

/**
 * Notify CS team about messages requiring human attention
 */
async function notifyCS(phoneNumber: string, message: string, intent: MessageIntent): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Create notification for CS team
    await supabase.from('notifications').insert({
      type: 'whatsapp_escalation',
      title: 'WhatsApp butuh follow-up',
      message: `Dari ${phoneNumber}: ${message.substring(0, 100)}...`,
      data: {
        phoneNumber,
        fullMessage: message,
        intent,
        timestamp: new Date().toISOString(),
      },
      target_roles: ['cs', 'super_admin'],
    });

    logger.info('CS notified for WhatsApp escalation', { phoneNumber, intent });
  } catch (error) {
    logger.error('Failed to notify CS', error);
  }
}

/**
 * Main function to process incoming WhatsApp messages
 */
export async function processWhatsAppMessage(
  message: string,
  phoneNumber: string
): Promise<BotResponse> {
  logger.info('Processing WhatsApp message', { phoneNumber: phoneNumber.substring(0, 6) + '***' });

  // Check rate limit
  const withinLimit = await checkRateLimit(phoneNumber);
  if (!withinLimit) {
    return {
      text: 'Mohon tunggu sebentar sebelum mengirim pesan berikutnya.',
      needsHuman: false,
      confidence: 1,
      intent: 'unknown',
    };
  }

  // Detect intent
  const { intent, confidence } = detectIntent(message);
  logger.info('Intent detected', { intent, confidence });

  // Generate response based on intent
  const response = await generateIntentResponse(intent, message, phoneNumber);

  // Log the interaction
  await logMessage(phoneNumber, message, response, 'inbound');

  // If needs human attention, notify CS
  if (response.needsHuman) {
    await notifyCS(phoneNumber, message, intent);
  }

  return response;
}

/**
 * Quick replies for common actions
 */
export const QUICK_REPLIES = {
  main_menu: {
    text: 'Menu Utama',
    options: ['Lihat Paket', 'Cek Harga', 'Booking', 'Bantuan'],
  },
  packages: {
    text: 'Pilih Paket',
    options: ['Pahawang 2D1N', 'Mutun 1 Day', 'Kiluan 2D1N', 'Private Trip'],
  },
};

