/**
 * FAQs Library
 * Functions to fetch FAQs from database
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export interface FAQ {
  id: string;
  app_type: string | null;
  package_id: string | null;
  category: string | null;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FAQFilters {
  app_type?: string;
  category?: string;
  package_id?: string;
}

/**
 * Get FAQs with optional filters
 */
export async function getFAQs(filters: FAQFilters = {}): Promise<FAQ[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true);

    if (filters.app_type) {
      query = query.eq('app_type', filters.app_type);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.package_id) {
      query = query.eq('package_id', filters.package_id);
    } else if (filters.app_type === 'package') {
      // For package FAQs, get both global (package_id is null) and package-specific
      query = query.or(`package_id.is.null,package_id.eq.${filters.package_id}`);
    }

    query = query.order('display_order', { ascending: true });

    const { data, error } = await query;

    if (error) {
      logger.warn('Error fetching FAQs', error);
      return [];
    }

    return (data || []) as FAQ[];
  } catch (error) {
    logger.error('Error fetching FAQs', error);
    return [];
  }
}

/**
 * Get a single FAQ by ID
 */
export async function getFAQById(id: string): Promise<FAQ | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      logger.warn(`FAQ not found: ${id}`, error);
      return null;
    }

    return data as FAQ;
  } catch (error) {
    logger.error(`Error fetching FAQ: ${id}`, error);
    return null;
  }
}

