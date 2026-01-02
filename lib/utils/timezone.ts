/**
 * Timezone Utility Functions
 * Sesuai PRD 2.9.B - Global Localization Strategy
 *
 * Semua waktu di database disimpan UTC (ISO 8601)
 * Konversi ke waktu lokal dilakukan di frontend berdasarkan branch
 */

import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { id } from 'date-fns/locale';

export type Timezone = 'Asia/Jakarta' | 'Asia/Makassar' | 'Asia/Jayapura';
export type TimezoneLabel = 'WIB' | 'WITA' | 'WIT';

export const TIMEZONE_MAP: Record<Timezone, TimezoneLabel> = {
  'Asia/Jakarta': 'WIB',
  'Asia/Makassar': 'WITA',
  'Asia/Jayapura': 'WIT',
};

// Default timezone mapping by branch code/name pattern
const DEFAULT_BRANCH_TIMEZONES: Record<string, Timezone> = {
  // WIB regions (UTC+7)
  lampung: 'Asia/Jakarta',
  jakarta: 'Asia/Jakarta',
  bandung: 'Asia/Jakarta',
  surabaya: 'Asia/Jakarta',
  yogyakarta: 'Asia/Jakarta',
  semarang: 'Asia/Jakarta',
  // WITA regions (UTC+8)
  bali: 'Asia/Makassar',
  denpasar: 'Asia/Makassar',
  labuan_bajo: 'Asia/Makassar',
  makassar: 'Asia/Makassar',
  manado: 'Asia/Makassar',
  balikpapan: 'Asia/Makassar',
  // WIT regions (UTC+9)
  jayapura: 'Asia/Jayapura',
  sorong: 'Asia/Jayapura',
  ambon: 'Asia/Jayapura',
};

// In-memory cache for branch timezones (refreshed on app restart)
const branchTimezoneCache = new Map<string, Timezone>();

/**
 * Get timezone berdasarkan branch (synchronous - uses cache)
 * For async with DB lookup, use getBranchTimezoneAsync
 */
export function getBranchTimezone(branchId: string | null): Timezone {
  if (!branchId) return 'Asia/Jakarta'; // Default HQ

  // Check cache first
  const cached = branchTimezoneCache.get(branchId);
  if (cached) return cached;

  // Return default if not in cache
  return 'Asia/Jakarta';
}

/**
 * Get timezone from database with fallback to defaults
 * Use this in server contexts where async is allowed
 */
export async function getBranchTimezoneAsync(branchId: string | null): Promise<Timezone> {
  if (!branchId) return 'Asia/Jakarta';

  // Check cache first
  const cached = branchTimezoneCache.get(branchId);
  if (cached) return cached;

  try {
    // Dynamic import to avoid circular dependencies
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: branch, error } = await supabase
      .from('branches')
      .select('id, code, name, timezone')
      .eq('id', branchId)
      .single();

    if (error || !branch) {
      return 'Asia/Jakarta';
    }

    // Try to get timezone from database column first
    if (branch.timezone && isValidTimezone(branch.timezone)) {
      const tz = branch.timezone as Timezone;
      branchTimezoneCache.set(branchId, tz);
      return tz;
    }

    // Fallback: infer timezone from branch code/name
    const codeOrName = (branch.code || branch.name || '').toLowerCase().replace(/\s+/g, '_');
    for (const [pattern, tz] of Object.entries(DEFAULT_BRANCH_TIMEZONES)) {
      if (codeOrName.includes(pattern)) {
        branchTimezoneCache.set(branchId, tz);
        return tz;
      }
    }

    // Default to WIB
    branchTimezoneCache.set(branchId, 'Asia/Jakarta');
    return 'Asia/Jakarta';
  } catch {
    return 'Asia/Jakarta';
  }
}

/**
 * Preload branch timezones into cache
 * Call this at app startup or periodically
 */
export async function preloadBranchTimezones(): Promise<void> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: branches, error } = await supabase
      .from('branches')
      .select('id, code, name, timezone')
      .eq('is_active', true);

    if (error || !branches) return;

    for (const branch of branches) {
      const b = branch as { id: string; code?: string; name?: string; timezone?: string };
      let tz: Timezone = 'Asia/Jakarta';

      if (b.timezone && isValidTimezone(b.timezone)) {
        tz = b.timezone as Timezone;
      } else {
        const codeOrName = (b.code || b.name || '').toLowerCase().replace(/\s+/g, '_');
        for (const [pattern, timezone] of Object.entries(DEFAULT_BRANCH_TIMEZONES)) {
          if (codeOrName.includes(pattern)) {
            tz = timezone;
            break;
          }
        }
      }

      branchTimezoneCache.set(b.id, tz);
    }
  } catch {
    // Silently fail - will use defaults
  }
}

function isValidTimezone(tz: string): boolean {
  return ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'].includes(tz);
}

/**
 * Convert UTC date ke waktu lokal branch
 */
export function toBranchTime(
  utcDate: Date | string,
  branchId: string | null
): Date {
  const timezone = getBranchTimezone(branchId);
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return toZonedTime(date, timezone);
}

/**
 * Format date dengan timezone label (WIB/WITA/WIT)
 */
export function formatBranchTime(
  utcDate: Date | string,
  branchId: string | null,
  formatString: string = 'dd MMM yyyy HH:mm'
): string {
  const timezone = getBranchTimezone(branchId);
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const label = TIMEZONE_MAP[timezone];

  const formatted = formatInTimeZone(date, timezone, formatString, {
    locale: id,
  });

  return `${formatted} ${label}`;
}

/**
 * Convert local time ke UTC untuk disimpan ke database
 */
export function toUTC(localDate: Date, branchId: string | null): Date {
  const timezone = getBranchTimezone(branchId);
  // Get UTC offset
  const zonedDate = toZonedTime(localDate, timezone);
  const offset = localDate.getTime() - zonedDate.getTime();
  return new Date(localDate.getTime() - offset);
}
