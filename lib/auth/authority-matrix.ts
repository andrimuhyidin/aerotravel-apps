/**
 * Authority Matrix
 * Defines approval limits and permissions per role
 * PRD 4.1 - Authority Matrix for financial approvals
 *
 * Approval limits are configurable via Admin Console (settings table)
 * Fallback to default constants if settings unavailable
 */

import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

// ============================================
// DEFAULT VALUES (Fallback)
// ============================================

const DEFAULT_APPROVAL_LIMITS: Record<UserRole, number> = {
  super_admin: Infinity, // No limit
  investor: 0, // View only, no approval
  finance_manager: 50_000_000, // 50 juta
  marketing: 10_000_000, // 10 juta
  ops_admin: 5_000_000, // 5 juta
  guide: 0, // No approval
  mitra: 0, // Own bookings only
  customer: 0, // No approval
  corporate: 0, // Own bookings only
};

// Approval limits in IDR (sync export for backward compatibility)
// @deprecated Use getApprovalLimitAsync() for dynamic values
export const APPROVAL_LIMITS: Record<UserRole, number> = { ...DEFAULT_APPROVAL_LIMITS };

// Permission matrix
export const PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: [
    'booking.create',
    'booking.edit',
    'booking.delete',
    'booking.approve',
    'payment.create',
    'payment.approve',
    'payment.refund',
    'package.create',
    'package.edit',
    'package.delete',
    'user.create',
    'user.edit',
    'user.delete',
    'report.view',
    'report.export',
    'finance.view',
    'finance.edit',
    'settings.edit',
  ],
  investor: ['report.view', 'finance.view'],
  finance_manager: [
    'booking.view',
    'payment.create',
    'payment.approve',
    'payment.refund',
    'report.view',
    'report.export',
    'finance.view',
    'finance.edit',
  ],
  marketing: [
    'booking.create',
    'booking.edit',
    'booking.view',
    'package.view',
    'customer.view',
    'customer.edit',
    'report.view',
  ],
  ops_admin: [
    'booking.create',
    'booking.edit',
    'booking.view',
    'booking.assign',
    'trip.manage',
    'asset.manage',
    'guide.assign',
    'report.view',
  ],
  guide: ['trip.view', 'manifest.view', 'manifest.update', 'attendance.submit'],
  mitra: [
    'booking.create',
    'booking.view_own',
    'deposit.view',
    'invoice.generate',
  ],
  customer: ['booking.create', 'booking.view_own', 'payment.create'],
  corporate: [
    'booking.create',
    'booking.view_own',
    'employee.manage',
    'report.view_own',
  ],
};

/**
 * Check if user can approve a transaction amount (sync - uses defaults)
 * @deprecated Use canApproveAmountAsync() for dynamic values
 */
export function canApproveAmount(role: UserRole, amount: number): boolean {
  const limit = DEFAULT_APPROVAL_LIMITS[role];
  return amount <= limit;
}

/**
 * Check if user can approve a transaction amount (async - uses settings)
 */
export async function canApproveAmountAsync(
  role: UserRole,
  amount: number
): Promise<boolean> {
  const limit = await getApprovalLimitAsync(role);
  return amount <= limit;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): string[] {
  return PERMISSIONS[role] || [];
}

/**
 * Get approval limit for a role (sync - uses defaults)
 * @deprecated Use getApprovalLimitAsync() for dynamic values
 */
export function getApprovalLimit(role: UserRole): number {
  return DEFAULT_APPROVAL_LIMITS[role];
}

/**
 * Get approval limit from settings (async)
 */
export async function getApprovalLimitAsync(role: UserRole): Promise<number> {
  try {
    const { getSetting } = await import('@/lib/settings');

    // Only configurable roles have settings
    const settingsKeyMap: Partial<Record<UserRole, string>> = {
      super_admin: 'approvals.super_admin_limit',
      finance_manager: 'approvals.finance_manager_limit',
      marketing: 'approvals.marketing_limit',
      ops_admin: 'approvals.ops_admin_limit',
    };

    const settingsKey = settingsKeyMap[role];
    if (!settingsKey) {
      return DEFAULT_APPROVAL_LIMITS[role];
    }

    const limit = await getSetting(settingsKey);
    if (limit === 0 && role === 'super_admin') {
      return Infinity; // 0 means unlimited for super_admin
    }
    return (limit as number) ?? DEFAULT_APPROVAL_LIMITS[role];
  } catch {
    return DEFAULT_APPROVAL_LIMITS[role];
  }
}

/**
 * Get all approval limits from settings
 */
export async function getAllApprovalLimits(): Promise<Record<UserRole, number>> {
  try {
    const { getSetting } = await import('@/lib/settings');
    const [superAdminLimit, financeLimit, marketingLimit, opsLimit] =
      await Promise.all([
        getSetting('approvals.super_admin_limit'),
        getSetting('approvals.finance_manager_limit'),
        getSetting('approvals.marketing_limit'),
        getSetting('approvals.ops_admin_limit'),
      ]);

    return {
      super_admin:
        (superAdminLimit as number) === 0
          ? Infinity
          : (superAdminLimit as number) ?? DEFAULT_APPROVAL_LIMITS.super_admin,
      investor: DEFAULT_APPROVAL_LIMITS.investor,
      finance_manager:
        (financeLimit as number) ?? DEFAULT_APPROVAL_LIMITS.finance_manager,
      marketing: (marketingLimit as number) ?? DEFAULT_APPROVAL_LIMITS.marketing,
      ops_admin: (opsLimit as number) ?? DEFAULT_APPROVAL_LIMITS.ops_admin,
      guide: DEFAULT_APPROVAL_LIMITS.guide,
      mitra: DEFAULT_APPROVAL_LIMITS.mitra,
      customer: DEFAULT_APPROVAL_LIMITS.customer,
      corporate: DEFAULT_APPROVAL_LIMITS.corporate,
    };
  } catch {
    return { ...DEFAULT_APPROVAL_LIMITS };
  }
}

/**
 * Format approval limit for display (sync - uses defaults)
 * @deprecated Use formatApprovalLimitAsync() for dynamic values
 */
export function formatApprovalLimit(role: UserRole): string {
  const limit = DEFAULT_APPROVAL_LIMITS[role];
  if (limit === Infinity) return 'Unlimited';
  if (limit === 0) return 'No approval';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(limit);
}

/**
 * Format approval limit for display (async - uses settings)
 */
export async function formatApprovalLimitAsync(role: UserRole): Promise<string> {
  const limit = await getApprovalLimitAsync(role);
  if (limit === Infinity) return 'Unlimited';
  if (limit === 0) return 'No approval';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(limit);
}

/**
 * Check if action requires higher approval (sync - uses defaults)
 * @deprecated Use requiresEscalationAsync() for dynamic values
 */
export function requiresEscalation(
  role: UserRole,
  action: string,
  amount?: number
): boolean {
  // Check permission first
  if (!hasPermission(role, action)) {
    return true;
  }

  // Check amount if provided
  if (amount !== undefined && action.includes('approve')) {
    return !canApproveAmount(role, amount);
  }

  return false;
}

/**
 * Check if action requires higher approval (async - uses settings)
 */
export async function requiresEscalationAsync(
  role: UserRole,
  action: string,
  amount?: number
): Promise<boolean> {
  // Check permission first
  if (!hasPermission(role, action)) {
    return true;
  }

  // Check amount if provided
  if (amount !== undefined && action.includes('approve')) {
    return !(await canApproveAmountAsync(role, amount));
  }

  return false;
}
