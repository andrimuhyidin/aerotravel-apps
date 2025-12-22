/**
 * QR Code Scanner Component
 * Uses browser camera to scan QR codes
 */

'use client';

import { QrCode, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { logger } from '@/lib/utils/logger';

type QRScannerProps = {
  onScan: (data: string) => void;
  onError?: (error: Error) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QRScanner({ onScan, onError, open, onOpenChange }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open]);

  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start QR code detection using simple pattern matching
      // Note: For production, consider using a library like html5-qrcode
      intervalRef.current = setInterval(() => {
        detectQRCode();
      }, 500); // Check every 500ms
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to access camera');
      logger.error('QR scanner error', error);
      setError('Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.');
      setScanning(false);
      onError?.(error);
    }
  };

  const stopScanning = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  };

  const detectQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simple QR code detection using jsQR library would be better
    // For now, we'll use a manual input fallback
    // In production, integrate html5-qrcode or jsQR library
  };

  const handleManualInput = () => {
    const code = prompt('Masukkan kode QR secara manual:');
    if (code && code.trim()) {
      onScan(code.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan QR Code
          </DialogTitle>
          <DialogDescription>
            Arahkan kamera ke QR code untuk memindai
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          ) : (
            <div className="relative aspect-square bg-slate-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-4 border-emerald-500 rounded-lg w-64 h-64" />
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleManualInput}
              className="flex-1"
            >
              Input Manual
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Tutup
            </Button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Pastikan QR code berada dalam kotak pemindaian
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

