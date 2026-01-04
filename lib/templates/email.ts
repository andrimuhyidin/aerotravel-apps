/**
 * Email Template Service
 * Fetch and process email templates from database
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import { substituteWithConditionals } from './utils';

// ============================================
// TYPES
// ============================================

export interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject_template: string;
  body_html_template: string;
  body_text_template: string | null;
  variables: string[];
  is_active: boolean;
}

export interface ProcessedEmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// ============================================
// DEFAULT TEMPLATES (Fallback)
// ============================================

const DEFAULT_TEMPLATES: Record<string, Omit<EmailTemplate, 'id' | 'is_active'>> = {
  booking_confirmation: {
    template_key: 'booking_confirmation',
    name: 'Konfirmasi Booking',
    subject_template: 'Pembayaran Berhasil - {{booking_code}} | {{company_name}}',
    body_html_template: `
      <h1>Pembayaran Berhasil!</h1>
      <p>Halo {{customer_name}},</p>
      <p>Booking Anda dengan kode <strong>{{booking_code}}</strong> telah dikonfirmasi.</p>
      <p>Paket: {{package_name}}</p>
      <p>Tanggal: {{trip_date}}</p>
      <p>Total: {{total_amount}}</p>
    `,
    body_text_template: null,
    variables: ['customer_name', 'booking_code', 'package_name', 'trip_date', 'total_amount', 'company_name'],
  },
  invoice_email: {
    template_key: 'invoice_email',
    name: 'Email Invoice',
    subject_template: 'Invoice {{invoice_number}} - {{company_name}}',
    body_html_template: `
      <h1>Terima kasih atas pemesanan Anda!</h1>
      <p>Invoice <strong>{{invoice_number}}</strong> terlampir dalam email ini.</p>
      <p>Jika ada pertanyaan, silakan hubungi customer service kami.</p>
    `,
    body_text_template: null,
    variables: ['invoice_number', 'company_name'],
  },
};

// ============================================
// CACHE
// ============================================

const templateCache = new Map<string, { template: EmailTemplate; cachedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedTemplate(key: string): EmailTemplate | null {
  const cached = templateCache.get(key);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.template;
  }
  return null;
}

function setCachedTemplate(key: string, template: EmailTemplate): void {
  templateCache.set(key, { template, cachedAt: Date.now() });
}

/**
 * Clear template cache (call after admin updates template)
 */
export function clearEmailTemplateCache(key?: string): void {
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
 * Get email template from database with fallback to defaults
 */
export async function getEmailTemplate(
  templateKey: string
): Promise<EmailTemplate | null> {
  // Check cache first
  const cached = getCachedTemplate(templateKey);
  if (cached) {
    return cached;
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('email_templates')
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

    const template: EmailTemplate = {
      id: data.id as string,
      template_key: data.template_key as string,
      name: data.name as string,
      subject_template: data.subject_template as string,
      body_html_template: data.body_html_template as string,
      body_text_template: data.body_text_template as string | null,
      variables: (data.variables as string[]) || [],
      is_active: data.is_active as boolean,
    };

    setCachedTemplate(templateKey, template);
    return template;
  } catch (error) {
    logger.error('Failed to fetch email template', error, { templateKey });

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
 * Get all email templates
 */
export async function getAllEmailTemplates(): Promise<EmailTemplate[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch email templates', error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id as string,
      template_key: item.template_key as string,
      name: item.name as string,
      subject_template: item.subject_template as string,
      body_html_template: item.body_html_template as string,
      body_text_template: item.body_text_template as string | null,
      variables: (item.variables as string[]) || [],
      is_active: item.is_active as boolean,
    }));
  } catch (error) {
    logger.error('Failed to fetch email templates', error);
    return [];
  }
}

// ============================================
// TEMPLATE PROCESSOR
// ============================================

/**
 * Process email template with variables
 */
export async function processEmailTemplate(
  templateKey: string,
  variables: Record<string, string | number | boolean | undefined | null>
): Promise<ProcessedEmailTemplate | null> {
  const template = await getEmailTemplate(templateKey);

  if (!template) {
    logger.warn('Email template not found', { templateKey });
    return null;
  }

  return {
    subject: substituteWithConditionals(template.subject_template, variables),
    html: substituteWithConditionals(template.body_html_template, variables),
    text: template.body_text_template
      ? substituteWithConditionals(template.body_text_template, variables)
      : undefined,
  };
}

/**
 * Process email template with fallback HTML
 * If template not found, use provided fallback
 */
export async function processEmailTemplateWithFallback(
  templateKey: string,
  variables: Record<string, string | number | boolean | undefined | null>,
  fallback: { subject: string; html: string }
): Promise<ProcessedEmailTemplate> {
  const processed = await processEmailTemplate(templateKey, variables);

  if (processed) {
    return processed;
  }

  // Use fallback with variable substitution
  return {
    subject: substituteWithConditionals(fallback.subject, variables),
    html: substituteWithConditionals(fallback.html, variables),
  };
}

