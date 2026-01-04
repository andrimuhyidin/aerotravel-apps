/**
 * i18n Usage Examples
 * Demonstrates how to use translations in components
 */

'use client';

import { useTranslations } from 'next-intl';
import { useCurrencyFormatter, useDateFormatter } from '@/lib/i18n/formatters';
import { Button } from '@/components/ui/button';

/**
 * Example: Client Component with Translations
 */
export function BookingExample() {
  const t = useTranslations('booking');
  const formatCurrency = useCurrencyFormatter();
  const formatDate = useDateFormatter();

  return (
    <div>
      <h1>{t('title')}</h1>
      <Button>{t('submit_btn')}</Button>
      <p>Price: {formatCurrency(1000000)}</p>
      <p>Date: {formatDate(new Date())}</p>
    </div>
  );
}

/**
 * Example: Using Common Translations
 */
export function CommonExample() {
  const t = useTranslations('common');

  return (
    <div>
      <Button>{t('save')}</Button>
      <Button variant="outline">{t('cancel')}</Button>
    </div>
  );
}

