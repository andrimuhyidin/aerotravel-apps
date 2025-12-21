/**
 * API: Guide Documents
 * GET /api/guide/documents - Get all guide documents
 * POST /api/guide/documents - Upload new document
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const documentTypeSchema = z.enum(['ktp', 'skck', 'medical', 'photo', 'cv', 'certificate', 'other']);

const documentLabels: Record<string, string> = {
  ktp: 'KTP',
  skck: 'SKCK',
  medical: 'Surat Kesehatan',
  photo: 'Foto Formal',
  cv: 'CV/Resume',
  certificate: 'Sertifikat',
  other: 'Dokumen Lainnya',
};

const documentDescriptions: Record<string, string> = {
  ktp: 'Kartu Tanda Penduduk',
  skck: 'Surat Keterangan Catatan Kepolisian',
  medical: 'Surat keterangan sehat dari dokter',
  photo: 'Foto formal untuk ID Card',
  cv: 'Curriculum Vitae / Resume',
  certificate: 'Sertifikat keahlian sebagai tour guide',
  other: 'Dokumen lainnya',
};

// Educational information about why documents are needed
const documentInfo: Record<
  string,
  {
    why_needed: string;
    usage: string;
    privacy: string;
    additional_info?: string;
  }
> = {
  ktp: {
    why_needed:
      'KTP diperlukan untuk verifikasi identitas resmi Anda sebagai tour guide. Dokumen ini memastikan bahwa Anda adalah warga negara Indonesia yang sah dan memenuhi persyaratan legal untuk bekerja sebagai guide.',
    usage:
      'KTP digunakan untuk: (1) Verifikasi identitas saat registrasi Guide License, (2) Pencocokan data dengan sistem pemerintah, (3) Pembuatan ID Card Guide resmi, (4) Verifikasi saat ada insiden atau klaim asuransi.',
    privacy:
      'Data KTP Anda disimpan dengan enkripsi dan hanya diakses oleh admin terotorisasi untuk keperluan verifikasi. Kami tidak membagikan data KTP kepada pihak ketiga tanpa persetujuan Anda, kecuali diminta oleh hukum.',
    additional_info:
      'Pastikan foto KTP jelas, tidak blur, dan semua informasi terbaca. KTP harus masih berlaku (tidak kadaluarsa).',
  },
  skck: {
    why_needed:
      'SKCK diperlukan untuk memastikan bahwa Anda memiliki catatan kepolisian yang bersih. Ini adalah persyaratan wajib untuk profesi yang berinteraksi langsung dengan wisatawan, terutama wisatawan internasional.',
    usage:
      'SKCK digunakan untuk: (1) Verifikasi kelayakan moral sebagai tour guide, (2) Memastikan keamanan wisatawan, (3) Pemenuhan persyaratan perizinan Guide License, (4) Evaluasi oleh perusahaan travel partner.',
    privacy:
      'SKCK disimpan secara aman dan hanya diakses oleh tim HR dan admin untuk keperluan verifikasi. Dokumen ini tidak dibagikan kepada pihak ketiga tanpa persetujuan Anda.',
    additional_info:
      'SKCK memiliki masa berlaku. Pastikan SKCK Anda masih berlaku (biasanya 6 bulan). Jika sudah kadaluarsa, mohon perpanjang di kepolisian setempat.',
  },
  medical: {
    why_needed:
      'Surat Kesehatan diperlukan untuk memastikan bahwa Anda dalam kondisi fisik yang sehat untuk melakukan pekerjaan tour guide. Pekerjaan ini membutuhkan stamina yang baik karena sering berjalan jauh dan mengatur perjalanan wisatawan.',
    usage:
      'Surat Kesehatan digunakan untuk: (1) Verifikasi kondisi kesehatan fisik, (2) Memastikan Anda mampu melakukan aktivitas fisik yang dibutuhkan, (3) Pemenuhan persyaratan asuransi, (4) Evaluasi kesesuaian dengan jenis trip tertentu.',
    privacy:
      'Informasi kesehatan Anda bersifat rahasia dan hanya diakses oleh tim HR dan admin untuk keperluan verifikasi. Kami tidak membagikan detail medis kepada pihak ketiga tanpa persetujuan Anda.',
    additional_info:
      'Surat kesehatan harus dari dokter yang berlisensi dan masih berlaku (biasanya 1 tahun). Jika Anda memiliki kondisi medis tertentu, mohon informasikan kepada HR untuk penyesuaian yang diperlukan.',
  },
  photo: {
    why_needed:
      'Foto formal diperlukan untuk pembuatan ID Card Guide resmi yang akan digunakan sebagai identitas profesional Anda. ID Card ini akan ditampilkan kepada wisatawan dan partner travel sebagai bukti bahwa Anda adalah guide terverifikasi.',
    usage:
      'Foto digunakan untuk: (1) Pembuatan ID Card Guide resmi, (2) Tampilan profil di aplikasi untuk wisatawan, (3) Verifikasi identitas saat check-in trip, (4) Dokumentasi resmi perusahaan.',
    privacy:
      'Foto Anda hanya digunakan untuk keperluan profesional dan identitas resmi. Kami tidak menggunakan foto Anda untuk keperluan marketing atau promosi tanpa persetujuan Anda.',
    additional_info:
      'Foto harus: (1) Formal (kemeja/baju rapi), (2) Background polos (putih atau biru), (3) Wajah jelas dan terlihat penuh, (4) Ukuran minimal 400x400px, (5) Format JPG atau PNG.',
  },
  cv: {
    why_needed:
      'CV/Resume membantu kami memahami pengalaman dan kualifikasi Anda sebagai tour guide. Ini membantu dalam penugasan trip yang sesuai dengan keahlian Anda.',
    usage:
      'CV digunakan untuk: (1) Evaluasi kualifikasi dan pengalaman, (2) Penugasan trip sesuai keahlian, (3) Rekomendasi untuk trip khusus (bahasa asing, tema tertentu), (4) Pengembangan karir.',
    privacy:
      'CV Anda hanya diakses oleh tim HR dan admin untuk keperluan evaluasi dan penugasan. Kami tidak membagikan CV kepada pihak ketiga tanpa persetujuan Anda.',
  },
  certificate: {
    why_needed:
      'Sertifikat keahlian menunjukkan kompetensi khusus Anda sebagai tour guide, seperti sertifikat bahasa asing, sertifikat first aid, atau sertifikat keahlian khusus lainnya.',
    usage:
      'Sertifikat digunakan untuk: (1) Verifikasi kompetensi khusus, (2) Penugasan trip yang membutuhkan keahlian tertentu, (3) Peningkatan rating dan kompensasi, (4) Rekomendasi untuk trip premium.',
    privacy:
      'Sertifikat Anda disimpan untuk keperluan verifikasi kompetensi. Kami tidak membagikan detail sertifikat kepada pihak ketiga tanpa persetujuan Anda.',
  },
  other: {
    why_needed: 'Dokumen lainnya yang relevan dengan kualifikasi atau persyaratan khusus.',
    usage: 'Digunakan sesuai dengan jenis dokumen yang diupload.',
    privacy: 'Dokumen disimpan dengan aman dan hanya diakses oleh tim terotorisasi.',
  },
};

const requiredDocuments: string[] = ['ktp', 'skck', 'medical', 'photo'];

// GET - Get all documents for current guide
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all documents for this guide (latest version per type)
  let documents: unknown[] = [];
  let documentsError: unknown = null;

  try {
    const { data: docs, error: docsError } = await supabase
      .from('guide_documents')
      .select('id, document_type, file_url, verification_status, created_at, verified_at, verified_by, verification_notes, expiry_date, is_required')
      .eq('guide_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (docsError) {
      // If table doesn't exist, return empty array (graceful degradation)
      const errorCode = (docsError as { code?: string }).code;
      if (errorCode === '42P01' || errorCode === 'PGRST205') {
        logger.info('guide_documents table does not exist yet, returning empty documents', { guideId: user.id });
        documents = [];
      } else {
        logger.error('Failed to fetch guide documents', docsError, { guideId: user.id, errorCode });
        documentsError = docsError;
      }
    } else {
      documents = docs || [];
    }
  } catch (err) {
    // Table might not exist or other error, return empty array
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.info('Exception while fetching guide documents, returning empty', { error: errorMessage, guideId: user.id });
    documents = [];
  }

  if (documentsError) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }

  // Group by document_type and get latest version
  type DocumentData = {
    document_type: string;
    file_url?: string | null;
    verification_status?: string;
    created_at?: string | null;
    verified_at?: string | null;
    verified_by?: string | null;
    verification_notes?: string | null;
    expiry_date?: string | null;
    updated_at?: string | null;
  };

  const documentsByType = new Map<string, DocumentData>();
  (documents || []).forEach((doc: unknown) => {
    const docData = doc as DocumentData;
    if (!docData?.document_type) return;
    
    const existing = documentsByType.get(docData.document_type);
    if (!existing || (docData.created_at && existing.created_at && new Date(docData.created_at) > new Date(existing.created_at))) {
      documentsByType.set(docData.document_type, {
        document_type: docData.document_type,
        file_url: docData.file_url || null,
        verification_status: docData.verification_status || 'pending',
        created_at: docData.created_at || null,
        verified_at: docData.verified_at || null,
        verified_by: docData.verified_by || null,
        verification_notes: docData.verification_notes || null,
        expiry_date: docData.expiry_date || null,
        updated_at: docData.updated_at || null,
      });
    }
  });

  // Build response with all required document types
  const response = requiredDocuments.map((type) => {
    const doc = documentsByType.get(type);
    const info = documentInfo[type] || documentInfo.other;
    return {
      document_type: type,
      document_name: documentLabels[type] || type,
      description: documentDescriptions[type] || '',
      file_url: doc?.file_url ?? null,
      verification_status: (doc?.verification_status || 'missing') as 'missing' | 'pending' | 'verified' | 'rejected' | 'needs_review',
      verified_at: doc?.verified_at ?? null,
      verified_by: doc?.verified_by ?? null,
      verification_notes: doc?.verification_notes ?? null,
      expiry_date: doc?.expiry_date ?? null,
      is_required: true,
      created_at: doc?.created_at ?? null,
      updated_at: doc?.updated_at ?? null,
      // Educational information
      why_needed: info?.why_needed ?? '',
      usage: info?.usage ?? '',
      privacy: info?.privacy ?? '',
      additional_info: info?.additional_info ?? null,
    };
  });

  // Add optional documents if they exist
  const optionalTypes = ['cv', 'certificate', 'other'];
  optionalTypes.forEach((type) => {
    const doc = documentsByType.get(type);
    if (doc) {
      const info = documentInfo[type] || documentInfo.other;
      response.push({
        document_type: type,
        document_name: documentLabels[type] || type,
        description: documentDescriptions[type] || '',
        file_url: doc.file_url ?? null,
        verification_status: (doc.verification_status || 'pending') as 'missing' | 'pending' | 'verified' | 'rejected' | 'needs_review',
        verified_at: doc.verified_at ?? null,
        verified_by: doc.verified_by ?? null,
        verification_notes: doc.verification_notes ?? null,
        expiry_date: doc.expiry_date ?? null,
        is_required: false,
        created_at: doc.created_at ?? null,
        updated_at: doc.updated_at ?? null,
        // Educational information
        why_needed: info?.why_needed ?? '',
        usage: info?.usage ?? '',
        privacy: info?.privacy ?? '',
        additional_info: info?.additional_info ?? null,
      });
    }
  });

  // Calculate summary
  const verifiedCount = response.filter((d) => d.verification_status === 'verified').length;
  const requiredCount = response.filter((d) => d.is_required).length;
  const requiredVerifiedCount = response.filter(
    (d) => d.is_required && d.verification_status === 'verified',
  ).length;

  return NextResponse.json({
    documents: response,
    summary: {
      total: response.length,
      verified: verifiedCount,
      required: requiredCount,
      required_verified: requiredVerifiedCount,
      all_required_verified: requiredVerifiedCount === requiredCount,
    },
  });
});

// POST - Upload new document
const uploadSchema = z.object({
  document_type: documentTypeSchema,
  file_url: z.string().url(),
  file_name: z.string().optional(),
  file_size: z.number().optional(),
  mime_type: z.string().optional(),
  expiry_date: z.string().optional(), // ISO date string
  description: z.string().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get user profile for branch_id
  const { data: userProfile } = await client
    .from('users')
    .select('branch_id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!userProfile || userProfile.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const validated = uploadSchema.parse(body);

  // Validate file URL and metadata
  if (validated.file_size) {
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
    const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB for documents
    
    // Determine max size based on document type
    const isImageType = ['photo'].includes(validated.document_type);
    const maxSize = isImageType ? MAX_IMAGE_SIZE : MAX_DOC_SIZE;
    
    if (validated.file_size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }
  }

  // Validate MIME type if provided
  if (validated.mime_type) {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];
    
    if (!allowedTypes.includes(validated.mime_type.toLowerCase())) {
      return NextResponse.json(
        { error: 'File type not allowed. Only images (JPG, PNG, WebP) and documents (PDF, DOC, DOCX) are supported.' },
        { status: 400 }
      );
    }
  }

  // Validate file name extension if provided
  if (validated.file_name) {
    const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const allowedDocExts = ['.pdf', '.doc', '.docx'];
    const allowedExts = [...allowedImageExts, ...allowedDocExts];
    
    const fileExtension = '.' + validated.file_name.split('.').pop()?.toLowerCase();
    if (!allowedExts.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'File extension not allowed. Only images (JPG, PNG, WebP) and documents (PDF, DOC, DOCX) are supported.' },
        { status: 400 }
      );
    }
  }

  // Insert new document
  let document: unknown = null;
  let insertError: unknown = null;

  try {
    const { data: doc, error: docError } = await client
      .from('guide_documents')
      .insert({
        guide_id: user.id,
        branch_id: userProfile.branch_id,
        document_type: validated.document_type,
        document_name: documentLabels[validated.document_type] || validated.document_type,
        description: validated.description || documentDescriptions[validated.document_type] || '',
        file_url: validated.file_url,
        file_name: validated.file_name || null,
        file_size: validated.file_size || null,
        mime_type: validated.mime_type || null,
        expiry_date: validated.expiry_date ? new Date(validated.expiry_date).toISOString() : null,
        verification_status: 'pending',
        is_required: requiredDocuments.includes(validated.document_type),
        is_active: true,
      })
      .select()
      .single();

    if (docError) {
      // If table doesn't exist, return helpful error
      if ((docError as { code?: string }).code === '42P01' || (docError as { code?: string }).code === 'PGRST205') {
        logger.error('guide_documents table does not exist. Please run migration first.', docError, { guideId: user.id, documentType: validated.document_type });
        return NextResponse.json(
          { error: 'Table guide_documents belum dibuat. Silakan jalankan migration terlebih dahulu.' },
          { status: 503 }
        );
      }
      logger.error('Failed to upload document', docError, { guideId: user.id, documentType: validated.document_type });
      insertError = docError;
    } else {
      document = doc;
    }
  } catch (err) {
    logger.error('Exception while uploading document', err, { guideId: user.id, documentType: validated.document_type });
    insertError = err;
  }

  if (insertError) {
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }

  if (document && typeof document === 'object' && 'id' in document) {
    logger.info('Document uploaded', { guideId: user.id, documentType: validated.document_type, documentId: (document as { id: string }).id });
  } else {
    logger.info('Document uploaded', { guideId: user.id, documentType: validated.document_type });
  }

  return NextResponse.json({
    document,
    message: 'Dokumen berhasil diupload',
  });
});
