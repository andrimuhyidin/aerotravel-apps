'use client';

/**
 * Trip Selector Component
 * For selecting which trip to check-in when there are multiple trips today
 */

import { Calendar, Clock, MapPin, Users } from 'lucide-react';
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
  total_pax?: number | null;
  package?: {
    id: string;
    name: string | null;
    destination: string | null;
    city: string | null;
    duration_days: number | null;
    meeting_point: string | null;
  } | null;
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

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getTripName = (trip: Trip) => {
    return trip.package?.name || trip.trip_code || 'Trip';
  };

  const getDestination = (trip: Trip) => {
    return trip.package?.destination || trip.package?.city || null;
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

  if (!selectedTrip) return null;

  return (
    <div className="mb-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between h-auto py-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn('h-2 w-2 rounded-full mt-1.5 flex-shrink-0', getStatusColor(selectedTrip.status))} />
              <div className="flex-1 min-w-0 text-left">
                <div className="font-semibold text-slate-900 truncate">
                  {getTripName(selectedTrip)}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  {selectedTrip.trip_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(selectedTrip.trip_date)}
                    </span>
                  )}
                  {selectedTrip.departure_time && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(selectedTrip.departure_time)}
                      </span>
                    </>
                  )}
                  {getDestination(selectedTrip) && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{getDestination(selectedTrip)}</span>
                      </span>
                    </>
                  )}
                  {selectedTrip.total_pax && selectedTrip.total_pax > 0 && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {selectedTrip.total_pax} tamu
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Clock className="ml-2 h-4 w-4 flex-shrink-0 text-slate-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-sm">
          {trips.map((trip) => {
            const tripName = getTripName(trip);
            const destination = getDestination(trip);
            
            return (
              <DropdownMenuItem
                key={trip.id}
                onClick={() => handleSelect(trip.id)}
                className={cn(
                  'flex items-start gap-3 p-3',
                  selectedTripId === trip.id && 'bg-emerald-50',
                )}
              >
                <div className={cn('h-2 w-2 rounded-full mt-1.5 flex-shrink-0', getStatusColor(trip.status))} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{tripName}</p>
                  <div className="mt-1.5 space-y-1">
                    {trip.trip_date && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        {formatDate(trip.trip_date)}
                        {trip.departure_time && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(trip.departure_time)}
                            </span>
                          </>
                        )}
                      </p>
                    )}
                    {destination && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{destination}</span>
                      </p>
                    )}
                    {trip.total_pax && trip.total_pax > 0 && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Users className="h-3 w-3 flex-shrink-0" />
                        {trip.total_pax} tamu
                      </p>
                    )}
                    {trip.package?.duration_days && (
                      <p className="text-xs text-slate-500">
                        {trip.package.duration_days} hari
                      </p>
                    )}
                  </div>
                </div>
                {selectedTripId === trip.id && (
                  <span className="text-sm text-emerald-600 font-semibold flex-shrink-0">✓</span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
