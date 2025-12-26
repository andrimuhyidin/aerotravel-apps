/**
 * Mobile Location Picker Component
 * For selecting meeting point location
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { logger } from '@/lib/utils/logger';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useState } from 'react';

type Location = {
  latitude: number;
  longitude: number;
  address?: string;
};

type LocationPickerProps = {
  value?: Location | null;
  onChange?: (location: Location | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function LocationPicker({
  value,
  onChange,
  label = 'Lokasi Meeting Point',
  placeholder = 'Pilih lokasi atau gunakan GPS',
  disabled = false,
}: LocationPickerProps) {
  const [gettingLocation, setGettingLocation] = useState(false);
  const [address, setAddress] = useState(value?.address || '');

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('GPS tidak didukung di browser ini');
      return;
    }

    setGettingLocation(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          // Try to reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`
            );
            const data = await response.json();
            if (data.display_name) {
              location.address = data.display_name;
              setAddress(data.display_name);
            }
          } catch (error) {
            // Non-critical, just use coordinates
            logger.warn('Failed to get address', error);
          }

          onChange?.(location);
          setGettingLocation(false);
        },
        (error) => {
          logger.error('Geolocation error', error);
          alert('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izinkan akses lokasi.');
          setGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      logger.error('Location error', error);
      setGettingLocation(false);
    }
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    if (value) {
      onChange?.({
        ...value,
        address: newAddress,
      });
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={disabled || gettingLocation}
            className="shrink-0"
          >
            {gettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>

        {value && (
          <div className="text-xs text-foreground/70 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>
              {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

