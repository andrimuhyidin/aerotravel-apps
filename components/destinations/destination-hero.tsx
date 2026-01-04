/**
 * Destination Hero Component
 * Hero section for destination detail page
 */

import { Calendar, MapPin, Thermometer } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { Destination } from '@/lib/destinations/data';

type DestinationHeroProps = {
  destination: Destination;
};

export function DestinationHero({ destination }: DestinationHeroProps) {
  return (
    <div className="relative">
      {/* Hero Image */}
      <div className="relative h-[40vh] min-h-[300px] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400/30 to-teal-500/30">
        <div className="flex h-full items-center justify-center text-9xl">
          🏝️
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Title & Province */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <Badge variant="secondary" className="mb-3 bg-white/20 backdrop-blur">
            <MapPin className="mr-1 h-3 w-3" />
            {destination.province}
          </Badge>
          <h1 className="mb-2 text-4xl font-bold drop-shadow-lg">
            {destination.name}
          </h1>
          <p className="max-w-2xl text-lg text-white/90 drop-shadow">
            {destination.description}
          </p>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Best Time */}
        <div className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-medium text-muted-foreground">
              Waktu Terbaik
            </h3>
            <p className="font-semibold text-foreground">
              {destination.bestTime}
            </p>
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900">
            <Thermometer className="h-5 w-5 text-orange-600 dark:text-orange-300" />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-medium text-muted-foreground">
              Suhu Rata-rata
            </h3>
            <p className="font-semibold text-foreground">
              {destination.weatherInfo.avgTemperature}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

