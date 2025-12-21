'use client';

/**
 * Pre-Trip Risk Assessment Dialog
 * Enhanced safety checklist with risk scoring
 */

import { AlertTriangle, CheckCircle2, Loader2, MapPin, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type RiskAssessmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (canStart: boolean) => void;
  tripId: string;
};

const RISK_LEVEL_COLORS = {
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

export function RiskAssessmentDialog({
  open,
  onOpenChange,
  onComplete,
  tripId,
}: RiskAssessmentDialogProps) {
  const [waveHeight, setWaveHeight] = useState<string>('');
  const [windSpeed, setWindSpeed] = useState<string>('');
  const [weatherCondition, setWeatherCondition] = useState<'clear' | 'cloudy' | 'rainy' | 'stormy' | ''>('');
  const [crewReady, setCrewReady] = useState(false);
  const [equipmentComplete, setEquipmentComplete] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | 'critical' | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherData, setWeatherData] = useState<{
    current?: { wind_speed?: number; weather?: { main?: string; description?: string } };
  } | null>(null);

  // Capture GPS location and fetch weather data
  useEffect(() => {
    if (open && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setGpsLocation(location);
          
          // Auto-fetch weather data
          fetchWeatherData(location.latitude, location.longitude);
        },
        (error) => {
          logger.warn('GPS capture failed', { error: error.message, code: error.code });
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  }, [open]);

  const fetchWeatherData = async (lat: number, lng: number) => {
    setLoadingWeather(true);
    try {
      const res = await fetch(`/api/guide/weather?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        setWeatherData(data);
        
        // Auto-fill wind speed and weather condition if not set
        if (!windSpeed && data.current?.wind_speed) {
          setWindSpeed(data.current.wind_speed.toString());
        }
        
        if (!weatherCondition && data.current?.weather?.main) {
          const weatherMain = data.current.weather.main.toLowerCase();
          if (weatherMain.includes('storm') || weatherMain.includes('thunder')) {
            setWeatherCondition('stormy');
          } else if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
            setWeatherCondition('rainy');
          } else if (weatherMain.includes('cloud')) {
            setWeatherCondition('cloudy');
          } else {
            setWeatherCondition('clear');
          }
        }
        
        // Estimate wave height from wind speed
        if (!waveHeight && data.current?.wind_speed) {
          const estimatedWave = Math.min(2.5, data.current.wind_speed / 20);
          setWaveHeight(estimatedWave.toFixed(1));
        }
      }
    } catch (err) {
      logger.warn('Failed to fetch weather data', { error: err });
    } finally {
      setLoadingWeather(false);
    }
  };

  // Calculate risk score on change
  useEffect(() => {
    if (waveHeight || windSpeed || weatherCondition) {
      calculateRiskScore();
    }
  }, [waveHeight, windSpeed, weatherCondition, crewReady, equipmentComplete]);

  const calculateRiskScore = async () => {
    try {
      const res = await fetch(`/api/guide/trips/${tripId}/risk-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wave_height: waveHeight ? parseFloat(waveHeight) : undefined,
          wind_speed: windSpeed ? parseFloat(windSpeed) : undefined,
          weather_condition: weatherCondition || undefined,
          crew_ready: crewReady,
          equipment_complete: equipmentComplete,
          latitude: gpsLocation?.latitude,
          longitude: gpsLocation?.longitude,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { assessment?: { risk_score: number; risk_level: string } };
        if (data.assessment) {
          setRiskScore(data.assessment.risk_score);
          setRiskLevel(data.assessment.risk_level as typeof riskLevel);
        }
      }
    } catch (err) {
      // Silent fail for preview calculation
    }
  };

  const handleSubmit = async () => {
    if (!weatherCondition) {
      setError('Mohon pilih kondisi cuaca');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/guide/trips/${tripId}/risk-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wave_height: waveHeight ? parseFloat(waveHeight) : undefined,
          wind_speed: windSpeed ? parseFloat(windSpeed) : undefined,
          weather_condition: weatherCondition,
          crew_ready: crewReady,
          equipment_complete: equipmentComplete,
          latitude: gpsLocation?.latitude,
          longitude: gpsLocation?.longitude,
          notes: notes || undefined,
          use_weather_data: weatherData !== null, // Include weather data if fetched
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        setError(errorData.error || 'Gagal menyimpan assessment');
        setSubmitting(false);
        return;
      }

      const data = (await res.json()) as { 
        assessment: { is_safe: boolean; risk_score: number; risk_level: string }; 
        can_start: boolean; 
        is_blocked?: boolean;
        message: string;
      };
      
      if (data.is_blocked) {
        toast.error(data.message || 'Risk score terlalu tinggi. Trip tidak dapat dimulai.');
      } else {
        toast.success(data.message || 'Assessment berhasil disimpan');
      }
      
      onComplete(data.can_start && !data.is_blocked);
      onOpenChange(false);
      
      // Reset form
      setWaveHeight('');
      setWindSpeed('');
      setWeatherCondition('');
      setCrewReady(false);
      setEquipmentComplete(false);
      setNotes('');
      setRiskScore(null);
      setRiskLevel(null);
    } catch (err) {
      logger.error('Failed to submit risk assessment', err);
      setError('Gagal menyimpan assessment. Periksa koneksi internet.');
      setSubmitting(false);
    }
  };

  const canSubmit = weatherCondition && crewReady && equipmentComplete;
  const isSafe = riskScore !== null && riskScore <= 70; // Updated threshold: > 70 = BLOCK
  const isBlocked = riskScore !== null && riskScore > 70;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Pre-Trip Risk Assessment
          </DialogTitle>
          <DialogDescription>
            Isi informasi di bawah untuk menghitung risk score. Trip dapat dimulai jika risk level low/medium.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Weather Conditions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Kondisi Cuaca</Label>
              {gpsLocation && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fetchWeatherData(gpsLocation.latitude, gpsLocation.longitude)}
                  disabled={loadingWeather}
                >
                  {loadingWeather ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-3 w-3" />
                      Ambil Data Cuaca
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {weatherData?.current && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                <div className="font-medium text-blue-900">Data Cuaca Terbaru:</div>
                <div className="mt-1 text-blue-700">
                  {weatherData.current.weather?.description && (
                    <div>Kondisi: {weatherData.current.weather.description}</div>
                  )}
                  {weatherData.current.wind_speed && (
                    <div>Angin: {Math.round(weatherData.current.wind_speed)} km/h</div>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="weather-condition">
                Kondisi Cuaca <span className="text-red-500">*</span>
              </Label>
              <Select value={weatherCondition} onValueChange={(value) => setWeatherCondition(value as typeof weatherCondition)}>
                <SelectTrigger id="weather-condition">
                  <SelectValue placeholder="Pilih kondisi cuaca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear">Cerah</SelectItem>
                  <SelectItem value="cloudy">Berawan</SelectItem>
                  <SelectItem value="rainy">Hujan</SelectItem>
                  <SelectItem value="stormy">Badai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="wave-height">Tinggi Ombak (meter)</Label>
                <Input
                  id="wave-height"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={waveHeight}
                  onChange={(e) => setWaveHeight(e.target.value)}
                  placeholder="0.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wind-speed">Kecepatan Angin (km/h)</Label>
                <Input
                  id="wind-speed"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(e.target.value)}
                  placeholder="15"
                />
              </div>
            </div>
          </div>

          {/* Safety Checks */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Safety Checks</Label>
            
            <div className="space-y-2">
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                  crewReady
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                )}
                onClick={() => setCrewReady(!crewReady)}
              >
                <button
                  type="button"
                  className={cn(
                    'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors',
                    crewReady
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white hover:border-slate-400',
                  )}
                >
                  {crewReady && <CheckCircle2 className="h-3.5 w-3.5" />}
                </button>
                <Label className="flex-1 cursor-pointer text-sm">Crew siap dan lengkap</Label>
              </div>

              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                  equipmentComplete
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                )}
                onClick={() => setEquipmentComplete(!equipmentComplete)}
              >
                <button
                  type="button"
                  className={cn(
                    'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors',
                    equipmentComplete
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white hover:border-slate-400',
                  )}
                >
                  {equipmentComplete && <CheckCircle2 className="h-3.5 w-3.5" />}
                </button>
                <Label className="flex-1 cursor-pointer text-sm">Equipment lengkap dan dalam kondisi baik</Label>
              </div>
            </div>
          </div>

          {/* Risk Score Display */}
          {riskScore !== null && riskLevel && (
            <div className={cn('rounded-lg border p-4', RISK_LEVEL_COLORS[riskLevel])}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Risk Score: {riskScore}</p>
                  <p className="text-xs mt-1">Risk Level: {riskLevel.toUpperCase()}</p>
                  <p className="text-xs mt-1 text-slate-600">Threshold: ≤70 (Aman), &gt;70 (Blocked)</p>
                </div>
                {isSafe ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
              {isBlocked && (
                <div className="mt-2 rounded bg-red-100 p-2 text-xs text-red-800">
                  🚫 <strong>Trip TIDAK DAPAT dimulai!</strong> Risk score ({riskScore}) melebihi threshold (70). Hubungi Admin Ops untuk override.
                </div>
              )}
              {!isSafe && !isBlocked && (
                <p className="text-xs mt-2">
                  ⚠️ Risk level sedang. Perhatikan kondisi sebelum memulai trip.
                </p>
              )}
            </div>
          )}

          {/* GPS Location */}
          {gpsLocation && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              <span>
                Lokasi: {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
              </span>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan tentang kondisi..."
              rows={3}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            <X className="mr-2 h-4 w-4" />
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={cn(
              'bg-emerald-600 hover:bg-emerald-700',
              !isSafe && riskLevel && 'bg-amber-600 hover:bg-amber-700',
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Simpan Assessment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
