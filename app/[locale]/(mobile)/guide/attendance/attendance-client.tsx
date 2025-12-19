'use client';

/**
 * Attendance Client Component
 * GPS Geofencing Check-in/Check-out untuk Guide
 */

import { AlertTriangle, BarChart3, Camera, CheckCircle, Compass, Loader2, MapPin, Navigation, RefreshCw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
    calculateDistance,
    Coordinates,
    formatDistance,
    getCurrentPosition,
    MeetingPoint,
    performCheckIn,
    performCheckOut,
} from '@/lib/guide';
import { cn } from '@/lib/utils';
import { calculateBearing, getAccuracyStatus, getDirectionName } from '@/lib/utils/gps-helpers';
import { logger } from '@/lib/utils/logger';
import {
    checkGeolocationPermission,
    type PermissionState
} from '@/lib/utils/permissions';

import { GPSTroubleshooting } from '@/components/guide/gps-troubleshooting';
import { AttendanceHistoryCard } from './attendance-history-card';
import { TripSelector } from './trip-selector';

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

type AttendanceClientProps = {
  tripId: string;
  guideId: string;
  tripStartTime: string;
  meetingPoint: MeetingPoint;
  trips?: Trip[];
  locale?: string;
};

export function AttendanceClient({
  tripId,
  guideId,
  tripStartTime,
  meetingPoint,
  trips,
  locale = 'id',
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
  const [, setPermissionStatus] = useState<PermissionState>('prompt');
  const [stats, setStats] = useState<{
    today: { total: number; onTime: number; late: number };
    week: { total: number; onTime: number; late: number };
    averageCheckInTime: { hours: number; minutes: number } | null;
    streak: number;
  } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [happiness, setHappiness] = useState<number | null>(null); // 1-5 scale
  const [description, setDescription] = useState<string>('');
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [showCheckOutForm, setShowCheckOutForm] = useState(false);

  const checkPermission = async () => {
    try {
      const status = await checkGeolocationPermission();
      setPermissionStatus(status);
    } catch (_error) {
      // Silent fail, will show default state
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/guide/attendance/stats?guideId=${encodeURIComponent(guideId)}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (_error) {
      // Silent fail
    }
  };

  // Get current position on mount
  useEffect(() => {
    updatePosition();
    fetchAttendanceStatus();
    checkPermission();
    fetchStats();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
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
    } catch (_err) {
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

  const capturePhoto = (): Promise<File> => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Use back camera on mobile
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            // Compress image if too large
            const reader = new FileReader();
            reader.onload = async (event) => {
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
                  async (blob) => {
                    if (blob) {
                      const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                      resolve(compressedFile);
                    } else {
                      reject(new Error('Failed to compress image'));
                    }
                  },
                  'image/jpeg',
                  0.8,
                );
              };
              img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('No file selected'));
        }
      };
      input.oncancel = () => {
        reject(new Error('Photo capture cancelled'));
      };
      input.click();
    });
  };

  const _handlePhotoCapture = async () => {
    try {
      const file = await capturePhoto();
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      
      // Analyze photo for happiness
      setAnalyzingPhoto(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const analyzeResponse = await fetch('/api/guide/attendance/analyze-photo', {
          method: 'POST',
          body: formData,
        });

        if (analyzeResponse.ok) {
          const analyzeData = await analyzeResponse.json();
          if (analyzeData.happiness !== undefined) {
            setHappiness(analyzeData.happiness);
          }
        }
      } catch (error) {
        logger.warn('[Attendance] Photo analysis failed', { error });
      } finally {
        setAnalyzingPhoto(false);
      }
    } catch (error) {
      // User cancelled or error occurred - silently handle
      logger.warn('[Attendance] Photo capture cancelled or failed', { error });
    }
  };

  const handleStartCheckIn = async () => {
    if (!position) {
      setError('Lokasi tidak tersedia');
      return;
    }

    // Check if within radius and check-in window first
    if (!isWithinRadius) {
      setError(`Anda harus berada dalam radius ${meetingPoint.radiusMeters}m dari ${meetingPoint.name}`);
      return;
    }

    if (isTooEarly || isTooLate || !isWithinCheckInWindow) {
      setError('Waktu check-in tidak valid');
      return;
    }

    try {
      // Capture photo first
      const file = await capturePhoto();
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      
      // Analyze photo for happiness
      setAnalyzingPhoto(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const analyzeResponse = await fetch('/api/guide/attendance/analyze-photo', {
          method: 'POST',
          body: formData,
        });

        if (analyzeResponse.ok) {
          const analyzeData = await analyzeResponse.json();
          if (analyzeData.happiness !== undefined) {
            setHappiness(analyzeData.happiness);
          }
        }
      } catch (error) {
        logger.warn('[Attendance] Photo analysis failed', { error });
      } finally {
        setAnalyzingPhoto(false);
      }

      // Show form dialog
      setShowCheckInForm(true);
    } catch (error) {
      // User cancelled photo capture
      logger.warn('[Attendance] Check-in cancelled - photo not captured', { error });
    }
  };

  const handleStartCheckOut = async () => {
    if (!position) {
      setError('Lokasi tidak tersedia');
      return;
    }

    try {
      // For check-out, photo is optional but we'll still capture it
      const file = await capturePhoto();
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      
      // Show form dialog (check-out may have different fields in the future)
      setShowCheckOutForm(true);
    } catch (error) {
      // User cancelled photo capture - we can still proceed with check-out
      // but for now, we'll require it
      logger.warn('[Attendance] Check-out cancelled - photo not captured', { error });
    }
  };

  const _handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setHappiness(null);
    setDescription('');
  };

  const handleCheckIn = async () => {
    if (!position) {
      setError('Lokasi tidak tersedia');
      return;
    }

    // Validate required fields
    if (!photoFile) {
      setResult({ success: false, message: 'Foto check-in wajib diambil' });
      return;
    }

    if (happiness === null) {
      setResult({ success: false, message: 'Pilih level kebahagiaan terlebih dahulu' });
      return;
    }

    if (!description.trim()) {
      setResult({ success: false, message: 'Deskripsi wajib diisi' });
      return;
    }

    setLoading(true);
    setResult(null);
    setShowCheckInForm(false); // Close dialog

    const tripIdToCheck = currentTripId || tripId;

    // Upload photo first
    let photoUrl: string | null = null;
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
      } else {
        setResult({ success: false, message: 'Gagal mengunggah foto. Pastikan foto sudah diambil.' });
        setLoading(false);
        return;
      }
    } catch (_error) {
      setResult({ success: false, message: 'Gagal mengunggah foto. Periksa koneksi internet.' });
      setLoading(false);
      return;
    }

    // Perform check-in with photo, happiness, and description
    const checkInResult = await performCheckIn(
      tripIdToCheck,
      guideId,
      position,
      meetingPoint.id,
      photoUrl ?? undefined,
      happiness ?? undefined,
      description.trim(),
    );

    setResult(checkInResult);
    setLoading(false);

    if (checkInResult.success) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }
      await fetchAttendanceStatus();
      setAutoRefreshEnabled(false); // Stop auto-refresh after check-in
      // Clear form after successful check-in
      setPhotoFile(null);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoPreview(null);
      setHappiness(null);
      setDescription('');
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

  // Handle trip selection
  const handleTripSelect = (newTripId: string) => {
    setCurrentTripId(newTripId);
    setAttendanceStatus(null);
    void fetchAttendanceStatus();
    void updatePosition();
  };

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
            <TripSelector trips={trips} onTripSelect={handleTripSelect} />
          </CardContent>
        </Card>
      )}

      {/* Attendance Status - Compact */}
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
            <div className="flex items-center justify-between">
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
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {attendanceStatus.hasCheckedOut
                      ? 'Absensi Selesai'
                      : attendanceStatus.hasCheckedIn
                        ? 'Sudah Check-In'
                        : 'Belum Check-In'}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-600">
                    {attendanceStatus.checkInTime && (
                      <span>
                        Check-in: {new Date(attendanceStatus.checkInTime).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    {attendanceStatus.checkOutTime && (
                      <span>
                        Check-out: {new Date(attendanceStatus.checkOutTime).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {attendanceStatus.isLate && (
                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                  Terlambat
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Late Warning - Compact */}
      {timeUntilDeparture !== null && timeUntilDeparture > 0 && timeUntilDeparture <= 10 * 60 * 1000 && !attendanceStatus?.hasCheckedIn && (
        <Card className="border-0 border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="flex items-center gap-3 p-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="flex-1 min-w-0">
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

      {/* Statistics - Only show if not checked in yet */}
      {stats && !attendanceStatus?.hasCheckedIn && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Statistik Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-slate-50 p-2.5 text-center">
                <p className="text-xl font-bold text-slate-900">{stats.today.total}</p>
                <p className="mt-0.5 text-xs text-slate-600">Total</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2.5 text-center">
                <p className="text-xl font-bold text-emerald-600">{stats.today.onTime}</p>
                <p className="mt-0.5 text-xs text-slate-600">On Time</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2.5 text-center">
                <p className="text-xl font-bold text-amber-600">{stats.today.late}</p>
                <p className="mt-0.5 text-xs text-slate-600">Terlambat</p>
              </div>
            </div>
            {(stats.streak > 0 || stats.averageCheckInTime) && (
              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2 text-xs">
                {stats.streak > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">🔥</span>
                    <span className="text-slate-600">{stats.streak} hari streak</span>
                  </div>
                )}
                {stats.averageCheckInTime && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">⏰</span>
                    <span className="text-slate-600">
                      Rata-rata {stats.averageCheckInTime.hours.toString().padStart(2, '0')}:
                      {stats.averageCheckInTime.minutes.toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attendance History - Only show after checkout */}
      {attendanceStatus?.hasCheckedOut && (
        <AttendanceHistoryCard guideId={guideId} currentTripId={effectiveTripId} locale={locale} />
      )}

      {/* Location & Meeting Point - Consolidated */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <MapPin className="h-5 w-5 text-emerald-600" />
              Lokasi & Meeting Point
            </CardTitle>
            {!attendanceStatus?.hasCheckedIn && autoRefreshEnabled && (
              <span className="text-xs text-slate-500">Auto: {refreshCountdown}s</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meeting Point Info - Compact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-2.5">
              <p className="text-xs font-medium text-slate-600">Meeting Point</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 line-clamp-1">{meetingPoint.name}</p>
              <p className="mt-0.5 text-xs text-slate-600">Radius: {meetingPoint.radiusMeters}m</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5">
              <p className="text-xs font-medium text-slate-600">Waktu Keberangkatan</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {new Date(effectiveTripStartTime).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                {new Date(effectiveTripStartTime).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          </div>

          {/* GPS Status */}
          {error ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-900">Error GPS</p>
                    <p className="mt-0.5 text-xs text-red-700">{error}</p>
                  </div>
                </div>
              </div>
              <GPSTroubleshooting />
            </div>
          ) : position ? (
            <div className="space-y-3">
              {/* Distance & Direction - Main Focus */}
              {distance !== null && (
                <div
                  className={cn(
                    'relative overflow-hidden rounded-xl p-4',
                    isWithinRadius
                      ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200'
                      : 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full shadow-sm',
                        isWithinRadius ? 'bg-emerald-500' : 'bg-amber-500',
                      )}
                    >
                      {direction !== null ? (
                        <Compass 
                          className="h-6 w-6 text-white" 
                          style={{ transform: `rotate(${direction}deg)` }}
                        />
                      ) : (
                        <Navigation className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-lg font-bold',
                          isWithinRadius ? 'text-emerald-900' : 'text-amber-900',
                        )}
                      >
                        {formatDistance(distance)}
                      </p>
                      <p className={cn(
                        'mt-0.5 text-xs font-medium',
                        isWithinRadius ? 'text-emerald-700' : 'text-amber-700',
                      )}>
                        {isWithinRadius ? '✓ Dalam radius' : '⚠ Di luar radius'}
                      </p>
                      {direction !== null && (
                        <p className={cn(
                          'mt-1 text-xs',
                          isWithinRadius ? 'text-emerald-600' : 'text-amber-600',
                        )}>
                          Arah: {getDirectionName(direction)}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <Progress 
                      value={Math.min((1 - distance / (meetingPoint.radiusMeters * 2)) * 100, 100)} 
                      className={cn(
                        'h-1.5',
                        isWithinRadius ? 'bg-emerald-200' : 'bg-amber-200',
                      )}
                    />
                  </div>
                </div>
              )}

              {/* GPS Accuracy - Compact */}
              {position.accuracy !== undefined && (
                <div className={cn(
                  'flex items-center justify-between rounded-lg border px-3 py-2',
                  getAccuracyStatus(position.accuracy).level === 'high' && 'border-emerald-200 bg-emerald-50',
                  getAccuracyStatus(position.accuracy).level === 'medium' && 'border-amber-200 bg-amber-50',
                  getAccuracyStatus(position.accuracy).level === 'low' && 'border-red-200 bg-red-50',
                )}>
                  <div>
                    <p className="text-xs font-medium text-slate-600">Akurasi GPS</p>
                    <p className={cn(
                      'text-sm font-semibold',
                      getAccuracyStatus(position.accuracy).level === 'high' && 'text-emerald-900',
                      getAccuracyStatus(position.accuracy).level === 'medium' && 'text-amber-900',
                      getAccuracyStatus(position.accuracy).level === 'low' && 'text-red-900',
                    )}>
                      {getAccuracyStatus(position.accuracy).label}
                    </p>
                  </div>
                  {position.accuracy && (
                    <p className="text-xs text-slate-600">
                      ±{Math.round(position.accuracy)}m
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 p-4">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              <span className="text-sm text-slate-600">Mendapatkan lokasi GPS...</span>
            </div>
          )}

          {/* Action Buttons */}
          {position && (
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
                  title="Buka di Maps"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              )}
              {!attendanceStatus?.hasCheckedIn && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  title={autoRefreshEnabled ? 'Nonaktifkan auto-refresh' : 'Aktifkan auto-refresh'}
                >
                  {autoRefreshEnabled ? (
                    <span className="text-xs">⏸</span>
                  ) : (
                    <span className="text-xs">▶</span>
                  )}
                </Button>
              )}
            </div>
          )}
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


      {/* Action Buttons */}
      <div className="space-y-3">
        {!attendanceStatus?.hasCheckedIn && (
          <Button
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
            size="lg"
            disabled={!canCheckIn || loading}
            onClick={handleStartCheckIn}
          >
            <Camera className="mr-2 h-5 w-5" />
            Check-In Sekarang
          </Button>
        )}

        {attendanceStatus?.hasCheckedIn && !attendanceStatus?.hasCheckedOut && (
          <Button
            className="w-full bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
            size="lg"
            disabled={!canCheckOut || loading}
            onClick={handleStartCheckOut}
          >
            <Camera className="mr-2 h-5 w-5" />
            Check-Out
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

        {/* Check-in Status Messages - Only show critical issues */}
        {!canCheckIn && !attendanceStatus?.hasCheckedIn && distance !== null && (
          <>
            {!isWithinRadius && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">
                      Di luar radius check-in
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700">
                      Pindah ke dalam radius {meetingPoint.radiusMeters}m dari {meetingPoint.name}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {isWithinRadius && (isTooEarly || isTooLate) && (
              <div className={cn(
                'rounded-lg border p-3',
                isTooLate ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50',
              )}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={cn(
                    'h-4 w-4 flex-shrink-0 mt-0.5',
                    isTooLate ? 'text-red-600' : 'text-blue-600',
                  )} />
                  <div className="flex-1">
                    <p className={cn(
                      'text-sm font-medium',
                      isTooLate ? 'text-red-900' : 'text-blue-900',
                    )}>
                      {isTooEarly 
                        ? 'Belum waktunya check-in' 
                        : 'Window waktu check-in sudah berlalu'}
                    </p>
                    <p className={cn(
                      'mt-0.5 text-xs',
                      isTooLate ? 'text-red-700' : 'text-blue-700',
                    )}>
                      {isTooEarly 
                        ? `Check-in tersedia mulai ${checkInWindowStart.toLocaleString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : 'Hubungi Ops untuk check-in manual'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Check-In Form Dialog */}
      <Dialog open={showCheckInForm} onOpenChange={setShowCheckInForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Check-In Confirmation</DialogTitle>
            <DialogDescription>
              Silakan lengkapi informasi berikut untuk menyelesaikan check-in
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Photo Preview */}
            {photoPreview && (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Check-in evidence"
                  className="w-full rounded-lg object-cover"
                />
                {analyzingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 bg-white/80 hover:bg-white"
                  onClick={() => {
                    setPhotoFile(null);
                    if (photoPreview) {
                      URL.revokeObjectURL(photoPreview);
                    }
                    setPhotoPreview(null);
                    setShowCheckInForm(false);
                  }}
                  disabled={analyzingPhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Happiness Rating */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Level Kebahagiaan <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setHappiness(value)}
                    className={cn(
                      'flex-1 rounded-lg border-2 p-3 transition-all',
                      happiness === value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300',
                    )}
                  >
                    <div className="text-2xl">
                      {value === 1 && '😢'}
                      {value === 2 && '😕'}
                      {value === 3 && '😐'}
                      {value === 4 && '😊'}
                      {value === 5 && '😄'}
                    </div>
                    <div className={cn(
                      'mt-1 text-xs font-medium',
                      happiness === value ? 'text-emerald-700' : 'text-slate-600',
                    )}>
                      {value}
                    </div>
                  </button>
                ))}
              </div>
              {happiness && (
                <p className="text-xs text-slate-500">
                  {happiness === 1 && 'Sangat tidak bahagia'}
                  {happiness === 2 && 'Tidak bahagia'}
                  {happiness === 3 && 'Netral'}
                  {happiness === 4 && 'Bahagia'}
                  {happiness === 5 && 'Sangat bahagia'}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="checkin-description" className="text-sm font-semibold text-slate-900">
                Deskripsi / Catatan <span className="text-red-600">*</span>
              </label>
              <Textarea
                id="checkin-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan catatan atau deskripsi singkat tentang kondisi saat ini..."
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Deskripsi singkat tentang kondisi lokasi, cuaca, atau hal penting lainnya
                </p>
                <p className="text-xs text-slate-400">
                  {description.length}/500
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCheckInForm(false);
                setPhotoFile(null);
                if (photoPreview) {
                  URL.revokeObjectURL(photoPreview);
                }
                setPhotoPreview(null);
                setHappiness(null);
                setDescription('');
              }}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              onClick={handleCheckIn}
              disabled={loading || !photoFile || happiness === null || !description.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Konfirmasi Check-In
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-Out Form Dialog (simplified for now) */}
      <Dialog open={showCheckOutForm} onOpenChange={setShowCheckOutForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Check-Out Confirmation</DialogTitle>
            <DialogDescription>
              Konfirmasi check-out untuk menyelesaikan trip
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Photo Preview (optional for check-out) */}
            {photoPreview && (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Check-out evidence"
                  className="w-full rounded-lg object-cover"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 bg-white/80 hover:bg-white"
                  onClick={() => {
                    setPhotoFile(null);
                    if (photoPreview) {
                      URL.revokeObjectURL(photoPreview);
                    }
                    setPhotoPreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCheckOutForm(false);
                setPhotoFile(null);
                if (photoPreview) {
                  URL.revokeObjectURL(photoPreview);
                }
                setPhotoPreview(null);
              }}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              onClick={async () => {
                setShowCheckOutForm(false);
                await handleCheckOut();
              }}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Konfirmasi Check-Out
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
