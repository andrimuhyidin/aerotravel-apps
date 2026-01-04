/**
 * Report Builder
 * Build and execute custom reports
 */

import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type ReportColumn = {
  key: string;
  label: string;
  type: 'string' | 'number' | 'currency' | 'date' | 'percent' | 'boolean';
  aggregation?: 'sum' | 'count' | 'avg' | 'min' | 'max';
  format?: string;
};

export type ReportFilter = {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between';
  value: unknown;
};

export type ReportGrouping = {
  field: string;
  label?: string;
};

export type ReportSorting = {
  field: string;
  direction: 'asc' | 'desc';
};

export type ReportConfig = {
  dataSource: string;
  columns: ReportColumn[];
  filters?: ReportFilter[];
  grouping?: ReportGrouping[];
  sorting?: ReportSorting[];
  limit?: number;
};

export type ReportResult = {
  data: Record<string, unknown>[];
  totalCount: number;
  aggregations?: Record<string, number>;
  executionTime: number;
};

// Available data sources and their select fields
const DATA_SOURCE_MAPPINGS: Record<string, { table: string; defaultSelect: string; joins?: string }> = {
  bookings: {
    table: 'bookings',
    defaultSelect: `
      id, booking_code, trip_date, customer_name, customer_email, customer_phone,
      adult_pax, child_pax, infant_pax, total_amount, discount_amount, 
      status, payment_status, created_at
    `,
    joins: `
      packages(name, destination, base_price)
    `,
  },
  payments: {
    table: 'payments',
    defaultSelect: `
      id, booking_id, amount, payment_method, payment_channel, status,
      verification_status, paid_at, created_at
    `,
    joins: `
      bookings(booking_code, customer_name)
    `,
  },
  users: {
    table: 'users',
    defaultSelect: `
      id, full_name, email, phone, role, is_active, loyalty_points,
      created_at, updated_at
    `,
  },
  packages: {
    table: 'packages',
    defaultSelect: `
      id, name, slug, destination, category, duration_days, base_price,
      child_price, is_active, created_at
    `,
  },
  refunds: {
    table: 'refunds',
    defaultSelect: `
      id, booking_id, refund_amount, original_amount, refund_percentage,
      refund_reason, refund_status, created_at
    `,
    joins: `
      bookings(booking_code, customer_name)
    `,
  },
};

/**
 * Build and execute a custom report
 */
export async function executeReport(config: ReportConfig): Promise<ReportResult> {
  const startTime = Date.now();
  const supabase = await createAdminClient();

  const sourceConfig = DATA_SOURCE_MAPPINGS[config.dataSource];
  if (!sourceConfig) {
    throw new Error(`Unknown data source: ${config.dataSource}`);
  }

  try {
    // Build select clause
    const selectFields = config.columns.map(c => c.key).join(', ');
    const fullSelect = sourceConfig.joins 
      ? `${selectFields}, ${sourceConfig.joins}`
      : selectFields;

    let query = supabase
      .from(sourceConfig.table)
      .select(fullSelect, { count: 'exact' });

    // Apply filters
    if (config.filters) {
      for (const filter of config.filters) {
        switch (filter.operator) {
          case 'eq':
            query = query.eq(filter.field, filter.value);
            break;
          case 'neq':
            query = query.neq(filter.field, filter.value);
            break;
          case 'gt':
            query = query.gt(filter.field, filter.value);
            break;
          case 'gte':
            query = query.gte(filter.field, filter.value);
            break;
          case 'lt':
            query = query.lt(filter.field, filter.value);
            break;
          case 'lte':
            query = query.lte(filter.field, filter.value);
            break;
          case 'like':
            query = query.ilike(filter.field, `%${filter.value}%`);
            break;
          case 'in':
            query = query.in(filter.field, filter.value as string[]);
            break;
        }
      }
    }

    // Apply sorting
    if (config.sorting && config.sorting.length > 0) {
      for (const sort of config.sorting) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      }
    }

    // Apply limit
    if (config.limit) {
      query = query.limit(config.limit);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Report execution failed', error);
      throw new Error(`Report execution failed: ${error.message}`);
    }

    const executionTime = Date.now() - startTime;

    // Calculate aggregations if needed
    let aggregations: Record<string, number> | undefined;
    const aggregationColumns = config.columns.filter(c => c.aggregation);
    
    if (aggregationColumns.length > 0 && data) {
      aggregations = {};
      for (const col of aggregationColumns) {
        const values = data.map(row => Number(row[col.key]) || 0);
        switch (col.aggregation) {
          case 'sum':
            aggregations[col.key] = values.reduce((a, b) => a + b, 0);
            break;
          case 'count':
            aggregations[col.key] = values.length;
            break;
          case 'avg':
            aggregations[col.key] = values.length > 0 
              ? values.reduce((a, b) => a + b, 0) / values.length 
              : 0;
            break;
          case 'min':
            aggregations[col.key] = Math.min(...values);
            break;
          case 'max':
            aggregations[col.key] = Math.max(...values);
            break;
        }
      }
    }

    return {
      data: data || [],
      totalCount: count || 0,
      aggregations,
      executionTime,
    };
  } catch (error) {
    logger.error('Report execution error', error);
    throw error;
  }
}

/**
 * Get available data sources for report builder
 */
export function getAvailableDataSources(): { id: string; label: string; fields: string[] }[] {
  return Object.entries(DATA_SOURCE_MAPPINGS).map(([id, config]) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    fields: config.defaultSelect.split(',').map(f => f.trim()).filter(Boolean),
  }));
}

/**
 * Validate report configuration
 */
export function validateReportConfig(config: ReportConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.dataSource) {
    errors.push('Data source is required');
  } else if (!DATA_SOURCE_MAPPINGS[config.dataSource]) {
    errors.push(`Unknown data source: ${config.dataSource}`);
  }

  if (!config.columns || config.columns.length === 0) {
    errors.push('At least one column is required');
  }

  if (config.limit && config.limit > 10000) {
    errors.push('Maximum limit is 10,000 rows');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

