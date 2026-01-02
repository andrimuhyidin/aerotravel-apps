/**
 * Data Exporter - UU PDP 2022 Compliance
 * Handles data portability (right to data export)
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { uploadFile } from '@/lib/storage/supabase-storage';
import { logger } from '@/lib/utils/logger';

export type ExportFormat = 'json' | 'csv' | 'pdf';

export type DataExportRequest = {
  id: string;
  userId: string;
  requestType: 'export' | 'delete';
  exportFormat: ExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  fileUrl: string | null;
  fileSizeBytes: number | null;
  expiresAt: string | null;
  createdAt: string;
};

/**
 * Aggregate all user data from multiple tables
 */
async function aggregateUserData(userId: string): Promise<Record<string, unknown>> {
  const supabase = await createClient();

  // User profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  // Bookings
  const { data: bookings } = await supabase.from('bookings').select('*').eq('user_id', userId);

  // Payments
  const { data: payments } = await supabase.from('payments').select('*').eq('user_id', userId);

  // Consents
  const { data: consents } = await supabase
    .from('user_consents')
    .select('*, consent_purposes(*)')
    .eq('user_id', userId);

  // Reviews (if user has written any)
  const { data: reviews } = await supabase.from('reviews').select('*').eq('user_id', userId);

  // For guide users: trips, certifications, attendance
  let guideData = {};
  if (profile && profile.role === 'guide') {
    const { data: trips } = await supabase
      .from('trips')
      .select('*')
      .eq('guide_id', userId);

    const { data: certifications } = await supabase
      .from('guide_certifications_tracker')
      .select('*')
      .eq('guide_id', userId);

    const { data: attendance } = await supabase
      .from('guide_attendance')
      .select('*')
      .eq('guide_id', userId);

    guideData = {
      trips: trips || [],
      certifications: certifications || [],
      attendance: attendance || [],
    };
  }

  // For corporate users: company data
  let corporateData = {};
  if (profile && profile.role === 'corporate') {
    const { data: company } = await supabase
      .from('corporate_companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();

    corporateData = {
      company: company || null,
    };
  }

  return {
    exportDate: new Date().toISOString(),
    exportVersion: '1.0',
    userId,
    profile: profile || null,
    bookings: bookings || [],
    payments: payments || [],
    consents: consents || [],
    reviews: reviews || [],
    ...guideData,
    ...corporateData,
  };
}

/**
 * Generate JSON export
 */
function generateJsonExport(data: Record<string, unknown>): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Generate CSV export (simplified - only key tables)
 */
function generateCsvExport(data: Record<string, unknown>): string {
  const lines: string[] = [];

  // Profile
  lines.push('=== PROFILE ===');
  lines.push('Field,Value');
  if (data.profile && typeof data.profile === 'object') {
    const profile = data.profile as Record<string, unknown>;
    Object.entries(profile).forEach(([key, value]) => {
      lines.push(`${key},"${String(value).replace(/"/g, '""')}"`);
    });
  }
  lines.push('');

  // Bookings
  lines.push('=== BOOKINGS ===');
  if (Array.isArray(data.bookings) && data.bookings.length > 0) {
    const bookings = data.bookings as Array<Record<string, unknown>>;
    const headers = Object.keys(bookings[0] || {});
    lines.push(headers.join(','));
    bookings.forEach((booking) => {
      lines.push(
        headers
          .map((h) => `"${String(booking[h] || '').replace(/"/g, '""')}"`)
          .join(',')
      );
    });
  } else {
    lines.push('No bookings found');
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Create data export request
 */
export async function createDataExportRequest(
  userId: string,
  exportFormat: ExportFormat = 'json'
): Promise<DataExportRequest | null> {
  const supabase = await createClient();

  // Check if there's already a pending request
  const { data: existingRequest } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single();

  if (existingRequest) {
    logger.info('Existing export request found', { userId });
    return {
      id: existingRequest.id as string,
      userId: existingRequest.user_id as string,
      requestType: existingRequest.request_type as 'export' | 'delete',
      exportFormat: existingRequest.export_format as ExportFormat,
      status: existingRequest.status as 'pending' | 'processing' | 'completed' | 'failed' | 'expired',
      fileUrl: existingRequest.file_url as string | null,
      fileSizeBytes: existingRequest.file_size_bytes as number | null,
      expiresAt: existingRequest.expires_at as string | null,
      createdAt: existingRequest.created_at as string,
    };
  }

  const { data: request, error } = await supabase
    .from('data_export_requests')
    .insert({
      user_id: userId,
      request_type: 'export',
      export_format: exportFormat,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create data export request', error, { userId });
    return null;
  }

  logger.info('Data export request created', { userId, requestId: request.id });

  return {
    id: request.id as string,
    userId: request.user_id as string,
    requestType: request.request_type as 'export' | 'delete',
    exportFormat: request.export_format as ExportFormat,
    status: request.status as 'pending' | 'processing' | 'completed' | 'failed' | 'expired',
    fileUrl: request.file_url as string | null,
    fileSizeBytes: request.file_size_bytes as number | null,
    expiresAt: request.expires_at as string | null,
    createdAt: request.created_at as string,
  };
}

/**
 * Process data export request
 */
export async function processDataExport(requestId: string): Promise<boolean> {
  const supabase = await createClient();

  // Get request details
  const { data: request, error: fetchError } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    logger.error('Export request not found', fetchError, { requestId });
    return false;
  }

  // Update status to processing
  await supabase
    .from('data_export_requests')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  try {
    // Aggregate user data
    const userData = await aggregateUserData(request.user_id);

    // Generate export file based on format
    let fileContent: string;
    let fileName: string;
    let mimeType: string;

    if (request.export_format === 'csv') {
      fileContent = generateCsvExport(userData);
      fileName = `user_data_${request.user_id}_${Date.now()}.csv`;
      mimeType = 'text/csv';
    } else {
      // Default to JSON
      fileContent = generateJsonExport(userData);
      fileName = `user_data_${request.user_id}_${Date.now()}.json`;
      mimeType = 'application/json';
    }

    // Upload to storage
    const buffer = Buffer.from(fileContent, 'utf-8');
    const filePath = `data-exports/${request.user_id}/${fileName}`;
    
    const uploadResult = await uploadFile('documents', filePath, buffer, mimeType);

    if (!uploadResult) {
      throw new Error('Failed to upload export file');
    }

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update request with file URL
    await supabase
      .from('data_export_requests')
      .update({
        status: 'completed',
        file_url: uploadResult,
        file_size_bytes: buffer.length,
        expires_at: expiresAt.toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    logger.info('Data export completed', { requestId, userId: request.user_id });
    return true;
  } catch (error) {
    logger.error('Failed to process data export', error, { requestId });

    // Update status to failed
    await supabase
      .from('data_export_requests')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
      })
      .eq('id', requestId);

    return false;
  }
}

/**
 * Get user's export requests
 */
export async function getUserExportRequests(userId: string): Promise<DataExportRequest[]> {
  const supabase = await createClient();

  const { data: requests, error } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    logger.error('Failed to fetch export requests', error, { userId });
    return [];
  }

  return (requests || []).map((r) => ({
    id: r.id as string,
    userId: r.user_id as string,
    requestType: r.request_type as 'export' | 'delete',
    exportFormat: r.export_format as ExportFormat,
    status: r.status as 'pending' | 'processing' | 'completed' | 'failed' | 'expired',
    fileUrl: r.file_url as string | null,
    fileSizeBytes: r.file_size_bytes as number | null,
    expiresAt: r.expires_at as string | null,
    createdAt: r.created_at as string,
  }));
}

