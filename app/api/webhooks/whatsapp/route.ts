import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';
import {
  parseWebhookPayload,
  verifyWebhookSignature,
} from '@/lib/integrations/whatsapp';

/**
 * Webhook handler untuk Meta WhatsApp Cloud API
 * Endpoint: /api/webhooks/whatsapp
 *
 * Setup webhook di Meta Developer Console:
 * https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
 */

// GET: Webhook verification (required by Meta)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('WhatsApp webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  logger.warn('WhatsApp webhook verification failed');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST: Receive messages and events
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';

    // Verify signature (optional but recommended)
    if (process.env.WHATSAPP_APP_SECRET) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        logger.warn('Invalid WhatsApp webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);

    // Parse incoming message
    const message = parseWebhookPayload(body);

    if (message) {
      logger.info('WhatsApp message received', {
        from: message.from,
        messageId: message.messageId,
      });

      // TODO: Process message dengan AeroBot (Gemini)
      // const response = await generateRAGResponse(message.message, message.from);
      // await sendTextMessage(message.from, response);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('WhatsApp webhook error', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
