/**
 * Legal Pages Library
 * Functions to fetch legal pages from database
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export interface LegalPage {
  id: string;
  page_type: 'terms' | 'privacy' | 'dpo';
  title: string;
  content_html: string;
  last_updated: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get a specific legal page by type
 */
export async function getLegalPage(
  type: 'terms' | 'privacy' | 'dpo'
): Promise<LegalPage | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('legal_pages')
      .select('*')
      .eq('page_type', type)
      .eq('is_active', true)
      .single();

    if (error) {
      logger.warn(`Legal page not found: ${type}`, error);
      return null;
    }

    return data as LegalPage;
  } catch (error) {
    logger.error(`Error fetching legal page: ${type}`, error);
    return null;
  }
}

/**
 * Get all legal pages
 */
export async function getAllLegalPages(): Promise<LegalPage[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('legal_pages')
      .select('*')
      .eq('is_active', true)
      .order('page_type');

    if (error) {
      logger.warn('Error fetching legal pages', error);
      return [];
    }

    return (data || []) as LegalPage[];
  } catch (error) {
    logger.error('Error fetching all legal pages', error);
    return [];
  }
}

