'use client';

/**
 * Moon Phases Component
 * Menampilkan fase bulan saat ini, moonrise/moonset times, dan next full moon date
 */

import { Moon, Sunrise, Sunset } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MoonPhasesProps = {
  lat: number;
  lng: number;
  currentDate?: Date;
};

// Calculate moon phase (0 = new moon, 0.5 = full moon, 1 = new moon again)
const calculateMoonPhase = (date: Date): number => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Julian day calculation
  let jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) +
    Math.floor(275 * month / 9) + day + 1721013.5;

  // Days since last new moon (approximate, 29.53 day cycle)
  const daysSinceNewMoon = (jd - 2451549.5) % 29.53058867;
  return daysSinceNewMoon / 29.53058867;
};

const getMoonPhaseName = (phase: number): string => {
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
};

const getNextFullMoon = (date: Date): Date => {
  const currentPhase = calculateMoonPhase(date);
  let daysUntilFullMoon = 0;

  if (currentPhase < 0.5) {
    // Before full moon
    daysUntilFullMoon = (0.5 - currentPhase) * 29.53058867;
  } else {
    // After full moon, next one is in next cycle
    daysUntilFullMoon = (1.5 - currentPhase) * 29.53058867;
  }

  const nextFullMoon = new Date(date);
  nextFullMoon.setDate(nextFullMoon.getDate() + Math.ceil(daysUntilFullMoon));
  return nextFullMoon;
};

// Simple estimation for moonrise/moonset (not accurate, but gives approximate times)
const estimateMoonTimes = (date: Date, lat: number): { moonrise: string; moonset: string } => {
  // Very simplified estimation - in real app, use astronomical library
  const hour = date.getHours();
  const phase = calculateMoonPhase(date);

  // Rough estimation: moonrise around 6-12 hours after sunrise, moonset around 6-12 hours after sunset
  // This is a placeholder - real calculation requires complex astronomical formulas
  let moonriseHour = 18 + (phase * 12); // 18:00 to 06:00 next day
  let moonsetHour = 6 + (phase * 12); // 06:00 to 18:00

  if (moonriseHour >= 24) moonriseHour -= 24;
  if (moonsetHour >= 24) moonsetHour -= 24;

  const moonrise = new Date(date);
  moonrise.setHours(Math.floor(moonriseHour), (moonriseHour % 1) * 60, 0);

  const moonset = new Date(date);
  moonset.setHours(Math.floor(moonsetHour), (moonsetHour % 1) * 60, 0);

  return {
    moonrise: moonrise.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    moonset: moonset.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };
};

export function MoonPhases({ lat, lng, currentDate = new Date() }: MoonPhasesProps) {
  const phase = calculateMoonPhase(currentDate);
  const phaseName = getMoonPhaseName(phase);
  const nextFullMoon = getNextFullMoon(currentDate);
  const moonTimes = estimateMoonTimes(currentDate, lat);

  // Visual representation of moon phase
  const moonFill = phase < 0.5 
    ? (phase * 2) * 100 // 0% to 100% (new to full)
    : (1 - (phase - 0.5) * 2) * 100; // 100% to 0% (full to new)

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Moon className="h-5 w-5 text-slate-600" />
          Fase Bulan
        </CardTitle>
        <p className="mt-1 text-sm text-slate-600">
          Informasi fase bulan untuk perencanaan trip malam
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Phase */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-medium text-slate-600">Fase Saat Ini</div>
              <div className="mt-1 text-lg font-bold text-slate-900">{phaseName}</div>
            </div>
            <div className="relative h-16 w-16 rounded-full border-2 border-slate-300 bg-slate-100">
              {/* Moon visualization */}
              <div
                className={cn(
                  'absolute inset-0 rounded-full transition-all',
                  phase < 0.5
                    ? 'bg-slate-300' // Waxing (left side)
                    : 'bg-slate-300' // Waning (right side)
                )}
                style={{
                  clipPath: phase < 0.5
                    ? `inset(0 ${100 - moonFill}% 0 0)` // Left to right fill
                    : `inset(0 0 0 ${100 - moonFill}%)`, // Right to left fill
                }}
              />
            </div>
          </div>
        </div>

        {/* Moon Times */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <Sunrise className="h-4 w-4" />
              <span className="text-xs font-medium">Moonrise</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {moonTimes.moonrise}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <Sunset className="h-4 w-4" />
              <span className="text-xs font-medium">Moonset</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {moonTimes.moonset}
            </div>
          </div>
        </div>

        {/* Next Full Moon */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs font-medium text-amber-700 mb-1">Next Full Moon</div>
          <div className="text-sm font-semibold text-amber-900">
            {nextFullMoon.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <div className="mt-1 text-xs text-amber-600">
            {Math.ceil((nextFullMoon.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))} hari lagi
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

