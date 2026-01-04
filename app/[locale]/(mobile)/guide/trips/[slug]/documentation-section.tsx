'use client';

/**
 * Documentation Section Component
 * For post-trip phase: Link to evidence upload page
 */

import { useQuery } from '@tanstack/react-query';
import { ExternalLink, FileText, Link as LinkIcon, Upload } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getTripManifest, type TripManifest } from '@/lib/guide/manifest';

type DocumentationSectionProps = {
  tripId: string;
  locale: string;
  tripCode?: string;
  isLeadGuide: boolean;
};

export function DocumentationSection({ tripId, locale, tripCode, isLeadGuide }: DocumentationSectionProps) {
  // Fetch manifest to get documentation URL
  const { data: manifest } = useQuery<TripManifest>({
    queryKey: ['guide', 'manifest', tripId],
    queryFn: () => getTripManifest(tripId),
  });

  // Get trip identifier (code or id) for URL
  const tripIdentifier = tripCode || tripId;

  if (!isLeadGuide) {
    // Support guide hanya bisa lihat, tidak bisa edit
    if (!manifest?.documentationUrl) {
      return null;
    }
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900">Link Dokumentasi</p>
                <p className="text-sm text-emerald-700">Link dokumentasi trip telah diupload</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(manifest.documentationUrl || '', '_blank')}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Buka
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={manifest?.documentationUrl ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {manifest?.documentationUrl ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <FileText className="h-5 w-5 text-emerald-600" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Upload className="h-5 w-5 text-amber-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold ${manifest?.documentationUrl ? 'text-emerald-900' : 'text-amber-900'}`}>
                {manifest?.documentationUrl ? 'Dokumentasi Lengkap' : 'Upload Link Dokumentasi'}
              </p>
              <p className={`text-sm mt-0.5 ${manifest?.documentationUrl ? 'text-emerald-700' : 'text-amber-700'}`}>
                {manifest?.documentationUrl 
                  ? 'Link dokumentasi trip telah diupload' 
                  : 'Simpan link Google Drive folder dokumentasi trip'}
              </p>
              {manifest?.documentationUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(manifest.documentationUrl || '', '_blank')}
                  className="mt-2 h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 p-0"
                >
                  <ExternalLink className="mr-1.5 h-3 w-3" />
                  Buka Link
                </Button>
              )}
            </div>
          </div>
          <Link href={`/${locale}/guide/trips/${tripIdentifier}/evidence`}>
            <Button
              size="sm"
              variant={manifest?.documentationUrl ? 'outline' : 'default'}
              className={manifest?.documentationUrl 
                ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-100' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'}
            >
              {manifest?.documentationUrl ? (
                <>
                  <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload
                </>
              )}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
