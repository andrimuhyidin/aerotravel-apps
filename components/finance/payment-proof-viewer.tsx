'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  X, 
  Maximize2,
  FileImage 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type PaymentProofViewerProps = {
  proofUrl: string | null;
  bookingCode?: string;
  className?: string;
};

export function PaymentProofViewer({
  proofUrl,
  bookingCode,
  className,
}: PaymentProofViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!proofUrl) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 text-center",
        className
      )}>
        <FileImage className="mb-3 h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Bukti pembayaran belum diupload
        </p>
      </div>
    );
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = proofUrl;
    link.download = `payment-proof-${bookingCode || 'unknown'}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Thumbnail Preview */}
      <div className="group relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
        {imageError ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <FileImage className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Gagal memuat gambar</p>
            </div>
          </div>
        ) : (
          <>
            <Image
              src={proofUrl}
              alt="Payment proof"
              fill
              className="object-contain transition-transform duration-200 group-hover:scale-105"
              onError={() => setImageError(true)}
              unoptimized
            />
            
            {/* Overlay with expand button */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => setIsOpen(true)}
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Perbesar
                  </Button>
                </div>
              </DialogTrigger>

              {/* Fullscreen Modal */}
              <DialogContent className="max-h-[90vh] max-w-[90vw] overflow-hidden p-0 sm:max-w-4xl">
                <DialogHeader className="absolute left-0 right-0 top-0 z-10 flex flex-row items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-4">
                  <DialogTitle className="text-white">
                    Bukti Pembayaran {bookingCode && `- ${bookingCode}`}
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </DialogHeader>

                {/* Image Container */}
                <div className="flex h-[70vh] items-center justify-center overflow-auto bg-black/90 p-4">
                  <div
                    className="transition-transform duration-200"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    }}
                  >
                    <Image
                      src={proofUrl}
                      alt="Payment proof"
                      width={800}
                      height={600}
                      className="max-h-[60vh] w-auto object-contain"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[60px] text-center text-sm text-white">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <div className="mx-2 h-6 w-px bg-white/30" />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleRotate}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={resetTransform}
                  >
                    Reset
                  </Button>
                  <div className="mx-2 h-6 w-px bg-white/30" />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}

