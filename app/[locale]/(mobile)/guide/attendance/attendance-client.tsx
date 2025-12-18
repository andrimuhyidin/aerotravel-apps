'use client';

/**
 * Attendance Client Component
 * GPS Geofencing Check-in/Check-out untuk Guide
 */

import { AlertTriangle, BarChart3, Camera, CheckCircle, Clock, Compass, Loader2, MapPin, Navigation, RefreshCw, Wifi, WifiOff, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
    calculateDistance,
    Coordinates,
    formatDistance,
    getCurrentPosition,
    MeetingPoint,
    performCheckIn,
    performCheckOut,
} from '@/lib/guide';
import { getSyncStatus } from '@/lib/guide/offline-sync';
import { cn } from '@/lib/utils';
import { calculateBearing, getAccuracyStatus, getDirectionName } from '@/lib/utils/gps-helpers';
import { logger } from '@/lib/utils/logger';
import {
    checkGeolocationPermission,
    getPermissionStatusInfo,
    type PermissionState,
} from '@/lib/utils/permissions';

import { GPSTroubleshooting } from '@/components/guide/gps-troubleshooting';
import { AttendanceHistoryCard } from './attendance-history-card';

type Trip = {
  id: string;
  trip_code: string | null;
  trip_date: string | null;
  departure_time: string | null;
  status: string | null;
};

type AttendanceClientProps = {
  tripId: string;
  guideId: string;
  tripStartTime: string;
  meetingPoint: MeetingPoint;
  trips?: Trip[];
};

export function AttendanceClient({
  tripId,
  guideId,
  tripStartTime,
  meetingPoint,
  trips,
}: AttendanceClientProps) {
  const [currentTripId, setCurrentTripId] = useState(tripId);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<{
    hasCheckedIn: boolean;
    hasCheckedOut: boolean;
    isLate: boolean;
    checkInTime?: string;
    checkOutTime?: string;
  } | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(5);
  const [direction, setDirection] = useState<number | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [timeUntilDeparture, setTimeUntilDeparture] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');
  const [syncStatus, setSyncStatus] = useState<{
    pending: number;
    syncing: number;
    failed: number;
  } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState<{
    today: { total: number; onTime: number; late: number };
    week: { total: number; onTime: number; late: number };
    averageCheckInTime: { hours: number; minutes: number } | null;
    streak: number;
  } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const checkPermission = async () => {
    try {
      const status = await checkGeolocationPermission();
      setPermissionStatus(status);
    } catch (error) {
      // Silent fail, will show default state
    }
  };

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };

  const checkSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      // Silent fail
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/guide/attendance/stats?guideId=${encodeURIComponent(guideId)}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleForceSync = async () => {
    try {
      const response = await fetch('/api/guide/sync', { method: 'POST' });
      if (response.ok) {
        await checkSyncStatus();
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Get current position on mount
  useEffect(() => {
    updatePosition();
    fetchAttendanceStatus();
    checkPermission();
    checkSyncStatus();
    checkOnlineStatus();
    fetchStats();

    const onlineHandler = () => {
      setIsOnline(true);
      checkSyncStatus();
    };
    const offlineHandler = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    // Check sync status periodically
    const syncInterval = setInterval(checkSyncStatus, 10000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      clearInterval(syncInterval);
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }, []);

  // Auto-refresh location
  useEffect(() => {
    if (autoRefreshEnabled && !attendanceStatus?.hasCheckedIn) {
      const interval = setInterval(() => {
        setRefreshCountdown((prev) => {
          if (prev <= 1) {
            void updatePosition();
            return 5;
          }
          return prev - 1;
        });
      }, 1000);

      countdownIntervalRef.current = interval;
      return () => clearInterval(interval);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      setRefreshCountdown(5);
    }
  }, [autoRefreshEnabled, attendanceStatus?.hasCheckedIn]);

  // Calculate derived values once
  const effectiveTripId = currentTripId || tripId;
  const currentTrip = trips?.find((t) => t.id === effectiveTripId) || trips?.[0];
  const effectiveTripStartTime = currentTrip?.departure_time 
    ? `${currentTrip.trip_date}T${currentTrip.departure_time}`
    : tripStartTime;

  // Calculate time until departure
  useEffect(() => {
    const calculateTimeUntilDeparture = () => {
      const now = new Date();
      const departure = new Date(effectiveTripStartTime);
      const diff = departure.getTime() - now.getTime();
      setTimeUntilDeparture(diff > 0 ? diff : 0);
    };

    calculateTimeUntilDeparture();
    const interval = setInterval(calculateTimeUntilDeparture, 1000);

    return () => clearInterval(interval);
  }, [effectiveTripStartTime]);

  // Calculate direction to meeting point
  useEffect(() => {
    if (position) {
      const bearing = calculateBearing(
        { latitude: position.latitude, longitude: position.longitude },
        meetingPoint.coordinates,
      );
      setDirection(bearing);
    }
  }, [position, meetingPoint]);

  const fetchAttendanceStatus = async () => {
    try {
      const tripIdToFetch = currentTripId || tripId;
      const response = await fetch(
        `/api/guide/attendance/status?tripId=${encodeURIComponent(tripIdToFetch)}&guideId=${encodeURIComponent(guideId)}`
      );
      if (response.ok) {
        const data = await response.json();
        setAttendanceStatus({
          hasCheckedIn: data.checkedIn,
          hasCheckedOut: data.checkedOut,
          isLate: data.isLate,
          checkInTime: data.checkInTime,
          checkOutTime: data.checkOutTime,
        });
      }
    } catch (err) {
      // Silent fail, will show default state
    }
  };

  const updatePosition = async () => {
    try {
      const pos = await getCurrentPosition();
      setPosition(pos);
      setError(null);

      // Calculate distance to meeting point
      const dist = calculateDistance(pos, meetingPoint.coordinates);
      setDistance(dist);

      // Reset countdown after update
      setRefreshCountdown(5);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Tidak dapat mengakses lokasi. Pastikan GPS perangkat dan izin lokasi browser sudah aktif.';
      setError(message);
    }
  };

  const handlePhotoCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera on mobile
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Compress image if too large
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxWidth = 1024;
            const maxHeight = 1024;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                  setPhotoFile(compressedFile);
                  setPhotoPreview(URL.createObjectURL(compressedFile));
                }
              },
              'image/jpeg',
              0.8,
            );
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
  };

  const handleCheckIn = async () => {
    if (!position) {
      setError('Lokasi tidak tersedia');
      return;
    }

    setLoading(true);
    setResult(null);

    const tripIdToCheck = currentTripId || tripId;
    
    // Upload photo if available
    let photoUrl: string | null = null;
    if (photoFile) {
      try {
        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('tripId', tripIdToCheck);
        formData.append('type', 'check_in_evidence');

        const uploadResponse = await fetch('/api/guide/attendance/check-in-photo', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          photoUrl = uploadData.url;
        }
      } catch (error) {
        // Continue with check-in even if photo upload fails
        logger.error('[Attendance] Photo upload failed', error);
      }
    }

    const checkInResult = await performCheckIn(tripIdToCheck, guideId, position, meetingPoint.id);

    setResult(checkInResult);
    setLoading(false);

    if (checkInResult.success) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }
      await fetchAttendanceStatus();
      setAutoRefreshEnabled(false); // Stop auto-refresh after check-in
      handleRemovePhoto(); // Clear photo after successful check-in
    }
  };

  const handleCheckOut = async () => {
    if (!position) {
      setError('Lokasi tidak tersedia');
      return;
    }

    setLoading(true);

    const tripIdToCheck = currentTripId || tripId;
    const checkOutResult = await performCheckOut(tripIdToCheck, guideId, position);

    setResult(checkOutResult);
    setLoading(false);

    if (checkOutResult.success) {
      setAttendanceStatus((prev) => ({
        ...prev,
        hasCheckedIn: true,
        hasCheckedOut: true,
        isLate: prev?.isLate ?? false,
        checkOutTime: new Date().toISOString(),
      }));
    }
  };

  const isWithinRadius = distance !== null && distance <= meetingPoint.radiusMeters;

  // Check-in window validation: allow check-in 2 hours before to 1 hour after trip start
  const checkInWindowStart = new Date(effectiveTripStartTime);
  checkInWindowStart.setHours(checkInWindowStart.getHours() - 2);
  const checkInWindowEnd = new Date(effectiveTripStartTime);
  checkInWindowEnd.setHours(checkInWindowEnd.getHours() + 1);
  const now = new Date();
  const isWithinCheckInWindow = now >= checkInWindowStart && now <= checkInWindowEnd;
  const isTooEarly = now < checkInWindowStart;
  const isTooLate = now > checkInWindowEnd;
  const canCheckIn = !attendanceStatus?.hasCheckedIn && isWithinRadius && isWithinCheckInWindow;
  const canCheckOut = attendanceStatus?.hasCheckedIn && !attendanceStatus?.hasCheckedOut;

  // Update trip when selection changes
  useEffect(() => {
    if (currentTripId !== tripId) {
      setAttendanceStatus(null);
      void fetchAttendanceStatus();
      void updatePosition();
    }
  }, [currentTripId, tripId]);

  return (
    <div className="space-y-4">
      {/* Trip Selector */}
      {trips && trips.length > 1 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currentTrip?.trip_code || 'Pilih Trip'}</span>
                    <span className="text-xs text-slate-500">
                      {currentTrip?.departure_time?.slice(0, 5) || 'TBA'}
                    </span>
                  </div>
                  <Clock className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-full">
                {trips.map((trip) => (
                  <DropdownMenuItem
                    key={trip.id}
                    onClick={() => {
                      setCurrentTripId(trip.id);
                    }}
                    className={cn(
                      'flex items-center gap-2',
                      currentTripId === trip.id && 'bg-slate-100',
                    )}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{trip.trip_code}</p>
                      <p className="text-xs text-slate-600">
                        {trip.departure_time?.slice(0, 5) || 'TBA'}
                      </p>
                    </div>
                    {currentTripId === trip.id && (
                      <span className="text-xs text-emerald-600">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      )}

      {/* Attendance Statistics Widget */}
      {stats && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Statistik Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/60 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.today.total}</p>
                <p className="mt-1 text-xs text-slate-600">Total Check-in</p>
              </div>
              <div className="rounded-lg bg-white/60 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.today.onTime}</p>
                <p className="mt-1 text-xs text-slate-600">On Time</p>
              </div>
              <div className="rounded-lg bg-white/60 p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{stats.today.late}</p>
                <p className="mt-1 text-xs text-slate-600">Terlambat</p>
              </div>
            </div>
            {(stats.streak > 0 || stats.averageCheckInTime) && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 text-sm">
                {stats.streak > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">🔥 Streak:</span>
                    <span className="text-slate-700">{stats.streak} hari berturut-turut</span>
                  </div>
                )}
                {stats.averageCheckInTime && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">⏰ Rata-rata:</span>
                    <span className="text-slate-700">
                      {stats.averageCheckInTime.hours.toString().padStart(2, '0')}:
                      {stats.averageCheckInTime.minutes.toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attendance History Card */}
      {attendanceStatus?.hasCheckedOut && (
        <AttendanceHistoryCard guideId={guideId} currentTripId={effectiveTripId} />
      )}

      {/* Attendance Status Card */}
      {attendanceStatus && (
        <Card
          className={cn(
            'border-0 shadow-sm',
            attendanceStatus.hasCheckedOut
              ? 'bg-emerald-50 border-emerald-200'
              : attendanceStatus.hasCheckedIn
                ? 'bg-blue-50 border-blue-200'
                : 'bg-slate-50',
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  attendanceStatus.hasCheckedOut
                    ? 'bg-emerald-500'
                    : attendanceStatus.hasCheckedIn
                      ? 'bg-blue-500'
                      : 'bg-slate-400',
                )}
              >
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {attendanceStatus.hasCheckedOut
                    ? 'Absensi Selesai'
                    : attendanceStatus.hasCheckedIn
                      ? 'Sudah Check-In'
                      : 'Belum Check-In'}
                </p>
                {attendanceStatus.checkInTime && (
                  <p className="mt-0.5 text-xs text-slate-600">
                    Check-in:{' '}
                    {new Date(attendanceStatus.checkInTime).toLocaleString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
                {attendanceStatus.checkOutTime && (
                  <p className="mt-0.5 text-xs text-slate-600">
                    Check-out:{' '}
                    {new Date(attendanceStatus.checkOutTime).toLocaleString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Late Warning Card */}
      {timeUntilDeparture !== null && timeUntilDeparture > 0 && timeUntilDeparture <= 10 * 60 * 1000 && !attendanceStatus?.hasCheckedIn && (
        <Card className="border-0 border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                {timeUntilDeparture <= 0 ? 'Anda terlambat!' : `Waktu tersisa: ${Math.floor(timeUntilDeparture / 60000)} menit`}
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                {timeUntilDeparture <= 0 
                  ? 'Potongan denda akan diterapkan'
                  : 'Segera check-in untuk menghindari denda keterlambatan'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <MapPin className="h-5 w-5 text-emerald-600" />
              Lokasi GPS
            </CardTitle>
            {autoRefreshEnabled && !attendanceStatus?.hasCheckedIn && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Auto-refresh: {refreshCountdown}s</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setAutoRefreshEnabled(false)}
                >
                  Stop
                </Button>
              </div>
            )}
            {!autoRefreshEnabled && !attendanceStatus?.hasCheckedIn && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setAutoRefreshEnabled(true)}
              >
                Enable Auto
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-lg bg-red-50 p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          ) : position ? (
            <div className="space-y-3">
              {/* GPS Accuracy Indicator */}
              {position.accuracy !== undefined && (
                <div className={cn(
                  'rounded-lg border p-3',
                  getAccuracyStatus(position.accuracy).level === 'high' && 'border-emerald-200 bg-emerald-50',
                  getAccuracyStatus(position.accuracy).level === 'medium' && 'border-amber-200 bg-amber-50',
                  getAccuracyStatus(position.accuracy).level === 'low' && 'border-red-200 bg-red-50',
                  getAccuracyStatus(position.accuracy).level === 'unknown' && 'border-slate-200 bg-slate-50',
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-600">Akurasi GPS</p>
                      <p className={cn(
                        'mt-0.5 text-sm font-semibold',
                        getAccuracyStatus(position.accuracy).level === 'high' && 'text-emerald-900',
                        getAccuracyStatus(position.accuracy).level === 'medium' && 'text-amber-900',
                        getAccuracyStatus(position.accuracy).level === 'low' && 'text-red-900',
                      )}>
                        {getAccuracyStatus(position.accuracy).label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {getAccuracyStatus(position.accuracy).description}
                      </p>
                    </div>
                    {position.accuracy && position.accuracy > meetingPoint.radiusMeters && (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  {position.accuracy && position.accuracy > meetingPoint.radiusMeters && (
                    <p className="mt-2 text-xs text-amber-700">
                      ⚠ Akurasi GPS lebih besar dari radius check-in. Pindah ke area terbuka untuk akurasi lebih baik.
                    </p>
                  )}
                </div>
              )}

              {/* Distance & Direction */}
              {distance !== null && (
                <>
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-xl p-3',
                      isWithinRadius
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-amber-50 border border-amber-200',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        isWithinRadius ? 'bg-emerald-500' : 'bg-amber-500',
                      )}
                    >
                      {direction !== null ? (
                        <Compass 
                          className="h-5 w-5 text-white" 
                          style={{ transform: `rotate(${direction}deg)` }}
                        />
                      ) : (
                        <Navigation className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          isWithinRadius ? 'text-emerald-900' : 'text-amber-900',
                        )}
                      >
                        {formatDistance(distance)} dari {meetingPoint.name}
                      </p>
                      {direction !== null && (
                        <p
                          className={cn(
                            'mt-0.5 text-xs',
                            isWithinRadius ? 'text-emerald-700' : 'text-amber-700',
                          )}
                        >
                          Arah: {getDirectionName(direction)} ({direction}°)
                        </p>
                      )}
                      <p
                        className={cn(
                          'mt-0.5 text-xs',
                          isWithinRadius ? 'text-emerald-700' : 'text-amber-700',
                        )}
                      >
                        {isWithinRadius ? '✓ Dalam radius check-in' : '⚠ Di luar radius check-in'}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar showing proximity */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Jarak ke meeting point</span>
                      <span className="font-medium text-slate-900">
                        {Math.round((1 - Math.min(distance / (meetingPoint.radiusMeters * 2), 1)) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min((1 - distance / (meetingPoint.radiusMeters * 2)) * 100, 100)} 
                      className="h-2"
                    />
                  </div>
                </>
              )}

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">Koordinat GPS</p>
                <p className="mt-1 font-mono text-xs text-slate-700">
                  {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 rounded-lg bg-slate-50 p-4">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              <span className="text-sm text-slate-600">Mendapatkan lokasi GPS...</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={updatePosition}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Perbarui Lokasi
            </Button>
            {direction !== null && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${meetingPoint.coordinates.latitude},${meetingPoint.coordinates.longitude}`;
                  window.open(url, '_blank');
                }}
              >
                <Navigation className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Permission Status Helper */}
          {permissionStatus !== 'granted' && (
            <div className={cn(
              'rounded-lg border p-3',
              permissionStatus === 'denied' && 'border-red-200 bg-red-50',
              permissionStatus === 'prompt' && 'border-amber-200 bg-amber-50',
            )}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={cn(
                  'h-5 w-5 flex-shrink-0 mt-0.5',
                  permissionStatus === 'denied' ? 'text-red-600' : 'text-amber-600',
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-semibold',
                    permissionStatus === 'denied' ? 'text-red-900' : 'text-amber-900',
                  )}>
                    {getPermissionStatusInfo(permissionStatus).label}
                  </p>
                  <p className={cn(
                    'mt-1 text-xs',
                    permissionStatus === 'denied' ? 'text-red-700' : 'text-amber-700',
                  )}>
                    {getPermissionStatusInfo(permissionStatus).description}
                  </p>
                  {permissionStatus === 'denied' && (
                    <p className="mt-2 text-xs text-red-600">
                      Buka pengaturan browser untuk mengaktifkan izin lokasi. Pastikan izin diatur ke &quot;Izinkan semua waktu&quot; untuk check-in otomatis.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GPS Troubleshooting - Show when there's GPS error */}
      {error && (
        <div className="mb-4">
          <GPSTroubleshooting />
        </div>
      )}

      {/* Meeting Point Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <MapPin className="h-5 w-5 text-blue-600" />
            Informasi Trip
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-600">Titik Kumpul</p>
            <p className="mt-1 font-semibold text-slate-900">{meetingPoint.name}</p>
            <p className="mt-1 text-xs text-slate-600">
              Radius check-in: <span className="font-medium">{meetingPoint.radiusMeters}m</span>
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <Clock className="h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-600">Waktu Keberangkatan</p>
              <p className="mt-0.5 font-semibold text-slate-900">
                {new Date(effectiveTripStartTime).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                {new Date(effectiveTripStartTime).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Message */}
      {result && (
        <Card
          className={cn(
            'border-0 shadow-sm',
            result.success
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-red-200 bg-red-50',
          )}
        >
          <CardContent className="flex items-start gap-3 p-4">
            {result.success ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
            )}
            <p
              className={cn(
                'flex-1 text-sm font-medium',
                result.success ? 'text-emerald-700' : 'text-red-700',
              )}
            >
              {result.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Photo Evidence (Optional) */}
      {!attendanceStatus?.hasCheckedIn && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Camera className="h-5 w-5 text-blue-600" />
              Foto Bukti Check-in (Opsional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Check-in evidence"
                  className="w-full rounded-lg object-cover"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 bg-white/80 hover:bg-white"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={handlePhotoCapture}
              >
                <Camera className="mr-2 h-4 w-4" />
                Ambil Foto
              </Button>
            )}
            <p className="text-xs text-slate-500">
              Foto akan digunakan sebagai bukti visual check-in
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {!attendanceStatus?.hasCheckedIn && (
          <Button
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
            size="lg"
            disabled={!canCheckIn || loading}
            onClick={handleCheckIn}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Check-In Sekarang
              </>
            )}
          </Button>
        )}

        {attendanceStatus?.hasCheckedIn && !attendanceStatus?.hasCheckedOut && (
          <Button
            className="w-full bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
            size="lg"
            disabled={!canCheckOut || loading}
            onClick={handleCheckOut}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Check-Out
              </>
            )}
          </Button>
        )}

        {attendanceStatus?.hasCheckedOut && (
          <Card className="border-0 bg-emerald-50 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <p className="text-base font-semibold text-emerald-900">Absensi Selesai</p>
              <p className="mt-1 text-sm text-emerald-700">
                Check-in dan check-out Anda telah tercatat
              </p>
            </CardContent>
          </Card>
        )}

        {!canCheckIn && !attendanceStatus?.hasCheckedIn && distance !== null && (
          <div className="space-y-2">
            {!isWithinRadius && (
              <div className="rounded-lg bg-amber-50 p-3 text-center">
                <p className="text-sm font-medium text-amber-800">
                  Anda harus berada dalam radius {meetingPoint.radiusMeters}m dari {meetingPoint.name}{' '}
                  untuk melakukan check-in
                </p>
              </div>
            )}
            {isWithinRadius && isTooEarly && (
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <p className="text-sm font-medium text-blue-800">
                  Check-in hanya dapat dilakukan maksimal 2 jam sebelum waktu keberangkatan
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  Waktu check-in tersedia mulai:{' '}
                  {checkInWindowStart.toLocaleString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
            )}
            {isWithinRadius && isTooLate && (
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <p className="text-sm font-medium text-red-800">
                  Window waktu check-in sudah berlalu
                </p>
                <p className="mt-1 text-xs text-red-600">
                  Check-in hanya dapat dilakukan maksimal 1 jam setelah waktu keberangkatan. Silakan hubungi Ops jika perlu check-in manual.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Offline Queue Status */}
      {syncStatus && (syncStatus.pending > 0 || syncStatus.failed > 0 || !isOnline) && (
        <Card className="border-0 shadow-sm border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {!isOnline ? (
                <WifiOff className="h-5 w-5 flex-shrink-0 text-amber-600" />
              ) : (
                <Wifi className="h-5 w-5 flex-shrink-0 text-amber-600" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  {!isOnline ? 'Mode Offline' : 'Data Pending Sync'}
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  {!isOnline 
                    ? 'Tidak ada koneksi internet. Data akan tersinkron saat online.'
                    : `${syncStatus.pending} data menunggu sinkron${syncStatus.failed > 0 ? `, ${syncStatus.failed} gagal` : ''}`
                  }
                </p>
              </div>
              {isOnline && (syncStatus.pending > 0 || syncStatus.failed > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleForceSync}
                  className="flex-shrink-0"
                >
                  Sync Sekarang
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
