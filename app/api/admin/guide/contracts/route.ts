/**
 * API: Admin Guide Contracts
 * GET  /api/admin/guide/contracts - List all contracts
 * POST /api/admin/guide/contracts - Create new contract
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { formatContractContentForDisplay, generateDefaultContractContent } from '@/lib/guide/contract-template';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createContractSchema = z.object({
  guide_id: z.string().uuid(),
  contract_number: z.string().optional(), // Auto-generated if not provided
  contract_type: z.enum(['annual']).default('annual'), // Only annual master contracts allowed
  title: z.string().min(1),
  description: z.string().optional(),
  start_date: z.string().date(),
  end_date: z.string().date().optional().nullable(),
  fee_amount: z.number().positive().optional().nullable(), // Always optional (fee in trip_guides)
  fee_type: z.enum(['per_trip']).default('per_trip'), // Always per_trip for master contracts
  payment_terms: z.string().optional(),
  terms_and_conditions: z.record(z.string(), z.unknown()).optional().default({}),
  trip_ids: z.array(z.string().uuid()).optional(),
  auto_send: z.boolean().optional().default(false),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
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

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get query params
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const contractType = searchParams.get('type');
  const guideId = searchParams.get('guide_id');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Build base query
  let query = client.from('guide_contracts')
    .select(
      `
      id,
      contract_number,
      contract_type,
      title,
      start_date,
      end_date,
      fee_amount,
      status,
      guide_id,
      guide:users!guide_contracts_guide_id_fkey(id, full_name, email),
      created_at,
      updated_at,
      expires_at
    `
    );

  // Apply branch filter
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    query = query.eq('branch_id', branchContext.branchId);
  }

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }
  if (contractType) {
    query = query.eq('contract_type', contractType);
  }
  if (guideId) {
    query = query.eq('guide_id', guideId);
  }

  // Order and pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: contracts, error } = await query;

  if (error) {
    logger.error('Failed to load contracts', error);
    return NextResponse.json({ error: 'Failed to load contracts' }, { status: 500 });
  }

  // Get total count
  let countQuery = client.from('guide_contracts')
    .select('*', { count: 'exact', head: true });

  // Apply branch filter
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    countQuery = countQuery.eq('branch_id', branchContext.branchId);
  }

  // Apply filters
  if (status) countQuery = countQuery.eq('status', status);
  if (contractType) countQuery = countQuery.eq('contract_type', contractType);
  if (guideId) countQuery = countQuery.eq('guide_id', guideId);

  const { count } = await countQuery;

  return NextResponse.json({
    contracts: contracts ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
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

  const body = createContractSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify guide exists
  const { data: guide, error: guideError } = await client
    .from('users')
    .select('id, full_name, role, branch_id')
    .eq('id', body.guide_id)
    .single();

  if (guideError || !guide || guide.role !== 'guide') {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
  }

  // Use guide's branch_id if contract doesn't specify
  const contractBranchId = body.guide_id ? (guide.branch_id as string | null) : branchContext.branchId;

  // All contracts are master contracts (annual only)
  const isMasterContract = true;
  const autoCoverTrips = true;

  // Calculate end_date and renewal_date (1 year from start_date)
  let endDate: string | null = body.end_date ?? null;
  let renewalDate: string | null = null;

  if (!endDate) {
    // Auto-calculate end_date (1 year from start_date)
    const startDate = new Date(body.start_date);
    const endDateObj = new Date(startDate);
    endDateObj.setFullYear(endDateObj.getFullYear() + 1);
    const calculatedEndDate = endDateObj.toISOString().split('T')[0];
    if (calculatedEndDate) {
      endDate = calculatedEndDate;
      renewalDate = calculatedEndDate;
    }
  } else {
    renewalDate = endDate;
  }

  // fee_amount is always optional (fee is in trip_guides for master contracts)

  // Generate contract number if not provided
  const dateStr = new Date().toISOString().split('T')[0];
  const contractNumber: string = body.contract_number || (dateStr ? `CT-${dateStr.replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}` : `CT-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);

  // Get guide full info for contract content (optional - use guide data we already have)
  // guide object already has full_name, so we can use that

  // Get company config
  const { getCompanyConfig } = await import('@/lib/config/company');
  const companyConfig = await getCompanyConfig();

  // Generate full contract content using template
  const contractContent = generateDefaultContractContent(
    companyConfig.name,
    guide.full_name || 'Guide',
    contractNumber,
    body.start_date,
    endDate || ''
  );

  // Format full content for storage
  const fullContractContent = formatContractContentForDisplay(contractContent);

  // Create contract
  const contractData = {
    guide_id: body.guide_id,
    branch_id: contractBranchId,
    contract_number: contractNumber,
    contract_type: body.contract_type,
    title: body.title,
    description: body.description || null,
    start_date: body.start_date,
    end_date: endDate || null,
    fee_amount: body.fee_amount || null, // Optional for master contracts
    fee_type: body.fee_type,
    payment_terms: body.payment_terms || (isMasterContract ? 'Dibayar setelah trip selesai berdasarkan fee di trip assignment' : null),
    terms_and_conditions: {
      ...body.terms_and_conditions,
      ...(isMasterContract ? {
        employment_type: 'freelancer',
        fee_structure: 'per_trip_assignment',
      } : {}),
      // Store full contract content
      fullContent: fullContractContent,
      // Store structured content for programmatic access
      structuredContent: contractContent,
    },
    is_master_contract: isMasterContract,
    auto_cover_trips: autoCoverTrips,
    renewal_date: renewalDate,
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
    logger.error('Failed to create contract', contractError, { guideId: body.guide_id });
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }

  // Create contract trips if provided
  if (body.trip_ids && body.trip_ids.length > 0) {
    const tripInserts = await Promise.all(
      body.trip_ids.map(async (tripId) => {
        // Get trip info
        const { data: trip } = await client
          .from('trips')
          .select('trip_code, trip_date')
          .eq('id', tripId)
          .single();

        return {
          contract_id: contract.id,
          trip_id: tripId,
          trip_code: trip?.trip_code || null,
          trip_date: trip?.trip_date || null,
          fee_amount: body.fee_type === 'per_trip' ? body.fee_amount : 0,
        };
      })
    );

    await withBranchFilter(
      client.from('guide_contract_trips'),
      branchContext,
    ).insert(tripInserts);
  }

  logger.info('Contract created', {
    contractId: contract.id,
    contractNumber: contract.contract_number,
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
        `Kontrak kerja baru telah dibuat: ${contract.contract_number || contract.id}. Silakan buka aplikasi untuk melihat detail.`,
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
  });
});
