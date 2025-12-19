/**
 * Documents Section Client Component
 * Display and manage guide documents
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, FileText, Info, Loader2, Upload, XCircle } from 'lucide-react';
import Link from 'next/link';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

type Document = {
  document_type: string;
  document_name: string;
  description: string;
  file_url: string | null;
  verification_status: 'missing' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  expiry_date: string | null;
  is_required: boolean;
  created_at: string | null;
  updated_at: string | null;
  // Educational information
  why_needed?: string;
  usage?: string;
  privacy?: string;
  additional_info?: string | null;
};

type DocumentsResponse = {
  documents: Document[];
  summary: {
    total: number;
    verified: number;
    required: number;
    required_verified: number;
    all_required_verified: boolean;
  };
};

export function DocumentsSectionClient({ locale }: { locale: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<DocumentsResponse>({
    queryKey: ['guide-documents'],
    queryFn: async () => {
      const res = await fetch('/api/guide/documents');
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-600">Memuat dokumen...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Gagal memuat dokumen. Silakan refresh halaman.</p>
      </div>
    );
  }

  const { documents, summary } = data;

  const getStatusIcon = (status: Document['verification_status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'pending':
      case 'needs_review':
        return <Loader2 className="h-5 w-5 animate-spin text-amber-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'missing':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusLabel = (status: Document['verification_status']) => {
    switch (status) {
      case 'verified':
        return <span className="text-xs font-medium text-emerald-700">Terverifikasi</span>;
      case 'pending':
        return <span className="text-xs font-medium text-amber-700">Menunggu Review</span>;
      case 'needs_review':
        return <span className="text-xs font-medium text-amber-700">Perlu Review</span>;
      case 'rejected':
        return <span className="text-xs font-medium text-red-700">Ditolak</span>;
      case 'missing':
        return <span className="text-xs font-medium text-red-700">Belum Diupload</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Dokumen Terverifikasi</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {summary.required_verified} / {summary.required}
            </p>
            {summary.all_required_verified && (
              <p className="mt-1 text-xs font-medium text-emerald-600">
                ✅ Semua dokumen wajib sudah terverifikasi
              </p>
            )}
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.document_type}
            className="rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <FileText className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{doc.document_name}</p>
                      {doc.is_required && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                          Wajib
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{doc.description}</p>
                    {doc.expiry_date && (
                      <p className="mt-1 text-xs text-amber-600">
                        Kedaluwarsa: {new Date(doc.expiry_date).toLocaleDateString('id-ID')}
                      </p>
                    )}
                    {doc.verification_notes && doc.verification_status === 'rejected' && (
                      <p className="mt-1 text-xs text-red-600">{doc.verification_notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                  {getStatusIcon(doc.verification_status)}
                  {getStatusLabel(doc.verification_status)}
                  {doc.verification_status === 'missing' && (
                    <Button size="sm" className="mt-1 h-8 bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95" asChild>
                      <Link href={`/${locale}/guide/profile/edit#upload-${doc.document_type}`}>
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        Upload
                      </Link>
                    </Button>
                  )}
                  {doc.file_url && doc.verification_status !== 'missing' && (
                    <Button size="sm" variant="outline" className="mt-1 h-8" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        Lihat
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

              {/* Educational Information Accordion */}
              {(doc.why_needed || doc.usage || doc.privacy || doc.additional_info) && (
                <div className="border-t border-slate-200 bg-white">
                  <Accordion type="single">
                    <AccordionItem value={`info-${doc.document_type}`}>
                      <AccordionTrigger value={`info-${doc.document_type}`} className="px-4 py-3 text-sm font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-600" />
                          <span>Informasi tentang dokumen ini</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent value={`info-${doc.document_type}`} className="px-4 pb-4 pt-0">
                      <div className="space-y-4 text-sm">
                        {doc.why_needed && (
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                              Kenapa dokumen ini dibutuhkan?
                            </h4>
                            <p className="text-slate-600 leading-relaxed">{doc.why_needed}</p>
                          </div>
                        )}

                        {doc.usage && (
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                              Bagaimana dokumen ini digunakan?
                            </h4>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{doc.usage}</p>
                          </div>
                        )}

                        {doc.privacy && (
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-purple-600"></span>
                              Privasi & Keamanan Data
                            </h4>
                            <p className="text-slate-600 leading-relaxed">{doc.privacy}</p>
                          </div>
                        )}

                        {doc.additional_info && (
                          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                            <h4 className="font-semibold text-amber-900 mb-1.5 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
                              Informasi Tambahan
                            </h4>
                            <p className="text-amber-800 text-xs leading-relaxed">{doc.additional_info}</p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
        <p className="text-xs text-blue-700">
          💡 Upload dokumen wajib (KTP, SKCK, Surat Kesehatan, Foto) untuk melengkapi persyaratan
          Guide License. Dokumen akan direview oleh admin.
        </p>
      </div>
    </div>
  );
}
