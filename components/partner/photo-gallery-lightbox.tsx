/**
 * Photo Gallery Lightbox Component
 * Interactive image gallery with lightbox, zoom, and navigation
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Grid3x3,
} from 'lucide-react';

type PhotoGalleryLightboxProps = {
  images: string[];
  alt: string;
};

export function PhotoGalleryLightbox({ images, alt }: PhotoGalleryLightboxProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showThumbnails, setShowThumbnails] = useState(false);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setZoomLevel(1);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    setZoomLevel(1);
  };

  const goToPrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
    setZoomLevel(1);
  };

  const goToNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % images.length);
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  if (images.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Grid3x3 className="h-16 w-16 mx-auto mb-2" />
          <p className="text-sm">Tidak ada foto</p>
        </div>
      </div>
    );
  }

  const mainImage = images[0];
  const thumbnails = images.slice(1, 5);
  const remainingCount = images.length - 5;

  return (
    <>
      {/* Gallery Grid */}
      <div className="relative w-full">
        <div className="grid grid-cols-4 gap-2">
          {/* Main Image */}
          <button
            onClick={() => openLightbox(0)}
            className="col-span-4 md:col-span-2 row-span-2 relative aspect-[16/9] rounded-xl overflow-hidden group"
          >
            <Image
              src={mainImage}
              alt={`${alt} - Main`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Thumbnail Images */}
          {thumbnails.map((image, idx) => (
            <button
              key={idx}
              onClick={() => openLightbox(idx + 1)}
              className={cn(
                'relative aspect-square rounded-lg overflow-hidden group',
                idx >= 3 && 'hidden md:block'
              )}
            >
              <Image
                src={image}
                alt={`${alt} - ${idx + 2}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </button>
          ))}

          {/* View All Button */}
          {images.length > 5 && (
            <button
              onClick={() => openLightbox(4)}
              className="relative aspect-square rounded-lg overflow-hidden bg-black/70 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <div className="text-center text-white">
                <Grid3x3 className="h-6 w-6 mx-auto mb-1" />
                <p className="text-xs font-semibold">
                  +{remainingCount} Foto
                </p>
              </div>
            </button>
          )}
        </div>

        {/* View All Photos Button (Mobile) */}
        <Button
          onClick={() => openLightbox(0)}
          variant="secondary"
          size="sm"
          className="absolute bottom-4 right-4 md:hidden gap-2 shadow-lg backdrop-blur-sm bg-white/90"
        >
          <Grid3x3 className="h-4 w-4" />
          Lihat Semua ({images.length})
        </Button>
      </div>

      {/* Lightbox Modal */}
      <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-7xl w-full h-full md:h-[90vh] p-0 bg-black/95">
          <div className="relative w-full h-full flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="text-white font-medium">
                {selectedIndex !== null && `${selectedIndex + 1} / ${images.length}`}
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className="text-white hover:bg-white/20"
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  className="text-white hover:bg-white/20"
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
                {/* Thumbnail Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className="text-white hover:bg-white/20"
                >
                  <Grid3x3 className="h-5 w-5" />
                </Button>
                {/* Close */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeLightbox}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Main Image */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-12 overflow-hidden">
              {selectedIndex !== null && (
                <div
                  className="relative w-full h-full transition-transform duration-300"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <Image
                    src={images[selectedIndex]}
                    alt={`${alt} - ${selectedIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                </div>
              )}
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-md p-3 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-md p-3 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Thumbnail Strip */}
            {showThumbnails && images.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20">
                  {images.map((image, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedIndex(idx);
                        setZoomLevel(1);
                      }}
                      className={cn(
                        'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                        idx === selectedIndex
                          ? 'border-white scale-110'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      )}
                    >
                      <Image
                        src={image}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

