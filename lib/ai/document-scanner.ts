/**
 * AI Document Scanner (Enhanced)
 * Multi-document OCR, auto-fill forms, expiry detection
 */

import { analyzeImage } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type DocumentType = 'ktp' | 'sim' | 'siup' | 'npwp' | 'certificate' | 'license' | 'other';

export type DocumentData = {
  type: DocumentType;
  extractedData: Record<string, unknown>;
  confidence: number;
  expiryDate?: string;
  isExpired: boolean;
  daysUntilExpiry?: number;
  fields: Record<string, string>;
};

/**
 * Scan KTP (Indonesian ID Card)
 */
export async function scanKTP(
  imageBase64: string,
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'
): Promise<DocumentData> {
  try {
    const prompt = `Extract information from this Indonesian ID Card (KTP) image in JSON format:
{
  "nik": "16-digit NIK",
  "nama": "full name",
  "tempat_lahir": "birth place",
  "tanggal_lahir": "YYYY-MM-DD",
  "jenis_kelamin": "L" | "P",
  "alamat": "full address",
  "rt": "RT number",
  "rw": "RW number",
  "kelurahan": "kelurahan name",
  "kecamatan": "kecamatan name",
  "agama": "religion",
  "status_perkawinan": "marital status",
  "pekerjaan": "occupation",
  "kewarganegaraan": "WNI" | "WNA",
  "berlaku_hingga": "lifetime" | "YYYY-MM-DD",
  "confidence": 0-100
}

If any field cannot be extracted, set it to null.
Return ONLY the JSON object, no additional text.`;

    const result = await analyzeImage(imageBase64, mimeType, prompt);

    try {
      const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleaned) as Record<string, unknown>;

      const expiryDate = data.berlaku_hingga === 'lifetime' ? undefined : (data.berlaku_hingga as string | undefined);
      const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;
      const daysUntilExpiry = expiryDate
        ? Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      return {
        type: 'ktp',
        extractedData: data,
        confidence: (data.confidence as number) || 0.7,
        expiryDate,
        isExpired,
        daysUntilExpiry,
        fields: {
          nik: (data.nik as string) || '',
          nama: (data.nama as string) || '',
          tempat_lahir: (data.tempat_lahir as string) || '',
          tanggal_lahir: (data.tanggal_lahir as string) || '',
          alamat: (data.alamat as string) || '',
        },
      };
    } catch {
      return {
        type: 'ktp',
        extractedData: {},
        confidence: 0.3,
        isExpired: false,
        fields: {},
      };
    }
  } catch (error) {
    logger.error('Failed to scan KTP', error);
    throw new Error('Gagal memindai KTP');
  }
}

/**
 * Scan SIM (Driver's License)
 */
export async function scanSIM(
  imageBase64: string,
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'
): Promise<DocumentData> {
  try {
    const prompt = `Extract information from this Indonesian Driver's License (SIM) image in JSON format:
{
  "nomor_sim": "license number",
  "nama": "full name",
  "tempat_lahir": "birth place",
  "tanggal_lahir": "YYYY-MM-DD",
  "alamat": "address",
  "jenis_sim": "A" | "B1" | "B2" | "C" | "D",
  "tanggal_terbit": "YYYY-MM-DD",
  "tanggal_berlaku": "YYYY-MM-DD",
  "confidence": 0-100
}

If any field cannot be extracted, set it to null.
Return ONLY the JSON object, no additional text.`;

    const result = await analyzeImage(imageBase64, mimeType, prompt);

    try {
      const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleaned) as Record<string, unknown>;

      const expiryDate = data.tanggal_berlaku as string | undefined;
      const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;
      const daysUntilExpiry = expiryDate
        ? Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      return {
        type: 'sim',
        extractedData: data,
        confidence: (data.confidence as number) || 0.7,
        expiryDate,
        isExpired,
        daysUntilExpiry,
        fields: {
          nomor_sim: (data.nomor_sim as string) || '',
          nama: (data.nama as string) || '',
          jenis_sim: (data.jenis_sim as string) || '',
          tanggal_berlaku: expiryDate || '',
        },
      };
    } catch {
      return {
        type: 'sim',
        extractedData: {},
        confidence: 0.3,
        isExpired: false,
        fields: {},
      };
    }
  } catch (error) {
    logger.error('Failed to scan SIM', error);
    throw new Error('Gagal memindai SIM');
  }
}

/**
 * Scan SIUP (Surat Izin Usaha Perdagangan)
 */
export async function scanSIUP(
  imageBase64: string,
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'
): Promise<DocumentData> {
  try {
    const prompt = `Extract information from this SIUP (Surat Izin Usaha Perdagangan) document image in JSON format:
{
  "nomor_siup": "SIUP number/registration number",
  "nama_perusahaan": "company name",
  "alamat_perusahaan": "company address",
  "tanggal_terbit": "YYYY-MM-DD",
  "tanggal_berlaku": "YYYY-MM-DD",
  "jenis_usaha": "type of business",
  "modal_usaha": "business capital",
  "npwp": "NPWP number if visible",
  "confidence": 0-100
}

If any field cannot be extracted, set it to null.
Return ONLY the JSON object, no additional text.`;

    const result = await analyzeImage(imageBase64, mimeType, prompt);

    try {
      const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleaned) as Record<string, unknown>;

      const expiryDate = data.tanggal_berlaku as string | undefined;
      const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;
      const daysUntilExpiry = expiryDate
        ? Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      return {
        type: 'siup',
        extractedData: data,
        confidence: (data.confidence as number) || 0.7,
        expiryDate,
        isExpired,
        daysUntilExpiry,
        fields: {
          nomor_siup: (data.nomor_siup as string) || '',
          nama_perusahaan: (data.nama_perusahaan as string) || '',
          alamat_perusahaan: (data.alamat_perusahaan as string) || '',
          tanggal_terbit: (data.tanggal_terbit as string) || '',
          tanggal_berlaku: expiryDate || '',
        },
      };
    } catch {
      return {
        type: 'siup',
        extractedData: {},
        confidence: 0.3,
        isExpired: false,
        fields: {},
      };
    }
  } catch (error) {
    logger.error('Failed to scan SIUP', error);
    throw new Error('Gagal memindai SIUP');
  }
}

/**
 * Scan NPWP (Nomor Pokok Wajib Pajak)
 */
export async function scanNPWP(
  imageBase64: string,
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'
): Promise<DocumentData> {
  try {
    const prompt = `Extract information from this NPWP (Nomor Pokok Wajib Pajak) document image in JSON format:
{
  "nomor_npwp": "15-digit NPWP number (format: XX.XXX.XXX.X-XXX.XXX)",
  "nama_wajib_pajak": "taxpayer name (company or individual)",
  "alamat": "address",
  "kpp": "Kantor Pelayanan Pajak (tax office)",
  "tanggal_daftar": "YYYY-MM-DD",
  "status": "aktif" | "non-aktif",
  "confidence": 0-100
}

If any field cannot be extracted, set it to null.
Return ONLY the JSON object, no additional text.`;

    const result = await analyzeImage(imageBase64, mimeType, prompt);

    try {
      const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleaned) as Record<string, unknown>;

      // NPWP doesn't have expiry date
      return {
        type: 'npwp',
        extractedData: data,
        confidence: (data.confidence as number) || 0.7,
        isExpired: false,
        fields: {
          nomor_npwp: (data.nomor_npwp as string) || '',
          nama_wajib_pajak: (data.nama_wajib_pajak as string) || '',
          alamat: (data.alamat as string) || '',
          kpp: (data.kpp as string) || '',
          status: (data.status as string) || '',
        },
      };
    } catch {
      return {
        type: 'npwp',
        extractedData: {},
        confidence: 0.3,
        isExpired: false,
        fields: {},
      };
    }
  } catch (error) {
    logger.error('Failed to scan NPWP', error);
    throw new Error('Gagal memindai NPWP');
  }
}

/**
 * Auto-detect document type and scan
 */
export async function scanDocument(
  imageBase64: string,
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
  documentType?: DocumentType
): Promise<DocumentData> {
  try {
    // If type specified, use specific scanner
    if (documentType === 'ktp') {
      return await scanKTP(imageBase64, mimeType);
    } else if (documentType === 'sim') {
      return await scanSIM(imageBase64, mimeType);
    } else if (documentType === 'siup') {
      return await scanSIUP(imageBase64, mimeType);
    } else if (documentType === 'npwp') {
      return await scanNPWP(imageBase64, mimeType);
    }

    // Auto-detect type
    const detectPrompt = `Identify the type of document in this image and extract key information.

Possible types: KTP (Indonesian ID Card), SIM (Driver's License), SIUP (Business License), NPWP (Tax ID), Certificate, License, Other

Return JSON:
{
  "type": "ktp" | "sim" | "siup" | "npwp" | "certificate" | "license" | "other",
  "extractedData": { ... },
  "confidence": 0-100
}

Return ONLY the JSON object, no additional text.`;

    const result = await analyzeImage(imageBase64, mimeType, detectPrompt);

    try {
      const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
      const detected = JSON.parse(cleaned) as { type: DocumentType; extractedData: Record<string, unknown>; confidence: number };

      // Use specific scanner if detected
      if (detected.type === 'ktp') {
        return await scanKTP(imageBase64, mimeType);
      } else if (detected.type === 'sim') {
        return await scanSIM(imageBase64, mimeType);
      } else if (detected.type === 'siup') {
        return await scanSIUP(imageBase64, mimeType);
      } else if (detected.type === 'npwp') {
        return await scanNPWP(imageBase64, mimeType);
      }

      // Generic extraction
      return {
        type: detected.type,
        extractedData: detected.extractedData,
        confidence: detected.confidence || 0.5,
        isExpired: false,
        fields: {},
      };
    } catch {
      // Fallback: try KTP first, then SIM
      try {
        return await scanKTP(imageBase64, mimeType);
      } catch {
        try {
          return await scanSIM(imageBase64, mimeType);
        } catch {
          return {
            type: 'other',
            extractedData: {},
            confidence: 0.3,
            isExpired: false,
            fields: {},
          };
        }
      }
    }
  } catch (error) {
    logger.error('Failed to scan document', error);
    throw new Error('Gagal memindai dokumen');
  }
}

/**
 * Check document expiry and get alerts
 */
export function checkDocumentExpiry(data: DocumentData): {
  isExpired: boolean;
  isExpiringSoon: boolean; // Within 3 months
  alert: string | null;
} {
  if (!data.expiryDate) {
    return {
      isExpired: false,
      isExpiringSoon: false,
      alert: null,
    };
  }

  const expiry = new Date(data.expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const isExpired = daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 90; // 3 months

  let alert: string | null = null;
  if (isExpired) {
    alert = `⚠️ Dokumen ini sudah expired ${Math.abs(daysUntilExpiry)} hari yang lalu. Segera perpanjang!`;
  } else if (isExpiringSoon) {
    alert = `⚠️ Dokumen ini akan expired dalam ${daysUntilExpiry} hari. Pertimbangkan untuk memperpanjang.`;
  }

  return {
    isExpired,
    isExpiringSoon,
    alert,
  };
}
