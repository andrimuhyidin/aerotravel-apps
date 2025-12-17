/**
 * Meta WhatsApp Cloud API Integration
 * Official WhatsApp Business API from Meta
 * Free: 1000 conversations/month
 *
 * Setup: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
 */

import { logger } from '@/lib/utils/logger';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

type MessageType = 'text' | 'template' | 'image' | 'document';

type SendMessageParams = {
  to: string; // Phone number with country code (e.g., 6281234567890)
  type: MessageType;
  text?: string;
  template?: {
    name: string;
    language: string;
    components?: unknown[];
  };
  image?: {
    link: string;
    caption?: string;
  };
  document?: {
    link: string;
    filename: string;
    caption?: string;
  };
};

type WhatsAppResponse = {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
};

function getConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp Cloud API not configured');
  }

  return { phoneNumberId, accessToken };
}

/**
 * Send WhatsApp message
 */
export async function sendMessage(
  params: SendMessageParams
): Promise<WhatsAppResponse> {
  const { phoneNumberId, accessToken } = getConfig();

  const body: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: params.to,
    type: params.type,
  };

  switch (params.type) {
    case 'text':
      body.text = { preview_url: false, body: params.text };
      break;
    case 'template':
      body.template = params.template;
      break;
    case 'image':
      body.image = params.image;
      break;
    case 'document':
      body.document = params.document;
      break;
  }

  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    logger.error('WhatsApp API error', { error });
    throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
  }

  const result = (await response.json()) as WhatsAppResponse;
  logger.info('WhatsApp message sent', { messageId: result.messages[0]?.id });
  return result;
}

/**
 * Send text message
 */
export async function sendTextMessage(to: string, text: string) {
  return sendMessage({ to, type: 'text', text });
}

/**
 * Send template message (for notifications, OTP, etc.)
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = 'id',
  components?: unknown[]
) {
  return sendMessage({
    to,
    type: 'template',
    template: {
      name: templateName,
      language: languageCode,
      components,
    },
  });
}

/**
 * Send booking confirmation
 */
export async function sendBookingConfirmation(
  to: string,
  bookingCode: string,
  packageName: string,
  departureDate: string,
  totalAmount: number
) {
  // Using template message for transactional notifications
  return sendTemplateMessage(to, 'booking_confirmation', 'id', [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: bookingCode },
        { type: 'text', text: packageName },
        { type: 'text', text: departureDate },
        { type: 'text', text: `Rp ${totalAmount.toLocaleString('id-ID')}` },
      ],
    },
  ]);
}

/**
 * Send payment reminder
 */
export async function sendPaymentReminder(
  to: string,
  bookingCode: string,
  dueDate: string,
  remainingAmount: number
) {
  return sendTemplateMessage(to, 'payment_reminder', 'id', [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: bookingCode },
        { type: 'text', text: dueDate },
        { type: 'text', text: `Rp ${remainingAmount.toLocaleString('id-ID')}` },
      ],
    },
  ]);
}

/**
 * Verify webhook signature from Meta
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    logger.warn('WHATSAPP_APP_SECRET not configured');
    return false;
  }

  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  return `sha256=${expectedSignature}` === signature;
}

/**
 * Handle incoming webhook (for receiving messages)
 */
export function parseWebhookPayload(body: unknown): {
  from: string;
  message: string;
  messageId: string;
  timestamp: number;
} | null {
  try {
    const data = body as {
      entry?: {
        changes?: {
          value?: {
            messages?: {
              from: string;
              id: string;
              timestamp: string;
              text?: { body: string };
            }[];
          };
        }[];
      }[];
    };

    const message = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return null;

    return {
      from: message.from,
      message: message.text?.body || '',
      messageId: message.id,
      timestamp: parseInt(message.timestamp, 10),
    };
  } catch {
    return null;
  }
}
