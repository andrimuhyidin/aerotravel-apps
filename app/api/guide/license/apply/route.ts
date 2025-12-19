/**
 * API: Guide License Application
 * POST /api/guide/license/apply - Submit license application
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// Schema untuk validasi (data akan di-merge dengan existing data)
const applicationSchema = z.object({
  application_data: z.object({
    personal_info: z.object({
      full_name: z.string().min(1),
      nik: z.string().min(1),
      phone: z.string().min(1),
      email: z.string().email(),
      address: z.string().optional(),
      date_of_birth: z.string().optional(),
      emergency_contact: z.string().optional(),
    }),
    documents: z.object({
      ktp: z.string().url().optional().or(z.literal('')).nullable(),
      skck: z.string().url().optional().or(z.literal('')).nullable(),
      medical: z.string().url().optional().or(z.literal('')).nullable(),
      photo: z.string().url().optional().or(z.literal('')).nullable(),
      cv: z.string().url().optional().or(z.literal('')).nullable(),
    }),
    experience: z.object({
      previous_experience: z.string().optional(),
      languages: z.array(z.string()).optional(),
      specializations: z.array(z.string()).optional(),
      certifications: z.array(z.string()).optional(),
    }),
  }),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const body = await request.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate user is guide
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role, branch_id')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check eligibility (internal call)
  // We'll check eligibility directly instead of making HTTP call
  // This is more efficient and avoids circular dependencies

  // Check if already has active application
  const { data: existingApp } = await client
    .from('guide_license_applications')
    .select('id, status')
    .eq('guide_id', user.id)
    .in('status', ['pending_review', 'document_verified', 'ready_for_assessment', 'assessment_in_progress', 'training_in_progress', 'pending_approval'])
    .maybeSingle();

  if (existingApp) {
    return NextResponse.json(
      { error: 'You already have an active application', application_id: existingApp.id },
      { status: 400 }
    );
  }

  // Get all existing data from profile
  const { data: fullUserProfile } = await client
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get emergency contact
  const { data: emergencyContacts } = await client
    .from('guide_emergency_contacts')
    .select('id, name, phone, relationship')
    .eq('guide_id', user.id)
    .eq('is_active', true)
    .limit(1);

  // Auto-populate from existing data
  const autoFilledData = {
    personal_info: {
      full_name: fullUserProfile?.full_name || '',
      nik: fullUserProfile?.nik || '',
      phone: fullUserProfile?.phone || '',
      email: fullUserProfile?.email || user.email || '',
      address: null,
      date_of_birth: null,
      emergency_contact: emergencyContacts?.[0]?.name || emergencyContacts?.[0]?.phone || null,
    },
    documents: {
      ktp: null,
      skck: null,
      medical: null,
      photo: fullUserProfile?.avatar_url || null,
      cv: null,
    },
    experience: {
      previous_experience: null,
      languages: [],
      specializations: [],
      certifications: [],
    },
  };

  // Merge with submitted data (only documents and optional fields can be overridden)
  // Personal info selalu dari existing data, tidak bisa di-override
  let validated;
  try {
    const submittedData = body.application_data || {};
    const mergedData = {
      application_data: {
        personal_info: autoFilledData.personal_info, // Always use existing data
        documents: {
          ktp: submittedData.documents?.ktp || autoFilledData.documents.ktp || null,
          skck: submittedData.documents?.skck || autoFilledData.documents.skck || null,
          medical: submittedData.documents?.medical || autoFilledData.documents.medical || null,
          photo: submittedData.documents?.photo || autoFilledData.documents.photo || null,
          cv: submittedData.documents?.cv || autoFilledData.documents.cv || null,
        },
        experience: {
          ...autoFilledData.experience,
          ...(submittedData.experience || {}),
        },
      },
    };
    
    // Validate merged data
    validated = applicationSchema.parse(mergedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Invalid license application input', error, { guideId: user.id });
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // Generate application number
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  const applicationNumber = `APP-${dateStr}-${randomStr}`;

  // Auto-check if eligible for fast-track approval
  // If all requirements are met, we can auto-verify documents and move to assessment
  // For now, we'll create application in pending_review status
  // Admin can review and fast-track if eligible

  // Create application
  const { data: application, error } = await client
    .from('guide_license_applications')
    .insert({
      guide_id: user.id,
      branch_id: userProfile.branch_id,
      application_number: applicationNumber,
      status: 'pending_review',
      current_stage: 'application',
      application_data: validated.application_data,
      documents: validated.application_data.documents,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create license application', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }

  logger.info('License application created', {
    applicationId: application.id,
    applicationNumber,
    guideId: user.id,
  });

  return NextResponse.json({
    application,
    id: application.id,
    application_number: applicationNumber,
  });
});
