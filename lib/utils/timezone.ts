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

/**
 * Get timezone berdasarkan branch
 */
export function getBranchTimezone(branchId: string | null): Timezone {
  // TODO: Get dari database branch config
  // Default mapping:
  // - Lampung: WIB (Asia/Jakarta)
  // - Bali: WITA (Asia/Makassar)
  // - Labuan Bajo: WITA (Asia/Makassar)

  if (!branchId) return 'Asia/Jakarta'; // Default HQ

  // Placeholder - akan di-update saat ada branch data
  return 'Asia/Jakarta';
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
