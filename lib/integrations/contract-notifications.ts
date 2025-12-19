/**
 * Contract Notifications
 * WhatsApp & in-app notifications for contract events
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { sendTextMessage } from './whatsapp';

/**
 * Send contract notification to guide via WhatsApp
 */
export async function notifyGuideContractSent(
  guidePhone: string,
  contractNumber: string,
  contractTitle: string,
  deadline?: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    let deadlineText = '';
    if (deadline) {
      const deadlineDate = new Date(deadline);
      const deadlineStr = deadlineDate.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      deadlineText = `\n⏰ *Deadline Tanda Tangan:* ${deadlineStr}\n`;
    }

    const text = `📄 *Kontrak Kerja Baru*

Anda menerima kontrak kerja baru:
*${contractNumber}*
📋 ${contractTitle}${deadlineText}
⚠️ *PENTING:* Silakan buka aplikasi Guide untuk melihat detail dan menandatangani kontrak.

Terima kasih! 🎉`;

    const result = await sendTextMessage(guidePhone, text);
    logger.info('Contract sent notification', {
      guidePhone,
      contractNumber,
      messageId: result.messages[0]?.id,
    });
    return { success: true, messageId: result.messages[0]?.id };
  } catch (error) {
    logger.error('Failed to send contract notification', error, {
      guidePhone,
      contractNumber,
    });
    return { success: false };
  }
}

/**
 * Send notification when guide signs contract
 */
export async function notifyAdminContractSigned(
  adminPhone: string,
  contractNumber: string,
  guideName: string
): Promise<{ success: boolean }> {
  try {
    const text = `✅ *Kontrak Ditandatangani*

Guide *${guideName}* telah menandatangani kontrak:
*${contractNumber}*

Silakan buka Console untuk menandatangani sebagai perusahaan.`;

    await sendTextMessage(adminPhone, text);
    logger.info('Admin notified of contract signature', {
      adminPhone,
      contractNumber,
      guideName,
    });
    return { success: true };
  } catch (error) {
    logger.error('Failed to notify admin', error, {
      adminPhone,
      contractNumber,
    });
    return { success: false };
  }
}

/**
 * Send notification when contract becomes active
 */
export async function notifyGuideContractActive(
  guidePhone: string,
  contractNumber: string,
  feeAmount: number
): Promise<{ success: boolean }> {
  try {
    const text = `🎉 *Kontrak Aktif*

Kontrak *${contractNumber}* telah aktif dan berlaku.

💰 Fee: Rp ${feeAmount.toLocaleString('id-ID')}
💳 Saldo telah ditambahkan ke wallet Anda.

Terima kasih! 🎉`;

    const result = await sendTextMessage(guidePhone, text);
    logger.info('Contract active notification sent', {
      guidePhone,
      contractNumber,
      messageId: result.messages[0]?.id,
    });
    return { success: true };
  } catch (error) {
    logger.error('Failed to send contract active notification', error, {
      guidePhone,
      contractNumber,
    });
    return { success: false };
  }
}

/**
 * Create in-app notification for guide
 */
export async function createInAppNotification(
  guideId: string,
  type: 'contract_sent' | 'contract_signed' | 'contract_active' | 'contract_expiring',
  title: string,
  message: string,
  contractId?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as any;

    await client.from('guide_notifications').insert({
      guide_id: guideId,
      type,
      title,
      message,
      is_read: false,
      metadata: contractId ? { contract_id: contractId } : {},
      created_at: new Date().toISOString(),
    });

    logger.info('In-app notification created', {
      guideId,
      type,
      contractId,
    });
  } catch (error) {
    logger.error('Failed to create in-app notification', error, {
      guideId,
      type,
    });
  }
}

/**
 * Notify contract expiring soon (7 days before)
 */
export async function notifyContractExpiring(
  guidePhone: string,
  contractNumber: string,
  expiryDate: string
): Promise<{ success: boolean }> {
  try {
    const expiryStr = new Date(expiryDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const text = `⏰ *Pengingat Kontrak*

Kontrak *${contractNumber}* akan kadaluarsa pada:
📅 ${expiryStr}

Silakan hubungi admin jika ingin memperpanjang kontrak.`;

    await sendTextMessage(guidePhone, text);
    logger.info('Contract expiring notification sent', {
      guidePhone,
      contractNumber,
    });
    return { success: true };
  } catch (error) {
    logger.error('Failed to send expiring notification', error, {
      guidePhone,
      contractNumber,
    });
    return { success: false };
  }
}
