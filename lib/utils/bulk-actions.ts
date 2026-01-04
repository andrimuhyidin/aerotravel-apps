/**
 * Utility functions for bulk operations
 */

import { logger } from '@/lib/utils/logger';

export type BulkActionResult<T = unknown> = {
  success: boolean;
  id: string;
  data?: T;
  error?: string;
};

export type BulkOperationSummary = {
  total: number;
  successful: number;
  failed: number;
  results: BulkActionResult[];
};

/**
 * Execute a bulk action on multiple items with error handling for each item
 * 
 * @example
 * ```ts
 * const results = await executeBulkAction(
 *   selectedIds,
 *   async (id) => {
 *     await deleteBooking(id);
 *     return { deleted: true };
 *   }
 * );
 * ```
 */
export async function executeBulkAction<T>(
  ids: string[],
  action: (id: string) => Promise<T>,
  options?: {
    batchSize?: number;
    onProgress?: (completed: number, total: number) => void;
    continueOnError?: boolean;
  }
): Promise<BulkOperationSummary> {
  const {
    batchSize = 10,
    onProgress,
    continueOnError = true,
  } = options || {};

  const results: BulkActionResult<T>[] = [];
  const total = ids.length;
  let completed = 0;

  // Process in batches
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (id) => {
      try {
        const data = await action(id);
        return { success: true, id, data };
      } catch (error) {
        logger.error(`Bulk action failed for id: ${id}`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (!continueOnError) {
          throw error;
        }
        return { success: false, id, error: errorMessage };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    completed += batch.length;
    onProgress?.(completed, total);
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    total,
    successful,
    failed,
    results,
  };
}

/**
 * Format bulk operation summary for display
 */
export function formatBulkSummary(summary: BulkOperationSummary): string {
  if (summary.failed === 0) {
    return `Berhasil memproses ${summary.successful} item`;
  }
  return `Berhasil: ${summary.successful}, Gagal: ${summary.failed} dari ${summary.total} item`;
}

/**
 * Check if bulk action is allowed based on item count
 */
export function validateBulkSelection(
  selectedCount: number,
  options?: {
    minItems?: number;
    maxItems?: number;
  }
): { valid: boolean; message?: string } {
  const { minItems = 1, maxItems = 100 } = options || {};

  if (selectedCount < minItems) {
    return {
      valid: false,
      message: `Pilih minimal ${minItems} item untuk melakukan aksi ini`,
    };
  }

  if (selectedCount > maxItems) {
    return {
      valid: false,
      message: `Maksimal ${maxItems} item dapat diproses sekaligus`,
    };
  }

  return { valid: true };
}

/**
 * Create a confirmation message for bulk action
 */
export function createBulkConfirmMessage(
  action: string,
  count: number,
  itemType = 'item'
): string {
  const plural = count > 1 ? 's' : '';
  return `Anda yakin ingin ${action} ${count} ${itemType}${plural}?`;
}

