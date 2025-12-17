/**
 * Authority Matrix
 * Defines approval limits and permissions per role
 * PRD 4.1 - Authority Matrix for financial approvals
 */

import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

// Approval limits in IDR
export const APPROVAL_LIMITS: Record<UserRole, number> = {
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
 * Check if user can approve a transaction amount
 */
export function canApproveAmount(role: UserRole, amount: number): boolean {
  const limit = APPROVAL_LIMITS[role];
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
 * Get approval limit for a role
 */
export function getApprovalLimit(role: UserRole): number {
  return APPROVAL_LIMITS[role];
}

/**
 * Format approval limit for display
 */
export function formatApprovalLimit(role: UserRole): string {
  const limit = APPROVAL_LIMITS[role];
  if (limit === Infinity) return 'Unlimited';
  if (limit === 0) return 'No approval';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(limit);
}

/**
 * Check if action requires higher approval
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
