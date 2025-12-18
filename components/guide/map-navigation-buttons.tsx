'use client';

/**
 * Map Navigation Buttons Component
 * Buttons to open location in Google Maps or Waze
 */

import { MapPin } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { openInGoogleMaps, openInWaze } from '@/lib/utils/maps';

type MapNavigationButtonsProps = {
  latitude: number;
  longitude: number;
  label?: string;
  className?: string;
};

export function MapNavigationButtons({
  latitude,
  longitude,
  label,
  className,
}: MapNavigationButtonsProps) {
  const [provider, setProvider] = useState<'google' | 'waze' | null>(null);

  const handleGoogleMaps = () => {
    openInGoogleMaps(latitude, longitude, label);
    setProvider('google');
  };

  const handleWaze = () => {
    openInWaze(latitude, longitude, label);
    setProvider('waze');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
          aria-label="Buka di Maps"
        >
          <MapPin className="mr-2 h-4 w-4" />
          Buka di Maps
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleGoogleMaps}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Google Maps</span>
            {provider === 'google' && (
              <span className="ml-auto text-xs text-slate-500">Terbuka</span>
            )}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWaze}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Waze</span>
            {provider === 'waze' && (
              <span className="ml-auto text-xs text-slate-500">Terbuka</span>
            )}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
