'use client';

/**
 * Documentation Section Component
 * For post-trip phase: Upload/save documentation link (Google Drive)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, FileText, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getTripManifest, type TripManifest } from '@/lib/guide/manifest';
import queryKeys from '@/lib/queries/query-keys';

type DocumentationSectionProps = {
  tripId: string;
  locale: string;
  isLeadGuide: boolean;
};

export function DocumentationSection({ tripId, locale, isLeadGuide }: DocumentationSectionProps) {
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');
  const queryClient = useQueryClient();

  // Fetch manifest to get documentation URL
  const { data: manifest } = useQuery<TripManifest>({
    queryKey: ['guide', 'manifest', tripId],
    queryFn: () => getTripManifest(tripId),
  });

  useEffect(() => {
    if (manifest?.documentationUrl) {
      setDriveUrl(manifest.documentationUrl);
    }
  }, [manifest?.documentationUrl]);

  // Save documentation URL
  const saveDocMutation = useMutation({
    mutationFn: async (url: string) => {
      const { saveTripDocumentationUrl } = await import('@/lib/guide/manifest');
      const result = await saveTripDocumentationUrl(tripId, url);
      if (!result.success) throw new Error(result.message || 'Failed to save documentation URL');
      return result;
    },
    onSuccess: (result) => {
      toast.success(result.message || 'Link dokumentasi berhasil disimpan');
      setDocDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['guide', 'manifest', tripId] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.tripsDetail(tripId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyimpan link dokumentasi');
    },
  });

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
    <>
      {manifest?.documentationUrl ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-900">Dokumentasi Lengkap</p>
                  <p className="text-sm text-emerald-700">Link dokumentasi trip telah diupload</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDocDialogOpen(true)}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                >
                  <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900">Upload Link Dokumentasi</p>
                  <p className="text-sm text-amber-700">Simpan link Google Drive folder dokumentasi trip</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setDocDialogOpen(true)}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                Tambah Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentation Link Dialog */}
      <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Dokumentasi Trip</DialogTitle>
            <DialogDescription>
              Simpan 1 link folder Google Drive yang berisi semua foto & video dokumentasi trip.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="https://drive.google.com/drive/folders/..."
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
            />
            {driveUrl && (
              <a
                href={driveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700"
              >
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Buka link
              </a>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDocDialogOpen(false)}>
                Batal
              </Button>
              <Button
                disabled={!driveUrl.trim() || saveDocMutation.isPending}
                onClick={() => saveDocMutation.mutate(driveUrl.trim())}
              >
                {saveDocMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Link'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
