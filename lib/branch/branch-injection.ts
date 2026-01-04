/**
 * Multi-Branch Architecture Helper
 * Sesuai PRD 2.9.A - Multi-Branch Architecture
 *
 * Sistem menyuntikkan branch_id filter ke setiap query database
 * untuk isolasi data antar cabang (Lampung, Bali, Labuan Bajo)
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type BranchContext = {
  branchId: string | null; // null = Super Admin (HQ) bisa lihat semua
  isSuperAdmin: boolean;
};

/**
 * Get branch context dari user session
 */
export async function getBranchContext(userId: string): Promise<BranchContext> {
  const supabase = await createClient();

  // Get user profile dengan branch_id
  const { data: profile } = await supabase
    .from('users')
    .select('branch_id, role')
    .eq('id', userId)
    .single();

  const userProfile = profile as {
    branch_id: string | null;
    role: string;
  } | null;

  return {
    branchId: userProfile?.branch_id || null,
    isSuperAdmin: userProfile?.role === 'super_admin',
  };
}

/**
 * Inject branch filter ke query
 * Super Admin (branchId = null) bisa lihat semua
 */
export function withBranchFilter<T>(
  query: unknown,
  branchContext: BranchContext
): unknown {
  if (branchContext.isSuperAdmin || branchContext.branchId === null) {
    // Super Admin bisa lihat semua, tidak perlu filter
    return query;
  }

  // Inject branch_id filter
  return query.eq('branch_id', branchContext.branchId);
}

/**
 * Helper untuk check apakah user bisa akses branch tertentu
 */
export function canAccessBranch(
  branchContext: BranchContext,
  targetBranchId: string | null
): boolean {
  // Super Admin bisa akses semua
  if (branchContext.isSuperAdmin) return true;

  // User hanya bisa akses branch sendiri
  return branchContext.branchId === targetBranchId;
}
