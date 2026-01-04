/**
 * Notification Template Service
 * Fetch and process notification templates (WhatsApp, SMS, Push) from database
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import { substituteVariables } from './utils';

// ============================================
// TYPES
// ============================================

export type NotificationChannel = 'whatsapp' | 'sms' | 'push';

export interface NotificationTemplate {
  id: string;
  template_key: string;
  name: string;
  message_template: string;
  variables: string[];
  channel: NotificationChannel;
  is_active: boolean;
}

// ============================================
// DEFAULT TEMPLATES (Fallback)
// ============================================

const DEFAULT_TEMPLATES: Record<string, Omit<NotificationTemplate, 'id' | 'is_active'>> = {
  sos_alert: {
    template_key: 'sos_alert',
    name: 'SOS Alert ke Admin',
    message_template: `🚨 *ALERT SOS DITERIMA* 🚨

*Jenis:* {{incident_type}}
*Guide:* {{guide_name}}
*Trip:* {{trip_name}}

📍 *Lokasi:* {{maps_link}}

🕐 *Waktu:* {{timestamp}}

⚡ SEGERA TINDAK LANJUTI!
📞 Hubungi: {{guide_phone}}`,
    variables: ['incident_type', 'guide_name', 'trip_name', 'maps_link', 'timestamp', 'guide_phone'],
    channel: 'whatsapp',
  },
  guide_absence: {
    template_key: 'guide_absence',
    name: 'Guide Absence Notification',
    message_template: `⚠️ *GUIDE ABSENT DETECTED* ⚠️

*Guide:* {{guide_name}}
*Trip:* {{trip_code}}
*Meeting Time:* {{meeting_time}}
*Minutes Late:* {{minutes_late}} menit

Guide belum melakukan check-in 15 menit setelah meeting time.

Mohon segera ditindaklanjuti.`,
    variables: ['guide_name', 'trip_code', 'meeting_time', 'minutes_late'],
    channel: 'whatsapp',
  },
};

// ============================================
// CACHE
// ============================================

const templateCache = new Map<string, { template: NotificationTemplate; cachedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedTemplate(key: string): NotificationTemplate | null {
  const cached = templateCache.get(key);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.template;
  }
  return null;
}

function setCachedTemplate(key: string, template: NotificationTemplate): void {
  templateCache.set(key, { template, cachedAt: Date.now() });
}

/**
 * Clear template cache (call after admin updates template)
 */
export function clearNotificationTemplateCache(key?: string): void {
  if (key) {
    templateCache.delete(key);
  } else {
    templateCache.clear();
  }
}

// ============================================
// TEMPLATE FETCHER
// ============================================

/**
 * Get notification template from database with fallback to defaults
 */
export async function getNotificationTemplate(
  templateKey: string
): Promise<NotificationTemplate | null> {
  // Check cache first
  const cached = getCachedTemplate(templateKey);
  if (cached) {
    return cached;
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      // Return default template if available
      const defaultTemplate = DEFAULT_TEMPLATES[templateKey];
      if (defaultTemplate) {
        return {
          ...defaultTemplate,
          id: 'default',
          is_active: true,
        };
      }
      return null;
    }

    const template: NotificationTemplate = {
      id: data.id as string,
      template_key: data.template_key as string,
      name: data.name as string,
      message_template: data.message_template as string,
      variables: (data.variables as string[]) || [],
      channel: data.channel as NotificationChannel,
      is_active: data.is_active as boolean,
    };

    setCachedTemplate(templateKey, template);
    return template;
  } catch (error) {
    logger.error('Failed to fetch notification template', error, { templateKey });

    // Return default template if available
    const defaultTemplate = DEFAULT_TEMPLATES[templateKey];
    if (defaultTemplate) {
      return {
        ...defaultTemplate,
        id: 'default',
        is_active: true,
      };
    }
    return null;
  }
}

/**
 * Get all notification templates
 */
export async function getAllNotificationTemplates(): Promise<NotificationTemplate[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch notification templates', error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id as string,
      template_key: item.template_key as string,
      name: item.name as string,
      message_template: item.message_template as string,
      variables: (item.variables as string[]) || [],
      channel: item.channel as NotificationChannel,
      is_active: item.is_active as boolean,
    }));
  } catch (error) {
    logger.error('Failed to fetch notification templates', error);
    return [];
  }
}

// ============================================
// TEMPLATE PROCESSOR
// ============================================

/**
 * Process notification template with variables
 */
export async function processNotificationTemplate(
  templateKey: string,
  variables: Record<string, string | number | undefined | null>
): Promise<string | null> {
  const template = await getNotificationTemplate(templateKey);

  if (!template) {
    logger.warn('Notification template not found', { templateKey });
    return null;
  }

  return substituteVariables(template.message_template, variables);
}

/**
 * Process notification template with fallback message
 * If template not found, use provided fallback
 */
export async function processNotificationTemplateWithFallback(
  templateKey: string,
  variables: Record<string, string | number | undefined | null>,
  fallbackMessage: string
): Promise<string> {
  const processed = await processNotificationTemplate(templateKey, variables);

  if (processed) {
    return processed;
  }

  // Use fallback with variable substitution
  return substituteVariables(fallbackMessage, variables);
}

