/**
 * Guide Documents Page
 * Kelola dokumen yang diperlukan untuk guide
 */

import { CheckCircle, FileText, Loader2, Upload, XCircle } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { locales } from '@/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Dokumen - Guide App' };
}

const documents = [
  {
    name: 'KTP',
    description: 'Kartu Tanda Penduduk',
    status: 'verified' as const,
    required: true,
  },
  {
    name: 'Sertifikat Guide',
    description: 'Sertifikat keahlian sebagai tour guide',
    status: 'verified' as const,
    required: true,
  },
  {
    name: 'SKCK',
    description: 'Surat Keterangan Catatan Kepolisian',
    status: 'pending' as const,
    required: true,
  },
  {
    name: 'Surat Kesehatan',
    description: 'Surat keterangan sehat dari dokter',
    status: 'missing' as const,
    required: false,
  },
];

export default async function DocumentsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const verifiedCount = documents.filter((d) => d.status === 'verified').length;
  const totalRequired = documents.filter((d) => d.required).length;

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Dokumen</h1>
        <p className="mt-1 text-sm text-slate-600">Kelola dokumen yang diperlukan</p>
      </div>

      {/* Progress Summary */}
      <Card className="mb-4 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Dokumen Terverifikasi</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {verifiedCount} / {totalRequired}
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-3">
        {documents.map((doc, i) => {
          const getStatusIcon = () => {
            switch (doc.status) {
              case 'verified':
                return <CheckCircle className="h-5 w-5 text-emerald-500" />;
              case 'pending':
                return <Loader2 className="h-5 w-5 animate-spin text-amber-500" />;
              case 'missing':
                return <XCircle className="h-5 w-5 text-red-500" />;
            }
          };

          const getStatusLabel = () => {
            switch (doc.status) {
              case 'verified':
                return (
                  <span className="text-xs font-medium text-emerald-700">Terverifikasi</span>
                );
              case 'pending':
                return <span className="text-xs font-medium text-amber-700">Menunggu Review</span>;
              case 'missing':
                return <span className="text-xs font-medium text-red-700">Belum Diupload</span>;
            }
          };

          return (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
                      <FileText className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{doc.name}</p>
                        {doc.required && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                            Wajib
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{doc.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    {getStatusIcon()}
                    {getStatusLabel()}
                    {doc.status === 'missing' && (
                      <Button
                        size="sm"
                        className="mt-1 h-8 bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95"
                      >
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        Upload
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Container>
  );
}
