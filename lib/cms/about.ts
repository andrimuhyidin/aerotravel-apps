/**
 * About Page Library
 * Functions to fetch about page content from database
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { logger } from '@/lib/utils/logger';

export interface AboutStat {
  id: string;
  label: string;
  value: string;
  display_order: number;
  is_active: boolean;
}

export interface AboutValue {
  id: string;
  title: string;
  description: string | null;
  icon_name: string | null;
  display_order: number;
  is_active: boolean;
}

export interface AboutAward {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export interface AboutContent {
  story: string;
  vision: string;
  mission: string;
  founding_date: string;
  stats: AboutStat[];
  values: AboutValue[];
  awards: AboutAward[];
}

/**
 * Get all about page content
 */
export async function getAboutContent(): Promise<AboutContent> {
  const [stats, values, awards, settings] = await Promise.all([
    getAboutStats(),
    getAboutValues(),
    getAboutAwards(),
    getSettings(),
  ]);

  return {
    story: settings['about.story'] || '',
    vision: settings['about.vision'] || '',
    mission: settings['about.mission'] || '',
    founding_date: settings['about.founding_date'] || '2019-01-01',
    stats,
    values,
    awards,
  };
}

/**
 * Get about page stats
 */
export async function getAboutStats(): Promise<AboutStat[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('about_stats')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.warn('Error fetching about stats', error);
      return [];
    }

    return (data || []) as AboutStat[];
  } catch (error) {
    logger.error('Error fetching about stats', error);
    return [];
  }
}

/**
 * Get about page values
 */
export async function getAboutValues(): Promise<AboutValue[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('about_values')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.warn('Error fetching about values', error);
      return [];
    }

    return (data || []) as AboutValue[];
  } catch (error) {
    logger.error('Error fetching about values', error);
    return [];
  }
}

/**
 * Get about page awards
 */
export async function getAboutAwards(): Promise<AboutAward[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('about_awards')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.warn('Error fetching about awards', error);
      return [];
    }

    return (data || []) as AboutAward[];
  } catch (error) {
    logger.error('Error fetching about awards', error);
    return [];
  }
}

