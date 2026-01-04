/**
 * API: Governance - Approvals
 * GET /api/admin/governance/approvals - List pending approvals from various sources
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    // Fetch pending corporate booking approvals
    const { data: corporateApprovals, error: corpError } = await client
      .from('corporate_booking_approvals')
      .select(`
        id,
        status,
        requested_amount,
        created_at,
        corporate_clients!inner(company_name),
        bookings!inner(booking_code),
        corporate_employees!inner(full_name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (corpError) {
      logger.error('Failed to fetch corporate approvals', corpError);
    }

    // Map to unified approval format
    const approvals = (corporateApprovals || []).map((approval: any) => ({
      id: approval.id,
      type: 'corporate_booking',
      title: `Corporate Booking Approval - ${approval.corporate_clients?.company_name || 'Unknown'}`,
      description: `Booking: ${approval.bookings?.booking_code || 'N/A'} | Amount: Rp ${(approval.requested_amount || 0).toLocaleString('id-ID')}`,
      requestedBy: approval.corporate_employees?.full_name || approval.corporate_employees?.email || 'Unknown',
      requestedAt: approval.created_at,
      status: 'pending' as const,
      priority: approval.requested_amount > 5000000 ? 'high' as const : approval.requested_amount > 2000000 ? 'medium' as const : 'low' as const,
      metadata: {
        approvalId: approval.id,
        bookingCode: approval.bookings?.booking_code,
        amount: approval.requested_amount,
      },
    }));

    // Fetch expiring contracts (from guide contracts)
    const { data: expiringContracts, error: contractError } = await client
      .from('guide_contracts')
      .select(`
        id,
        contract_number,
        title,
        end_date,
        status,
        guide_id,
        guides!inner(full_name)
      `)
      .eq('status', 'active')
      .not('end_date', 'is', null)
      .lte('end_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('end_date', { ascending: true })
      .limit(10);

    if (contractError) {
      logger.error('Failed to fetch expiring contracts', contractError);
    }

    const contracts = (expiringContracts || []).map((contract: any) => ({
      id: contract.id,
      type: 'guide_contract',
      name: contract.title || contract.contract_number,
      status: contract.status,
      expiryDate: contract.end_date,
      signedBy: null,
    }));

    return NextResponse.json({
      pendingApprovals: approvals,
      contracts,
      stats: {
        totalContracts: 0, // Would need separate query
        activeContracts: 0,
        pendingApprovals: approvals.length,
        expiringContracts: contracts.length,
      },
    });
  } catch (error) {
    logger.error('Error in GET /api/admin/governance/approvals', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

