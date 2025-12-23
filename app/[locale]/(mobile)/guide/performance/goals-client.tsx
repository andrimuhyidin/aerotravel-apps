'use client';

/**
 * Performance Goals Client Component
 * Target bulanan untuk trips, rating, income dengan progress tracking visual
 */

import { BarChart3, Target } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logger } from '@/lib/utils/logger';

type PerformanceGoalsClientProps = {
  locale: string;
};

type Goal = {
  id?: string;
  year: number;
  month: number;
  target_trips: number;
  target_rating: number;
  target_income: number;
  current_trips: number;
  current_rating: number;
  current_income: number;
};

type Comparison = {
  trips: { user: number; average: number; percentile: number };
  rating: { user: number; average: number; percentile: number };
  income: { user: number; average: number; percentile: number };
};

export function PerformanceGoalsClient({
  locale: _locale,
}: PerformanceGoalsClientProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [current, setCurrent] = useState({ trips: 0, rating: 0, income: 0 });
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newGoal, setNewGoal] = useState({
    targetTrips: '',
    targetRating: '',
    targetIncome: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadData();
  }, [year, month]);

  async function loadData() {
    setLoading(true);
    try {
      const [goalsRes, comparisonRes] = await Promise.all([
        fetch(`/api/guide/performance/goals?year=${year}&month=${month}`),
        fetch(`/api/guide/performance/comparison?year=${year}&month=${month}`),
      ]);

      if (goalsRes.ok) {
        const goalsJson = (await goalsRes.json()) as {
          goal: Goal | null;
          current: { trips: number; rating: number; income: number };
        };
        setGoal(goalsJson.goal);
        setCurrent(goalsJson.current);
      }

      if (comparisonRes.ok) {
        const comparisonJson = (await comparisonRes.json()) as {
          comparison: Comparison;
        };
        setComparison(comparisonJson.comparison);
      }
    } catch (err) {
      logger.error('Failed to load performance goals', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/guide/performance/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          targetTrips: newGoal.targetTrips
            ? parseInt(newGoal.targetTrips)
            : undefined,
          targetRating: newGoal.targetRating
            ? parseFloat(newGoal.targetRating)
            : undefined,
          targetIncome: newGoal.targetIncome
            ? parseFloat(newGoal.targetIncome)
            : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save goal');
      }

      setEditing(false);
      void loadData();
    } catch (err) {
      logger.error('Failed to save performance goal', err);
    } finally {
      setSaving(false);
    }
  }

  const tripsProgress =
    goal && goal.target_trips > 0
      ? Math.min((current.trips / goal.target_trips) * 100, 100)
      : 0;
  const ratingProgress =
    goal && goal.target_rating > 0
      ? Math.min((current.rating / goal.target_rating) * 100, 100)
      : 0;
  const incomeProgress =
    goal && goal.target_income > 0
      ? Math.min((current.income / goal.target_income) * 100, 100)
      : 0;

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold leading-tight text-slate-900">
          Performance Goals
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Set target bulanan dan pantau progress Anda
        </p>
      </div>

      {/* Period Selector */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">Periode:</Label>
            <Select
              value={month.toString()}
              onValueChange={(v) => setMonth(parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((name, idx) => (
                  <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={year.toString()}
              onValueChange={(v) => setYear(parseInt(v))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: 5 },
                  (_, i) => now.getFullYear() - 2 + i
                ).map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Goals Display/Edit */}
      {!editing ? (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Target className="h-5 w-5 text-emerald-600" />
                Target {monthNames[month - 1]} {year}
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
              >
                {goal ? 'Edit' : 'Set Target'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {goal ? (
              <>
                {/* Trips Goal */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-sm font-medium">Target Trips</Label>
                    <span className="text-sm text-slate-600">
                      {current.trips} / {goal.target_trips}
                    </span>
                  </div>
                  <Progress value={tripsProgress} className="h-2" />
                  <p className="mt-1 text-xs text-slate-500">
                    {tripsProgress >= 100
                      ? '✅ Target tercapai!'
                      : `${Math.round(tripsProgress)}% tercapai`}
                  </p>
                </div>

                {/* Rating Goal */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-sm font-medium">Target Rating</Label>
                    <span className="text-sm text-slate-600">
                      {current.rating.toFixed(1)} /{' '}
                      {goal.target_rating.toFixed(1)} ⭐
                    </span>
                  </div>
                  <Progress value={ratingProgress} className="h-2" />
                  <p className="mt-1 text-xs text-slate-500">
                    {ratingProgress >= 100
                      ? '✅ Target tercapai!'
                      : `${Math.round(ratingProgress)}% tercapai`}
                  </p>
                </div>

                {/* Income Goal */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-sm font-medium">Target Income</Label>
                    <span className="text-sm text-slate-600">
                      Rp {current.income.toLocaleString('id-ID')} / Rp{' '}
                      {goal.target_income.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <Progress value={incomeProgress} className="h-2" />
                  <p className="mt-1 text-xs text-slate-500">
                    {incomeProgress >= 100
                      ? '✅ Target tercapai!'
                      : `${Math.round(incomeProgress)}% tercapai`}
                  </p>
                </div>
              </>
            ) : (
              <p className="py-4 text-center text-sm text-slate-500">
                Belum ada target yang ditetapkan. Klik "Set Target" untuk mulai.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Set Target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Target Trips</Label>
              <Input
                type="number"
                className="mt-1"
                value={newGoal.targetTrips}
                onChange={(e) =>
                  setNewGoal((prev) => ({
                    ...prev,
                    targetTrips: e.target.value,
                  }))
                }
                placeholder={goal?.target_trips.toString() || '0'}
              />
            </div>
            <div>
              <Label>Target Rating (0-5)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                className="mt-1"
                value={newGoal.targetRating}
                onChange={(e) =>
                  setNewGoal((prev) => ({
                    ...prev,
                    targetRating: e.target.value,
                  }))
                }
                placeholder={goal?.target_rating.toString() || '0'}
              />
            </div>
            <div>
              <Label>Target Income (Rp)</Label>
              <Input
                type="number"
                className="mt-1"
                value={newGoal.targetIncome}
                onChange={(e) =>
                  setNewGoal((prev) => ({
                    ...prev,
                    targetIncome: e.target.value,
                  }))
                }
                placeholder={goal?.target_income.toString() || '0'}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditing(false)}
              >
                Batal
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison with Team */}
      {comparison && (
        <Card className="border-0 bg-blue-50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-blue-900">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Perbandingan dengan Tim
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Trips</span>
                <span className="text-xs text-blue-700">
                  Anda: {comparison.trips.user} | Rata-rata:{' '}
                  {comparison.trips.average}
                </span>
              </div>
              <p className="text-xs text-blue-700">
                Anda berada di {comparison.trips.percentile}% teratas
              </p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Rating
                </span>
                <span className="text-xs text-blue-700">
                  Anda: {comparison.rating.user.toFixed(1)} ⭐ | Rata-rata:{' '}
                  {comparison.rating.average.toFixed(1)} ⭐
                </span>
              </div>
              <p className="text-xs text-blue-700">
                Anda berada di {comparison.rating.percentile}% teratas
              </p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Income
                </span>
                <span className="text-xs text-blue-700">
                  Anda: Rp {comparison.income.user.toLocaleString('id-ID')} |
                  Rata-rata: Rp{' '}
                  {comparison.income.average.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-xs text-blue-700">
                Anda berada di {comparison.income.percentile}% teratas
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
