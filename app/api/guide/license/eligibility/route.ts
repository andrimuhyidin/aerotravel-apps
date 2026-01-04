/**
 * API: Guide License Eligibility Check
 * GET /api/guide/license/eligibility - Check eligibility and auto-populate data
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get user profile
  const { data: userProfile } = await client
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!userProfile || userProfile.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check existing license
  const { data: existingLicense } = await client
    .from('guide_id_cards')
    .select('id, status, expiry_date')
    .eq('guide_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (existingLicense) {
    const expiryDate = new Date(existingLicense.expiry_date);
    const isExpired = expiryDate < new Date();
    
    if (!isExpired) {
      return NextResponse.json({
        eligible: true,
        has_license: true,
        license_id: existingLicense.id,
        message: 'Anda sudah memiliki Guide License yang aktif',
      });
    }
  }

  // Check existing application
  const { data: existingApp } = await client
    .from('guide_license_applications')
    .select('id, status, current_stage')
    .eq('guide_id', user.id)
    .in('status', [
      'pending_review',
      'document_verified',
      'ready_for_assessment',
      'assessment_in_progress',
      'training_in_progress',
      'pending_approval',
    ])
    .maybeSingle();

  if (existingApp) {
    return NextResponse.json({
      eligible: false,
      has_application: true,
      application_id: existingApp.id,
      application_status: existingApp.status,
      current_stage: existingApp.current_stage,
      message: 'Anda sudah memiliki aplikasi yang sedang diproses',
    });
  }

  // ============================================
  // ELIGIBILITY CHECK
  // ============================================

  const requirements: Record<string, { met: boolean; message: string; data?: unknown }> = {};

  // 1. Profile Data
  requirements.profile_complete = {
    met: !!(userProfile.full_name && userProfile.phone && userProfile.nik),
    message: 'Lengkapi profil (Nama, Phone, NIK)',
    data: {
      full_name: userProfile.full_name || null,
      phone: userProfile.phone || null,
      nik: userProfile.nik || null,
      email: userProfile.email || null,
    },
  };

  // 2. Contract Signed (Guide Contract, not just legal consent)
  // Check if guide has an active contract in guide_contracts table
  const { data: activeContract } = await client
    .from('guide_contracts')
    .select('id, status, guide_signed_at, company_signed_at')
    .eq('guide_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  // Also check if there's a pending contract that guide has signed (waiting for company)
  const { data: pendingContract } = await client
    .from('guide_contracts')
    .select('id, status, guide_signed_at')
    .eq('guide_id', user.id)
    .eq('status', 'pending_company')
    .maybeSingle();

  // Contract is considered signed if:
  // 1. Has active contract (both signed), OR
  // 2. Has pending_company contract (guide signed, waiting for company), OR
  // 3. Fallback to legal consent (is_contract_signed) for backward compatibility
  const hasActiveContract = !!activeContract;
  const hasSignedContract = !!pendingContract || hasActiveContract;
  const contractMet = hasActiveContract || hasSignedContract || userProfile.is_contract_signed === true;

  requirements.contract_signed = {
    met: contractMet,
    message: hasActiveContract
      ? 'Kontrak kerja aktif'
      : hasSignedContract
        ? 'Kontrak kerja ditandatangani (menunggu persetujuan perusahaan)'
        : 'Tandatangani kontrak kerja',
    data: {
      has_active_contract: hasActiveContract,
      has_signed_contract: hasSignedContract,
      active_contract_id: activeContract?.id || null,
      pending_contract_id: pendingContract?.id || null,
      is_contract_signed: userProfile.is_contract_signed, // Legal consent fallback
      contract_signed_at: activeContract?.guide_signed_at || pendingContract?.guide_signed_at || userProfile.contract_signed_at,
    },
  };

  // 3. Onboarding Complete
  const { data: onboardingProgress } = await client
    .from('guide_onboarding_progress')
    .select('status, completion_percentage')
    .eq('guide_id', user.id)
    .maybeSingle();

  requirements.onboarding_complete = {
    met: onboardingProgress?.status === 'completed' && onboardingProgress.completion_percentage >= 100,
    message: 'Selesaikan onboarding (100%)',
    data: {
      status: onboardingProgress?.status || 'not_started',
      completion_percentage: onboardingProgress?.completion_percentage || 0,
    },
  };

  // 4. Emergency Contact
  const { data: emergencyContacts } = await client
    .from('guide_emergency_contacts')
    .select('id, name, phone, relationship')
    .eq('guide_id', user.id)
    .eq('is_active', true)
    .limit(1);

  requirements.emergency_contact = {
    met: (emergencyContacts?.length || 0) > 0,
    message: 'Tambahkan kontak darurat',
    data: emergencyContacts?.[0] || null,
  };

  // 5. Medical Info
  const { data: medicalInfo } = await client
    .from('guide_medical_info')
    .select('id, blood_type')
    .eq('guide_id', user.id)
    .maybeSingle();

  requirements.medical_info = {
    met: !!medicalInfo,
    message: 'Lengkapi informasi medis',
    data: medicalInfo || null,
  };

  // 6. Bank Account (Approved)
  const { data: approvedBankAccount } = await client
    .from('guide_bank_accounts')
    .select('id, bank_name, account_number, account_holder_name')
    .eq('guide_id', user.id)
    .eq('status', 'approved')
    .limit(1);

  requirements.bank_account = {
    met: (approvedBankAccount?.length || 0) > 0,
    message: 'Tambahkan rekening bank (disetujui)',
    data: approvedBankAccount?.[0] || null,
  };

  // 7. Required Training Completed
  let allRequiredCompleted = true;
  let requiredModuleIds: string[] = [];
  let completedModuleIds: string[] = [];

  try {
    const { data: requiredTrainings } = await client
      .from('guide_training_modules')
      .select('id, title')
      .eq('is_required', true)
      .eq('is_active', true);

    const { data: completedTrainings } = await client
      .from('guide_training_progress')
      .select('module_id, status')
      .eq('guide_id', user.id)
      .eq('status', 'completed');

    completedModuleIds = (completedTrainings || []).map((t: { module_id: string }) => t.module_id);
    requiredModuleIds = (requiredTrainings || []).map((t: { id: string }) => t.id);
    allRequiredCompleted = requiredModuleIds.length > 0 && requiredModuleIds.every((id: string) => completedModuleIds.includes(id));
  } catch {
    // Table might not exist, skip this requirement
    allRequiredCompleted = true;
  }

  requirements.training_complete = {
    met: allRequiredCompleted,
    message: requiredModuleIds.length > 0 
      ? `Selesaikan ${requiredModuleIds.length} training wajib`
      : 'Tidak ada training wajib',
    data: {
      required_count: requiredModuleIds.length,
      completed_count: completedModuleIds.length,
      missing: requiredModuleIds.filter((id) => !completedModuleIds.includes(id)),
    },
  };

  // 8. Required Assessments Passed
  let assessmentCompleted = false;
  let assessments: unknown[] = [];

  try {
    const { data: assessmentData } = await client
      .from('guide_assessments')
      .select('id, template_id, status, score')
      .eq('guide_id', user.id)
      .eq('status', 'completed');

    assessments = assessmentData || [];
    // For now, we'll check if at least one assessment is completed
    // You can add more specific requirements later
    assessmentCompleted = assessments.length > 0;
  } catch {
    // Table might not exist, skip this requirement
    assessmentCompleted = true;
  }

  requirements.assessment_complete = {
    met: assessmentCompleted,
    message: 'Selesaikan assessment',
    data: {
      completed_count: assessments.length,
      assessments: assessments,
    },
  };

  // 9. Required Documents Uploaded
  const requiredDocTypes = ['ktp', 'skck', 'medical', 'photo'];
  let documentsMet = false;
  let uploadedDocuments: Array<{ document_type: string; verification_status: string; file_url?: string; created_at?: string }> = [];
  let verifiedDocuments: unknown[] = [];
  let documentsByType = new Map<string, { document_type: string; verification_status: string; file_url?: string }>();

  try {
    const { data: documentsData } = await client
      .from('guide_documents')
      .select('document_type, verification_status, file_url, created_at')
      .eq('guide_id', user.id)
      .eq('is_active', true)
      .in('document_type', requiredDocTypes)
      .order('created_at', { ascending: false });

    uploadedDocuments = (documentsData || []) as Array<{ document_type: string; verification_status: string; file_url?: string; created_at?: string }>;

    // Get latest version per document type
    documentsByType = new Map<string, { document_type: string; verification_status: string; file_url?: string }>();
    (documentsData || []).forEach((doc: typeof documentsData[0]) => {
      const existing = documentsByType.get(doc.document_type);
      if (!existing) {
        documentsByType.set(doc.document_type, {
          document_type: doc.document_type,
          verification_status: doc.verification_status,
          file_url: doc.file_url,
        });
      }
    });

    // Check if all required documents are uploaded
    const allUploaded = requiredDocTypes.every((type) => documentsByType.has(type));
    
    // Check verified documents (optional - can be pending verification)
    verifiedDocuments = Array.from(documentsByType.values()).filter(
      (doc) => doc.verification_status === 'verified',
    );

    documentsMet = allUploaded;
  } catch (error) {
    // Table might not exist, skip this requirement
    logger.info('guide_documents table might not exist yet, skipping documents requirement', { error: error instanceof Error ? error.message : 'Unknown error' });
    documentsMet = true;
  }

  requirements.documents_complete = {
    met: documentsMet,
    message: requiredDocTypes.length > 0
      ? `Upload ${requiredDocTypes.length} dokumen wajib (KTP, SKCK, Surat Kesehatan, Foto)`
      : 'Tidak ada dokumen wajib',
    data: {
      required_types: requiredDocTypes,
      uploaded_count: uploadedDocuments.length,
      verified_count: verifiedDocuments.length,
      uploaded: uploadedDocuments,
    },
  };

  // Calculate eligibility
  const allRequirementsMet = Object.values(requirements).every((req) => req.met);
  const metCount = Object.values(requirements).filter((req) => req.met).length;
  const totalCount = Object.keys(requirements).length;

  // Auto-populate data from existing profile
  const autoFillData = {
    personal_info: {
      full_name: userProfile.full_name || '',
      nik: userProfile.nik || '',
      phone: userProfile.phone || '',
      email: userProfile.email || user?.email || '',
      address: null, // Not in users table
      date_of_birth: null, // Not in users table
      emergency_contact: emergencyContacts?.[0]?.name || emergencyContacts?.[0]?.phone || null,
    },
    documents: {
      // Get documents from guide_documents table (latest version per type)
      ktp: documentsByType.get('ktp')?.file_url || null,
      skck: documentsByType.get('skck')?.file_url || null,
      medical: documentsByType.get('medical')?.file_url || null,
      photo: documentsByType.get('photo')?.file_url || userProfile.avatar_url || null,
      cv: documentsByType.get('cv')?.file_url || null,
    },
    experience: {
      previous_experience: null,
      languages: [],
      specializations: [],
      certifications: [],
    },
  };

  return NextResponse.json({
    eligible: allRequirementsMet,
    eligibility_percentage: Math.round((metCount / totalCount) * 100),
    requirements,
    requirements_summary: {
      met: metCount,
      total: totalCount,
      missing: totalCount - metCount,
    },
    auto_fill_data: autoFillData,
    recommendations: allRequirementsMet
      ? []
      : Object.entries(requirements)
          .filter(([_, req]) => !req.met)
          .map(([key, req]) => ({
            requirement: key,
            message: req.message,
            action_url: getActionUrl(key),
          })),
  });
});

function getActionUrl(requirement: string): string {
  const urlMap: Record<string, string> = {
    profile_complete: '/guide/profile/edit',
    contract_signed: '/guide/contracts', // Guide contract, not legal consent
    onboarding_complete: '/guide/onboarding',
    emergency_contact: '/guide/profile/emergency-contacts',
    medical_info: '/guide/profile/medical-info',
    bank_account: '/guide/wallet/bank-accounts',
    training_complete: '/guide/training',
    assessment_complete: '/guide/assessments',
    documents_complete: '/guide/profile/edit#documents',
  };

  return urlMap[requirement] || '/guide';
}
