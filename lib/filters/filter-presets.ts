/**
 * Filter Presets
 * Predefined filter configurations for common use cases
 */

export type FilterCondition = {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between';
  value: unknown;
  label?: string;
};

export type FilterPreset = {
  id: string;
  name: string;
  description?: string;
  conditions: FilterCondition[];
  module: string;
};

/**
 * Booking filter presets
 */
export const BOOKING_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'high-value',
    name: 'High-Value Bookings',
    description: 'Bookings dengan total > Rp 10 juta',
    module: 'bookings',
    conditions: [
      { field: 'total_amount', operator: 'gte', value: 10000000 },
    ],
  },
  {
    id: 'pending-payment',
    name: 'Pending Payment',
    description: 'Bookings yang menunggu pembayaran',
    module: 'bookings',
    conditions: [
      { field: 'status', operator: 'eq', value: 'pending_payment' },
    ],
  },
  {
    id: 'this-week-trips',
    name: 'This Week Trips',
    description: 'Trip yang berlangsung minggu ini',
    module: 'bookings',
    conditions: [
      { field: 'trip_date', operator: 'gte', value: 'week_start' },
      { field: 'trip_date', operator: 'lte', value: 'week_end' },
    ],
  },
  {
    id: 'cancelled-last-month',
    name: 'Cancelled Last Month',
    description: 'Booking yang dibatalkan bulan lalu',
    module: 'bookings',
    conditions: [
      { field: 'status', operator: 'eq', value: 'cancelled' },
      { field: 'cancelled_at', operator: 'gte', value: 'last_month_start' },
      { field: 'cancelled_at', operator: 'lte', value: 'last_month_end' },
    ],
  },
  {
    id: 'upcoming-confirmed',
    name: 'Upcoming Confirmed',
    description: 'Booking confirmed untuk trip mendatang',
    module: 'bookings',
    conditions: [
      { field: 'status', operator: 'eq', value: 'confirmed' },
      { field: 'trip_date', operator: 'gte', value: 'today' },
    ],
  },
];

/**
 * User filter presets
 */
export const USER_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'active-customers',
    name: 'Active Customers',
    description: 'Customer yang aktif',
    module: 'users',
    conditions: [
      { field: 'role', operator: 'eq', value: 'customer' },
      { field: 'is_active', operator: 'eq', value: true },
    ],
  },
  {
    id: 'guides',
    name: 'All Guides',
    description: 'Semua guide',
    module: 'users',
    conditions: [
      { field: 'role', operator: 'eq', value: 'guide' },
    ],
  },
  {
    id: 'internal-staff',
    name: 'Internal Staff',
    description: 'Staff internal (admin, finance, ops)',
    module: 'users',
    conditions: [
      { field: 'role', operator: 'in', value: ['super_admin', 'ops_admin', 'finance_manager', 'marketing'] },
    ],
  },
  {
    id: 'new-registrations',
    name: 'New This Month',
    description: 'User yang mendaftar bulan ini',
    module: 'users',
    conditions: [
      { field: 'created_at', operator: 'gte', value: 'month_start' },
    ],
  },
];

/**
 * Payment filter presets
 */
export const PAYMENT_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'pending-verification',
    name: 'Pending Verification',
    description: 'Pembayaran yang menunggu verifikasi',
    module: 'payments',
    conditions: [
      { field: 'verification_status', operator: 'eq', value: 'pending' },
    ],
  },
  {
    id: 'verified-today',
    name: 'Verified Today',
    description: 'Pembayaran yang diverifikasi hari ini',
    module: 'payments',
    conditions: [
      { field: 'verification_status', operator: 'eq', value: 'verified' },
      { field: 'verified_at', operator: 'gte', value: 'today_start' },
    ],
  },
  {
    id: 'rejected',
    name: 'Rejected Payments',
    description: 'Pembayaran yang ditolak',
    module: 'payments',
    conditions: [
      { field: 'verification_status', operator: 'eq', value: 'rejected' },
    ],
  },
  {
    id: 'high-value-pending',
    name: 'High-Value Pending',
    description: 'Pembayaran besar yang pending',
    module: 'payments',
    conditions: [
      { field: 'amount', operator: 'gte', value: 5000000 },
      { field: 'verification_status', operator: 'eq', value: 'pending' },
    ],
  },
];

/**
 * Get presets by module
 */
export function getPresetsByModule(module: string): FilterPreset[] {
  switch (module) {
    case 'bookings':
      return BOOKING_FILTER_PRESETS;
    case 'users':
      return USER_FILTER_PRESETS;
    case 'payments':
      return PAYMENT_FILTER_PRESETS;
    default:
      return [];
  }
}

/**
 * Resolve dynamic date values in filter conditions
 */
export function resolveDateValue(value: string): Date | string {
  const now = new Date();
  
  switch (value) {
    case 'today':
      return now.toISOString().split('T')[0] || '';
    case 'today_start':
      return new Date(now.setHours(0, 0, 0, 0)).toISOString();
    case 'today_end':
      return new Date(now.setHours(23, 59, 59, 999)).toISOString();
    case 'week_start': {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return weekStart.toISOString();
    }
    case 'week_end': {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() + (6 - now.getDay()));
      weekEnd.setHours(23, 59, 59, 999);
      return weekEnd.toISOString();
    }
    case 'month_start': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return monthStart.toISOString();
    }
    case 'month_end': {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return monthEnd.toISOString();
    }
    case 'last_month_start': {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return lastMonthStart.toISOString();
    }
    case 'last_month_end': {
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return lastMonthEnd.toISOString();
    }
    default:
      return value;
  }
}

/**
 * Build Supabase query conditions from filter preset
 */
export function buildQueryConditions(
  conditions: FilterCondition[]
): Record<string, { operator: string; value: unknown }> {
  const queryConditions: Record<string, { operator: string; value: unknown }> = {};

  for (const condition of conditions) {
    const resolvedValue = typeof condition.value === 'string' 
      ? resolveDateValue(condition.value)
      : condition.value;

    queryConditions[condition.field] = {
      operator: condition.operator,
      value: resolvedValue,
    };
  }

  return queryConditions;
}

