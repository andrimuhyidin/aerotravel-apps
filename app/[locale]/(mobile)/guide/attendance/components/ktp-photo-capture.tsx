'use client';

/**
 * KTP Photo Capture Component
 * Capture and verify KTP/identity card during check-in
 */

import { Camera, CheckCircle2, Loader2, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { logger } from '@/lib/utils/logger';

type KTPPhotoCaptureProps = {
  guideId: string;
  open: boolean;
  onClose: () => void;
  onComplete: (ktpData: KTPVerificationData) => void;
};

export type KTPVerificationData = {
  photoUrl: string;
  verified: boolean;
  ocrData?: {
    nik: string;
    nama: string;
    tanggal_lahir: string;
    alamat: string;
    confidence: number;
  };
};

export function KTPPhotoCapture({
  guideId,
  open,
  onClose,
  onComplete,
}: KTPPhotoCaptureProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const capturePhoto = (): Promise<File> => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Use back camera for KTP
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          try {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              setPhotoPreview(dataUrl);
              resolve(file);
            };
            reader.readAsDataURL(file);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('No file selected'));
        }
      };
      input.oncancel = () => {
        reject(new Error('Photo capture cancelled'));
      };
      input.click();
    });
  };

  const handleCapture = async () => {
    try {
      const file = await capturePhoto();
      setPhotoFile(file);
    } catch (error) {
      logger.warn('[KTP] Photo capture cancelled or failed', { error });
    }
  };

  const handleSubmit = async () => {
    if (!photoFile) {
      toast.error('Mohon capture foto KTP terlebih dahulu');
      return;
    }

    setUploading(true);
    try {
      // Upload photo
      const formData = new FormData();
      formData.append('file', photoFile);
      formData.append('guideId', guideId);
      formData.append('type', 'ktp');

      const uploadRes = await fetch('/api/guide/attendance/upload-ktp', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload KTP photo');
      }

      const uploadData = (await uploadRes.json()) as { url: string };

      // Verify with OCR/AI
      setVerifying(true);
      const verifyRes = await fetch('/api/guide/attendance/verify-ktp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl: uploadData.url,
          guideId,
        }),
      });

      if (!verifyRes.ok) {
        throw new Error('Failed to verify KTP');
      }

      const verifyData = (await verifyRes.json()) as KTPVerificationData;

      onComplete({
        photoUrl: uploadData.url,
        verified: verifyData.verified,
        ocrData: verifyData.ocrData,
      });

      toast.success('KTP berhasil diverifikasi');
    } catch (error) {
      logger.error('Failed to process KTP', error);
      toast.error('Gagal memproses KTP. Silakan coba lagi.');
    } finally {
      setUploading(false);
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-slate-600" />
            Verifikasi KTP
          </DialogTitle>
          <DialogDescription>
            Foto KTP diperlukan untuk verifikasi identitas. Data akan disimpan
            sesuai regulasi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Photo Preview */}
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="KTP Preview"
                className="w-full rounded-lg border border-slate-200"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => {
                  setPhotoPreview(null);
                  setPhotoFile(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-12">
              <Camera className="h-12 w-12 text-slate-400" />
              <p className="text-sm text-slate-600">Belum ada foto KTP</p>
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
            <p className="font-semibold">Tips untuk foto KTP yang baik:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Pastikan foto tidak blur</li>
              <li>Semua teks pada KTP harus terbaca jelas</li>
              <li>Hindari pantulan cahaya (glare)</li>
              <li>Foto seluruh area KTP</li>
            </ul>
          </div>

          {/* Verification Status */}
          {verifying && (
            <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-3">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Memverifikasi KTP...
                </p>
                <p className="text-xs text-amber-700">
                  OCR sedang membaca data KTP Anda
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {!photoPreview ? (
            <Button
              onClick={handleCapture}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="mr-2 h-4 w-4" />
              Ambil Foto KTP
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSubmit}
                disabled={uploading || verifying}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {uploading || verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {verifying ? 'Memverifikasi...' : 'Mengupload...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Verifikasi KTP
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCapture}
                disabled={uploading || verifying}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Ambil Ulang
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={uploading || verifying}
            className="w-full"
          >
            Batal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
