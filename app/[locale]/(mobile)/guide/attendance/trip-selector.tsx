'use client';

/**
 * Trip Selector Component
 * For selecting which trip to check-in when there are multiple trips today
 */

import { Clock } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Trip = {
  id: string;
  trip_code: string | null;
  trip_date: string | null;
  departure_time: string | null;
  status: string | null;
};

type TripSelectorProps = {
  trips: Trip[];
  onTripSelect: (tripId: string) => void;
};

export function TripSelector({ trips, onTripSelect }: TripSelectorProps) {
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');

  const selectedTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  const handleSelect = (tripId: string) => {
    setSelectedTripId(tripId);
    onTripSelect(tripId);
  };

  const formatTime = (time: string | null | undefined) => {
    if (!time) return 'TBA';
    return time.slice(0, 5);
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'on_trip':
        return 'bg-blue-500';
      case 'preparing':
        return 'bg-amber-500';
      case 'scheduled':
        return 'bg-slate-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="mb-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('h-2 w-2 rounded-full', getStatusColor(selectedTrip?.status))} />
              <span className="font-medium">{selectedTrip?.trip_code || 'Pilih Trip'}</span>
            </div>
            <Clock className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-full">
          {trips.map((trip) => (
            <DropdownMenuItem
              key={trip.id}
              onClick={() => handleSelect(trip.id)}
              className={cn(
                'flex items-center gap-2',
                selectedTripId === trip.id && 'bg-slate-100',
              )}
            >
              <div className={cn('h-2 w-2 rounded-full', getStatusColor(trip.status))} />
              <div className="flex-1">
                <p className="font-medium">{trip.trip_code}</p>
                <p className="text-xs text-slate-600">
                  <Clock className="mr-1 inline h-3 w-3" />
                  {formatTime(trip.departure_time)}
                </p>
              </div>
              {selectedTripId === trip.id && (
                <span className="text-xs text-emerald-600">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
