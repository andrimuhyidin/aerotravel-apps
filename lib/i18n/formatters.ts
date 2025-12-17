/**
 * i18n Formatters
 * Currency and Date/Time formatters using next-intl
 */

import { useFormatter } from 'next-intl';

/**
 * Currency Formatter
 * Formats currency based on locale
 * 
 * @example
 * const formatCurrency = useCurrencyFormatter();
 * formatCurrency(1000000); // "Rp 1.000.000" (id) or "$1,000.00" (en)
 */
export function useCurrencyFormatter() {
  const format = useFormatter();

  return (amount: number, currency: string = 'IDR') => {
    return format.number(amount, {
      style: 'currency',
      currency,
    });
  };
}

/**
 * Date Formatter
 * Formats date based on locale
 * 
 * @example
 * const formatDate = useDateFormatter();
 * formatDate(new Date()); // "17 Desember 2024" (id) or "December 17, 2024" (en)
 */
export function useDateFormatter() {
  const format = useFormatter();

  return (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format.dateTime(dateObj, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(options as Record<string, unknown>),
    } as Parameters<typeof format.dateTime>[1]);
  };
}

/**
 * Time Formatter
 * Formats time based on locale
 * 
 * @example
 * const formatTime = useTimeFormatter();
 * formatTime(new Date()); // "14:30" (id) or "2:30 PM" (en)
 */
export function useTimeFormatter() {
  const format = useFormatter();

  return (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format.dateTime(dateObj, {
      hour: 'numeric',
      minute: 'numeric',
      ...(options as Record<string, unknown>),
    } as Parameters<typeof format.dateTime>[1]);
  };
}

/**
 * Relative Time Formatter
 * Formats relative time (e.g., "2 hours ago")
 * 
 * @example
 * const formatRelativeTime = useRelativeTimeFormatter();
 * formatRelativeTime(new Date(Date.now() - 2 * 60 * 60 * 1000)); // "2 jam yang lalu" (id) or "2 hours ago" (en)
 */
export function useRelativeTimeFormatter() {
  const format = useFormatter();

  return (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format.relativeTime(dateObj);
  };
}

