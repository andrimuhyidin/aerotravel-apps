/**
 * WhatsApp Trip Notifications Helper
 * Helper functions untuk broadcast WA ke peserta trip
 */

import { logger } from '@/lib/utils/logger';
import { sendTextMessage } from './whatsapp';

type TripInfo = {
  tripCode: string;
  tripDate: string;
  departureTime: string | null;
  meetingPoint: string;
  guideName: string | null;
  guidePhone: string | null;
  packageName: string | null;
  documentationUrl?: string | null;
};

/**
 * Send H-1 reminder (day before trip)
 */
export async function sendHMinusOneReminder(
  passengerPhone: string,
  tripInfo: TripInfo
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const dateStr = new Date(tripInfo.tripDate).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const timeStr = tripInfo.departureTime
      ? tripInfo.departureTime.slice(0, 5)
      : '07:00';

    const text = `📋 *Pengingat Trip ${tripInfo.tripCode}*

Halo! Besok Anda akan mengikuti trip:
${tripInfo.packageName || tripInfo.tripCode}

📅 Tanggal: ${dateStr}
⏰ Jam Kumpul: ${timeStr} WIB
📍 Titik Kumpul: ${tripInfo.meetingPoint}

⚠️ *Yang perlu dibawa:*
- KTP/Identitas (wajib)
- Baju ganti & perlengkapan mandi
- Sunblock & topi
- Uang tunai untuk kebutuhan pribadi

👤 Guide: ${tripInfo.guideName || 'Guide akan diinformasikan di lokasi'}${
      tripInfo.guidePhone ? `\n📱 Kontak: ${tripInfo.guidePhone}` : ''
    }

Mohon datang tepat waktu. Jika ada pertanyaan, hubungi kami.

Selamat berwisata! 🎉`;

    const result = await sendTextMessage(passengerPhone, text);
    return { success: true, messageId: result.messages[0]?.id };
  } catch (error) {
    logger.error('Failed to send H-1 reminder', error, {
      phone: passengerPhone,
      tripCode: tripInfo.tripCode,
    });
    return { success: false };
  }
}

/**
 * Send H-day reminder (1-2 hours before departure)
 */
export async function sendHDayReminder(
  passengerPhone: string,
  tripInfo: TripInfo
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const timeStr = tripInfo.departureTime
      ? tripInfo.departureTime.slice(0, 5)
      : '07:00';

    const text = `⏰ *Reminder Trip ${tripInfo.tripCode}*

Hari ini adalah hari keberangkatan!

⏰ Jam Kumpul: ${timeStr} WIB
📍 Lokasi: ${tripInfo.meetingPoint}

Jangan lupa bawa KTP dan persiapkan diri. Guide akan menunggu di titik kumpul.

Selamat berwisata! 🚢✨`;

    const result = await sendTextMessage(passengerPhone, text);
    return { success: true, messageId: result.messages[0]?.id };
  } catch (error) {
    logger.error('Failed to send H-day reminder', error, {
      phone: passengerPhone,
      tripCode: tripInfo.tripCode,
    });
    return { success: false };
  }
}

/**
 * Send post-trip message (photo album link + survey)
 */
export async function sendPostTripMessage(
  passengerPhone: string,
  tripInfo: TripInfo,
  surveyLink?: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    let text = `🎉 *Terima kasih telah mengikuti trip ${tripInfo.tripCode}!*

Kami harap perjalanan Anda menyenangkan.`;

    if (tripInfo.documentationUrl) {
      text += `\n\n📸 *Album Foto Trip:*\n${tripInfo.documentationUrl}`;
    }

    if (surveyLink) {
      text += `\n\n📝 Mohon berikan feedback Anda di:\n${surveyLink}`;
    } else {
      text +=
        '\n\n📝 Feedback Anda sangat berarti untuk kami. Silakan berikan ulasan di aplikasi.';
    }

    text += '\n\nSampai jumpa di trip berikutnya! 🌊';

    const result = await sendTextMessage(passengerPhone, text);
    return { success: true, messageId: result.messages[0]?.id };
  } catch (error) {
    logger.error('Failed to send post-trip message', error, {
      phone: passengerPhone,
      tripCode: tripInfo.tripCode,
    });
    return { success: false };
  }
}
