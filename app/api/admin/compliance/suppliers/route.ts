/**
 * API: Supplier Environmental Assessments
 * GET /api/admin/compliance/suppliers - Get all supplier assessments
 * POST /api/admin/compliance/suppliers - Create supplier assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { sanitizeInput } from '@/lib/utils/sanitize';

const supplierAssessmentSchema = z.object({
  supplierName: z.string().min(2).max(255),
  supplierType: z.enum(['transport', 'accommodation', 'food', 'equipment', 'other']),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  hasEnvironmentalPolicy: z.boolean().default(false),
  wasteManagementScore: z.number().min(1).max(5).optional(),
  carbonReductionEfforts: z.string().optional(),
  usesRenewableEnergy: z.boolean().default(false),
  hasCertifications: z.boolean().default(false),
  certificationUrls: z.array(z.string().url()).optional(),
  overallRating: z.number().min(1).max(5),
  complianceStatus: z.enum(['pending', 'compliant', 'non_compliant', 'improving']).default('pending'),
  assessmentDate: z.string(), // ISO date
  assessmentNotes: z.string().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, branch_id')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'ops_admin'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const supplierType = searchParams.get('type');
  const status = searchParams.get('status');

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Build query
  let query = client.from('supplier_assessments').select('*').eq('is_active', true);

  // Filter by branch if not super_admin
  if (userProfile.role !== 'super_admin' && userProfile.branch_id) {
    query = query.eq('branch_id', userProfile.branch_id);
  }

  if (supplierType) {
    query = query.eq('supplier_type', supplierType);
  }

  if (status) {
    query = query.eq('compliance_status', status);
  }

  query = query.order('assessment_date', { ascending: false });

  const { data: suppliers, error } = await query;

  if (error) {
    logger.error('Failed to fetch supplier assessments', error, { userId: user.id });
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }

  // Get summary statistics
  const { data: summary } = await client.rpc('get_supplier_compliance_summary', {
    p_branch_id: userProfile.role === 'super_admin' ? null : userProfile.branch_id,
  });

  return NextResponse.json({
    suppliers: suppliers || [],
    summary: summary || {},
    generatedAt: new Date().toISOString(),
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, branch_id')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'ops_admin'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const validation = supplierAssessmentSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const data = validation.data;
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const assessmentData = {
    branch_id: branchContext.branchId,
    supplier_name: sanitizeInput(data.supplierName),
    supplier_type: data.supplierType,
    contact_person: data.contactPerson ? sanitizeInput(data.contactPerson) : null,
    contact_email: data.contactEmail || null,
    contact_phone: data.contactPhone ? sanitizeInput(data.contactPhone) : null,
    has_environmental_policy: data.hasEnvironmentalPolicy,
    waste_management_score: data.wasteManagementScore || null,
    carbon_reduction_efforts: data.carbonReductionEfforts
      ? sanitizeInput(data.carbonReductionEfforts)
      : null,
    uses_renewable_energy: data.usesRenewableEnergy,
    has_certifications: data.hasCertifications,
    certification_urls: data.certificationUrls || [],
    overall_rating: data.overallRating,
    compliance_status: data.complianceStatus,
    assessment_date: data.assessmentDate,
    assessed_by: user.id,
    assessment_notes: data.assessmentNotes ? sanitizeInput(data.assessmentNotes) : null,
    is_active: true,
  };

  const { data: assessment, error } = await client
    .from('supplier_assessments')
    .insert(assessmentData)
    .select('id, supplier_name, compliance_status')
    .single();

  if (error) {
    logger.error('Failed to create supplier assessment', error, {
      userId: user.id,
      supplierName: data.supplierName,
    });
    return NextResponse.json(
      { error: 'Failed to create supplier assessment' },
      { status: 500 }
    );
  }

  logger.info('Supplier assessment created', {
    assessmentId: assessment.id,
    supplierName: assessment.supplier_name,
    assessedBy: user.id,
  });

  return NextResponse.json({
    success: true,
    assessmentId: assessment.id,
    supplierName: assessment.supplier_name,
    complianceStatus: assessment.compliance_status,
  });
});

