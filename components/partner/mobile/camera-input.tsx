/**
 * Mobile Camera Input Component
 * For uploading documents/images using device camera
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import { useRef, useState } from 'react';

type CameraInputProps = {
  value?: string | File | null;
  onChange?: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  disabled?: boolean;
};

export function CameraInput({
  value,
  onChange,
  accept = 'image/*',
  maxSize = 5,
  label = 'Upload Foto',
  disabled = false,
}: CameraInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setError(null);

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File terlalu besar. Maksimal ${maxSize}MB`);
      return;
    }

    // Check file type
    if (accept.includes('image') && !file.type.startsWith('image/')) {
      setError('File harus berupa gambar');
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    onChange?.(file);
  };

  const handleCameraCapture = () => {
    if (!fileInputRef.current) return;

    // Set capture attribute for mobile camera
    fileInputRef.current.setAttribute('capture', 'environment');
    fileInputRef.current.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      
      <div className="space-y-2">
        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Preview */}
        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Action buttons */}
        {!preview && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCameraCapture}
              disabled={disabled}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Ambil Foto
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex-1"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Pilih File
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}

