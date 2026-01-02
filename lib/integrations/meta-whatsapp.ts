/**
 * Meta WhatsApp Business API Integration
 * For fetching and managing WhatsApp message templates
 */

import { env } from '@/lib/env';
import { logger } from '@/lib/utils/logger';

export type MetaTemplateComponent = {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: {
    header_text?: string[];
    body_text?: string[][];
  };
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
};

export type MetaTemplate = {
  name: string;
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DISABLED';
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  id?: string;
  components?: MetaTemplateComponent[];
};

export type MetaTemplatesResponse = {
  data: MetaTemplate[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
};

// Default/mock templates for when API is not available
const DEFAULT_TEMPLATES: MetaTemplate[] = [
  {
    name: 'promo_package',
    language: 'id',
    status: 'APPROVED',
    category: 'MARKETING',
  },
  {
    name: 'booking_reminder',
    language: 'id',
    status: 'APPROVED',
    category: 'UTILITY',
  },
  {
    name: 'payment_reminder',
    language: 'id',
    status: 'APPROVED',
    category: 'UTILITY',
  },
  {
    name: 'trip_departure',
    language: 'id',
    status: 'APPROVED',
    category: 'UTILITY',
  },
  {
    name: 'new_package_launch',
    language: 'id',
    status: 'APPROVED',
    category: 'MARKETING',
  },
  {
    name: 'loyalty_reward',
    language: 'id',
    status: 'APPROVED',
    category: 'MARKETING',
  },
];

/**
 * Check if Meta WhatsApp API is configured
 */
export function isMetaApiConfigured(): boolean {
  return !!(env.META_ACCESS_TOKEN && env.META_BUSINESS_ID);
}

/**
 * Fetch message templates from Meta WhatsApp Business API
 * Falls back to default templates if API is not configured
 */
export async function fetchMetaTemplates(): Promise<{
  templates: MetaTemplate[];
  source: 'api' | 'default';
}> {
  // Check if API is configured
  if (!isMetaApiConfigured()) {
    logger.info('Meta WhatsApp API not configured, using default templates');
    return {
      templates: DEFAULT_TEMPLATES,
      source: 'default',
    };
  }

  try {
    const businessId = env.META_BUSINESS_ID;
    const accessToken = env.META_ACCESS_TOKEN;

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${businessId}/message_templates?fields=name,language,status,category,components`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        next: {
          revalidate: 3600, // Cache for 1 hour
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Meta API request failed', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      // Fallback to default templates
      return {
        templates: DEFAULT_TEMPLATES,
        source: 'default',
      };
    }

    const data = (await response.json()) as MetaTemplatesResponse;

    // Filter to only show approved templates
    const approvedTemplates = data.data.filter(
      (template) => template.status === 'APPROVED'
    );

    logger.info('Fetched Meta WhatsApp templates', {
      total: data.data.length,
      approved: approvedTemplates.length,
    });

    return {
      templates: approvedTemplates,
      source: 'api',
    };
  } catch (error) {
    logger.error('Failed to fetch Meta WhatsApp templates', error);

    // Fallback to default templates
    return {
      templates: DEFAULT_TEMPLATES,
      source: 'default',
    };
  }
}

/**
 * Get a specific template by name
 */
export async function getTemplateByName(
  templateName: string
): Promise<MetaTemplate | null> {
  const { templates } = await fetchMetaTemplates();
  return templates.find((t) => t.name === templateName) || null;
}

/**
 * Send a template message via Meta WhatsApp Business API
 * Note: This requires additional setup for phone number and messaging
 */
export async function sendTemplateMessage(params: {
  to: string; // Phone number in international format (e.g., 6281234567890)
  templateName: string;
  languageCode?: string;
  components?: Array<{
    type: 'header' | 'body' | 'button';
    parameters: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
      text?: string;
      currency?: { code: string; fallback_value: string; amount_1000: number };
      date_time?: { fallback_value: string };
      image?: { link: string };
      document?: { link: string; filename?: string };
      video?: { link: string };
    }>;
  }>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isMetaApiConfigured() || !env.META_PHONE_NUMBER_ID) {
    logger.warn('Meta WhatsApp API not fully configured for sending messages');
    return {
      success: false,
      error: 'WhatsApp API not configured',
    };
  }

  try {
    const phoneNumberId = env.META_PHONE_NUMBER_ID;
    const accessToken = env.META_ACCESS_TOKEN;

    const payload = {
      messaging_product: 'whatsapp',
      to: params.to.replace(/\D/g, ''), // Remove non-digits
      type: 'template',
      template: {
        name: params.templateName,
        language: {
          code: params.languageCode || 'id',
        },
        components: params.components || [],
      },
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Failed to send WhatsApp template message', {
        status: response.status,
        error: errorData,
        to: params.to,
        template: params.templateName,
      });

      return {
        success: false,
        error: errorData.error?.message || 'Failed to send message',
      };
    }

    const result = await response.json();

    logger.info('WhatsApp template message sent', {
      to: params.to,
      template: params.templateName,
      messageId: result.messages?.[0]?.id,
    });

    return {
      success: true,
      messageId: result.messages?.[0]?.id,
    };
  } catch (error) {
    logger.error('Error sending WhatsApp template message', error, {
      to: params.to,
      template: params.templateName,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

