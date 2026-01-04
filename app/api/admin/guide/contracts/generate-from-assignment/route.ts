/**
 * API: Generate Contract from Assignment
 * POST /api/admin/guide/contracts/generate-from-assignment - Auto-generate contract from trip assignment
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const generateSchema = z.object({
  trip_id: z.string().uuid(),
  guide_id: z.string().uuid(),
  fee_amount: z.number().positive().optional(),
  contract_type: z.enum(['annual']).optional().default('annual'), // Only annual master contracts
  auto_send: z.boolean().optional().default(false),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Check admin role
  const isAuthorized = await hasRole([
    'super_admin',
    'ops_admin',
    'finance_manager',
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = generateSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get trip info
  const { data: trip, error: tripError } = await withBranchFilter(
    client.from('trips'),
    branchContext,
  )
    .select('id, trip_code, trip_date, package:packages(name)')
    .eq('id', body.trip_id)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Get assignment info
  const { data: assignment, error: assignmentError } = await withBranchFilter(
    client.from('trip_guides'),
    branchContext,
  )
    .select('fee_amount, assignment_status')
    .eq('trip_id', body.trip_id)
    .eq('guide_id', body.guide_id)
    .maybeSingle();

  if (assignmentError) {
    logger.error('Failed to get assignment', assignmentError, {
      tripId: body.trip_id,
      guideId: body.guide_id,
    });
    return NextResponse.json({ error: 'Failed to get assignment' }, { status: 500 });
  }

  // Allow creating contract even if assignment is not confirmed yet
  // This gives flexibility to create contract before assignment is confirmed
  if (!assignment) {
    return NextResponse.json(
      { error: 'Assignment not found. Pastikan guide sudah di-assign ke trip ini.' },
      { status: 400 }
    );
  }

  // Warn if assignment not confirmed, but still allow
  if (assignment.assignment_status !== 'confirmed') {
    logger.warn('Creating contract for unconfirmed assignment', {
      tripId: body.trip_id,
      guideId: body.guide_id,
      assignmentStatus: assignment.assignment_status,
    });
  }

  // Get guide info
  const { data: guide, error: guideError } = await client
    .from('users')
    .select('id, full_name, branch_id')
    .eq('id', body.guide_id)
    .single();

  if (guideError || !guide) {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
  }

  // Use assignment fee or provided fee
  const feeAmount = body.fee_amount || Number(assignment.fee_amount || 300000);
  const contractBranchId = (guide.branch_id as string | null) || branchContext.branchId;

  // Create master contract (annual) - check if guide already has active master contract
  const { data: existingMasterContract } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .select('id, end_date')
    .eq('guide_id', body.guide_id)
    .eq('is_master_contract', true)
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString().split('T')[0])
    .maybeSingle();

  if (existingMasterContract) {
    // Guide already has active master contract - just link trip to it
    await withBranchFilter(
      client.from('guide_contract_trips'),
      branchContext,
    ).insert({
      contract_id: existingMasterContract.id,
      trip_id: body.trip_id,
      trip_code: trip.trip_code as string | null,
      trip_date: trip.trip_date as string,
      fee_amount: feeAmount,
      status: 'pending',
    }).catch(() => {
      // Ignore if already linked
    });

    return NextResponse.json({
      success: true,
      message: 'Trip linked to existing master contract',
      contract_id: existingMasterContract.id,
    });
  }

  // Create new master contract (annual)
  const tripDate = trip.trip_date as string;
  const startDate = new Date(tripDate);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);

  const contractData = {
    guide_id: body.guide_id,
    branch_id: contractBranchId,
    contract_type: 'annual',
    is_master_contract: true,
    auto_cover_trips: true,
    title: `Kontrak Kerja Tahunan ${startDate.getFullYear()}`,
    description: `Kontrak kerja tahunan untuk periode ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    renewal_date: endDate.toISOString().split('T')[0],
    fee_amount: null, // Fee in trip_guides
    fee_type: 'per_trip',
    payment_terms: 'Dibayar setelah trip selesai berdasarkan fee di trip assignment',
    terms_and_conditions: {
      employment_type: 'freelancer',
      fee_structure: 'per_trip_assignment',
      trip_code: trip.trip_code,
      trip_date: tripDate,
      package_name: (trip.package as { name?: string })?.name || null,
    },
    status: body.auto_send ? 'pending_signature' : 'draft',
    created_by: user.id,
  };

  const { data: contract, error: contractError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .insert(contractData)
    .select()
    .single();

  if (contractError) {
    logger.error('Failed to create contract', contractError, {
      tripId: body.trip_id,
      guideId: body.guide_id,
    });
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }

  // Create contract trip link
  await withBranchFilter(
    client.from('guide_contract_trips'),
    branchContext,
  ).insert({
    contract_id: contract.id,
    trip_id: body.trip_id,
    trip_code: trip.trip_code as string | null,
    trip_date: tripDate,
    fee_amount: feeAmount,
    status: 'pending',
  });

  logger.info('Contract generated from assignment', {
    contractId: contract.id,
    contractNumber: contract.contract_number,
    tripId: body.trip_id,
    guideId: body.guide_id,
    autoSend: body.auto_send,
  });

  // Send notifications if auto_send
  if (body.auto_send) {
    try {
      const { notifyGuideContractSent, createInAppNotification } = await import('@/lib/integrations/contract-notifications');
      
      // Get guide info
      const { data: guide } = await client
        .from('users')
        .select('phone, full_name')
        .eq('id', body.guide_id)
        .single();

      // WhatsApp notification
      if (guide?.phone) {
        await notifyGuideContractSent(
          guide.phone,
          contract.contract_number || contract.id,
          contract.title
        );
      }

      // In-app notification
      await createInAppNotification(
        body.guide_id,
        'contract_sent',
        'Kontrak Kerja Baru',
        `Kontrak kerja baru telah dibuat untuk trip ${trip.trip_code || body.trip_id}. Silakan buka aplikasi untuk melihat detail.`,
        contract.id
      );
    } catch (error) {
      logger.error('Failed to send notifications', error, { contractId: contract.id });
      // Don't fail the request if notification fails
    }
  }

  return NextResponse.json({
    success: true,
    contract,
    message: 'Kontrak berhasil dibuat dari assignment',
  });
});
