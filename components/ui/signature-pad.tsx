'use client';

/**
 * Reusable Signature Component
 * Supports draw, upload, and typed signature methods
 * Used by: Equipment Checklist, Incident Report, Safety Briefing, Logistics Handover
 */

import { CheckCircle2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export type SignatureMethod = 'draw' | 'upload' | 'typed';

export type SignatureData = {
  method: SignatureMethod;
  data: string; // base64 for draw/upload, text for typed
  timestamp: string;
  gpsLocation?: {
    latitude: number;
    longitude: number;
  };
};

type SignaturePadProps = {
  value?: SignatureData | null;
  onChange: (signature: SignatureData | null) => void;
  label?: string;
  required?: boolean;
  showGPS?: boolean; // Auto-capture GPS location
  disabled?: boolean;
};

export function SignaturePad({
  value,
  onChange,
  label = 'Tanda Tangan',
  required = false,
  showGPS = false,
  disabled = false,
}: SignaturePadProps) {
  const [method, setMethod] = useState<SignatureMethod>(value?.method || 'draw');
  const [signatureData, setSignatureData] = useState<string>(value?.data || '');
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(
    value?.gpsLocation || null,
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  // Capture GPS location if enabled
  useEffect(() => {
    if (showGPS && !gpsLocation && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('GPS capture failed:', error);
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  }, [showGPS, gpsLocation]);

  // Update parent when signature changes
  useEffect(() => {
    if (signatureData) {
      onChange({
        method,
        data: signatureData,
        timestamp: new Date().toISOString(),
        gpsLocation: gpsLocation || undefined,
      });
    } else {
      onChange(null);
    }
  }, [signatureData, method, gpsLocation, onChange]);

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY;

    setLastX(clientX - rect.left);
    setLastY(clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY;

    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    setLastX(currentX);
    setLastY(currentY);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      // Convert canvas to base64
      const canvas = canvasRef.current;
      if (canvas) {
        const dataURL = canvas.toDataURL('image/png');
        setSignatureData(dataURL);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignatureData('');
    onChange(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSignatureData(result);
    };
    reader.readAsDataURL(file);
  };

  const handleTypedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignatureData(e.target.value);
  };

  return (
    <div className="space-y-3">
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {/* Method Selection */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={method === 'draw' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setMethod('draw');
            setSignatureData('');
          }}
          disabled={disabled}
        >
          Gambar
        </Button>
        <Button
          type="button"
          variant={method === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setMethod('upload');
            setSignatureData('');
          }}
          disabled={disabled}
        >
          Upload
        </Button>
        <Button
          type="button"
          variant={method === 'typed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setMethod('typed');
            setSignatureData('');
          }}
          disabled={disabled}
        >
          Ketik Nama
        </Button>
      </div>

      {/* Signature Input */}
      {method === 'draw' && (
        <div className="space-y-2">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-white">
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className="w-full border border-slate-200 rounded cursor-crosshair bg-white touch-none"
              style={{ touchAction: 'none' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={(e) => {
                e.preventDefault();
                startDrawing(e);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                draw(e);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                stopDrawing();
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearSignature} disabled={disabled}>
              <X className="mr-2 h-3 w-3" />
              Hapus
            </Button>
            {signatureData && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Tanda tangan telah dibuat
              </p>
            )}
          </div>
        </div>
      )}

      {method === 'upload' && (
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={disabled}
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
          {signatureData && (
            <div className="relative">
              <img
                src={signatureData}
                alt="Signature preview"
                className="max-w-full h-32 object-contain border rounded"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setSignatureData('');
                  onChange(null);
                }}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {method === 'typed' && (
        <div className="space-y-2">
          <input
            type="text"
            value={signatureData}
            onChange={handleTypedChange}
            placeholder="Nama lengkap Anda"
            disabled={disabled}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {signatureData && (
            <p className="text-xs text-slate-500">Tanda tangan: {signatureData}</p>
          )}
        </div>
      )}

      {/* GPS Location Display */}
      {showGPS && gpsLocation && (
        <p className="text-xs text-slate-500">
          📍 Lokasi: {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
        </p>
      )}
    </div>
  );
}
