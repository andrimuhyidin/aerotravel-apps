/**
 * Margin Calculator Client Component
 * Interactive calculator for computing profit margins on packages
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ArrowRight,
  Calculator,
  Copy,
  DollarSign,
  Download,
  Info,
  Percent,
  Plus,
  Save,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PageHeader } from '@/components/partner';
import { cn } from '@/lib/utils';

type MarginScenario = {
  id: string;
  name: string;
  ntaPrice: number;
  paxCount: number;
  markupType: 'percentage' | 'fixed';
  markupValue: number;
};

type CalculationResult = {
  sellingPrice: number;
  totalCost: number;
  totalRevenue: number;
  marginPerPax: number;
  totalMargin: number;
  marginPercentage: number;
};

const PRESET_MARKUPS = [
  { label: '10%', value: 10, type: 'percentage' as const },
  { label: '15%', value: 15, type: 'percentage' as const },
  { label: '20%', value: 20, type: 'percentage' as const },
  { label: '25%', value: 25, type: 'percentage' as const },
  { label: 'Rp 100rb', value: 100000, type: 'fixed' as const },
  { label: 'Rp 200rb', value: 200000, type: 'fixed' as const },
  { label: 'Rp 300rb', value: 300000, type: 'fixed' as const },
  { label: 'Rp 500rb', value: 500000, type: 'fixed' as const },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

function calculateScenario(scenario: MarginScenario): CalculationResult {
  const { ntaPrice, paxCount, markupType, markupValue } = scenario;

  let sellingPrice: number;
  if (markupType === 'percentage') {
    sellingPrice = ntaPrice * (1 + markupValue / 100);
  } else {
    sellingPrice = ntaPrice + markupValue;
  }

  const totalCost = ntaPrice * paxCount;
  const totalRevenue = sellingPrice * paxCount;
  const marginPerPax = sellingPrice - ntaPrice;
  const totalMargin = marginPerPax * paxCount;
  const marginPercentage = ntaPrice > 0 ? (marginPerPax / ntaPrice) * 100 : 0;

  return {
    sellingPrice,
    totalCost,
    totalRevenue,
    marginPerPax,
    totalMargin,
    marginPercentage,
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

type MarginCalculatorClientProps = {
  locale: string;
};

export function MarginCalculatorClient({ locale: _locale }: MarginCalculatorClientProps) {
  const [scenarios, setScenarios] = useState<MarginScenario[]>([
    {
      id: generateId(),
      name: 'Skenario 1',
      ntaPrice: 2500000,
      paxCount: 4,
      markupType: 'percentage',
      markupValue: 15,
    },
  ]);

  const [savedPresets, setSavedPresets] = useState<MarginScenario[]>([]);

  const results = useMemo(() => {
    return scenarios.map((scenario) => ({
      scenario,
      result: calculateScenario(scenario),
    }));
  }, [scenarios]);

  const addScenario = useCallback(() => {
    const newScenario: MarginScenario = {
      id: generateId(),
      name: `Skenario ${scenarios.length + 1}`,
      ntaPrice: 2500000,
      paxCount: 4,
      markupType: 'percentage',
      markupValue: 15,
    };
    setScenarios((prev) => [...prev, newScenario]);
  }, [scenarios.length]);

  const removeScenario = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateScenario = useCallback(
    (id: string, updates: Partial<MarginScenario>) => {
      setScenarios((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const savePreset = useCallback(
    (scenario: MarginScenario) => {
      setSavedPresets((prev) => [...prev, { ...scenario, id: generateId() }]);
      toast.success('Preset berhasil disimpan!');
    },
    []
  );

  const loadPreset = useCallback((preset: MarginScenario) => {
    setScenarios((prev) => [
      ...prev,
      { ...preset, id: generateId(), name: `${preset.name} (Copy)` },
    ]);
    toast.success('Preset berhasil dimuat!');
  }, []);

  const copyToClipboard = useCallback(
    (result: CalculationResult, scenario: MarginScenario) => {
      const text = `
${scenario.name}
================
NTA Price: ${formatCurrency(scenario.ntaPrice)}
Selling Price: ${formatCurrency(result.sellingPrice)}
Pax: ${scenario.paxCount} orang
----------------
Margin/Pax: ${formatCurrency(result.marginPerPax)}
Total Margin: ${formatCurrency(result.totalMargin)}
Margin %: ${result.marginPercentage.toFixed(1)}%
      `.trim();

      navigator.clipboard.writeText(text);
      toast.success('Hasil perhitungan disalin!');
    },
    []
  );

  const exportResults = useCallback(() => {
    const data = results.map(({ scenario, result }) => ({
      Skenario: scenario.name,
      'NTA Price': scenario.ntaPrice,
      'Selling Price': result.sellingPrice,
      Pax: scenario.paxCount,
      'Margin/Pax': result.marginPerPax,
      'Total Margin': result.totalMargin,
      'Margin %': `${result.marginPercentage.toFixed(1)}%`,
    }));

    const csvContent = [
      Object.keys(data[0] ?? {}).join(','),
      ...data.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `margin-calculator-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Hasil diekspor ke CSV!');
  }, [results]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="Margin Calculator"
        description="Hitung margin dan keuntungan penjualan paket wisata"
        action={
          <Button variant="outline" size="sm" onClick={exportResults}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="space-y-4 px-4">
        {/* Quick Preset Buttons */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-5 w-5 text-primary" />
              Markup Cepat
            </CardTitle>
            <CardDescription>
              Pilih markup preset atau buat kalkulasi kustom
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PRESET_MARKUPS.map((preset) => (
                <Button
                  key={`${preset.type}-${preset.value}`}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (scenarios.length > 0 && scenarios[0]) {
                      updateScenario(scenarios[0].id, {
                        markupType: preset.type,
                        markupValue: preset.value,
                      });
                    }
                  }}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scenarios */}
        {results.map(({ scenario, result }, index) => (
          <Card key={scenario.id} className="relative overflow-hidden">
            {/* Header */}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Input
                  value={scenario.name}
                  onChange={(e) =>
                    updateScenario(scenario.id, { name: e.target.value })
                  }
                  className="h-8 w-40 text-sm font-semibold"
                />
                <div className="flex gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => savePreset(scenario)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Simpan sebagai preset</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(result, scenario)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Salin hasil</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {scenarios.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => removeScenario(scenario.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Input Fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* NTA Price */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <DollarSign className="h-3 w-3" />
                    Harga NTA
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Net Travel Agent price dari Aero
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      type="number"
                      value={scenario.ntaPrice}
                      onChange={(e) =>
                        updateScenario(scenario.id, {
                          ntaPrice: Number(e.target.value) || 0,
                        })
                      }
                      className="h-10 pl-9 text-sm"
                    />
                  </div>
                </div>

                {/* Pax Count */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <Users className="h-3 w-3" />
                    Jumlah Pax
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={scenario.paxCount}
                    onChange={(e) =>
                      updateScenario(scenario.id, {
                        paxCount: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              {/* Markup Type & Value */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-xs">
                  <Percent className="h-3 w-3" />
                  Markup
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={scenario.markupType}
                    onValueChange={(value: 'percentage' | 'fixed') =>
                      updateScenario(scenario.id, { markupType: value })
                    }
                  >
                    <SelectTrigger className="h-10 w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Persen (%)</SelectItem>
                      <SelectItem value="fixed">Rupiah (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={scenario.markupValue}
                      onChange={(e) =>
                        updateScenario(scenario.id, {
                          markupValue: Number(e.target.value) || 0,
                        })
                      }
                      className="h-10 pr-10 text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {scenario.markupType === 'percentage' ? '%' : 'Rp'}
                    </span>
                  </div>
                </div>

                {/* Markup Slider */}
                {scenario.markupType === 'percentage' && (
                  <Slider
                    value={[scenario.markupValue]}
                    onValueChange={([value]) =>
                      updateScenario(scenario.id, { markupValue: value ?? 0 })
                    }
                    min={0}
                    max={50}
                    step={1}
                    className="mt-2"
                  />
                )}
              </div>

              <Separator />

              {/* Results */}
              <div className="space-y-3">
                {/* Selling Price */}
                <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Harga Jual/Pax</span>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(result.sellingPrice)}
                  </span>
                </div>

                {/* Calculation Flow */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span>{formatCurrency(scenario.ntaPrice)}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>
                    +{' '}
                    {scenario.markupType === 'percentage'
                      ? `${scenario.markupValue}%`
                      : formatCurrency(scenario.markupValue)}
                  </span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-medium text-foreground">
                    {formatCurrency(result.sellingPrice)}
                  </span>
                </div>

                {/* Margin Details */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-green-50 p-3 text-center">
                    <p className="text-[10px] uppercase text-green-600">
                      Margin/Pax
                    </p>
                    <p className="text-sm font-bold text-green-700">
                      {formatCurrency(result.marginPerPax)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3 text-center">
                    <p className="text-[10px] uppercase text-emerald-600">
                      Total Margin
                    </p>
                    <p className="text-sm font-bold text-emerald-700">
                      {formatCurrency(result.totalMargin)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-teal-50 p-3 text-center">
                    <p className="text-[10px] uppercase text-teal-600">
                      Margin %
                    </p>
                    <p className="text-sm font-bold text-teal-700">
                      {result.marginPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Summary Row */}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Cost: </span>
                    <span className="font-medium">
                      {formatCurrency(result.totalCost)}
                    </span>
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <span className="text-muted-foreground">Total Revenue: </span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(result.totalRevenue)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Scenario Index Badge */}
            <Badge
              variant="secondary"
              className="absolute right-2 top-2 text-xs"
            >
              #{index + 1}
            </Badge>
          </Card>
        ))}

        {/* Add Scenario Button */}
        <Button
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={addScenario}
        >
          <Plus className="h-4 w-4" />
          Tambah Skenario Perbandingan
        </Button>

        {/* Comparison Summary (when multiple scenarios) */}
        {results.length > 1 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-primary" />
                Perbandingan Skenario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results
                  .sort((a, b) => b.result.totalMargin - a.result.totalMargin)
                  .map(({ scenario, result }, index) => (
                    <div
                      key={scenario.id}
                      className={cn(
                        'flex items-center justify-between rounded-lg p-3',
                        index === 0
                          ? 'bg-green-100 ring-2 ring-green-500'
                          : 'bg-white'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Badge className="bg-green-500">Terbaik</Badge>
                        )}
                        <span className="font-medium">{scenario.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">
                          {formatCurrency(result.totalMargin)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.marginPercentage.toFixed(1)}% margin
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Presets */}
        {savedPresets.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Save className="h-5 w-5 text-primary" />
                Preset Tersimpan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {savedPresets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    onClick={() => loadPreset(preset)}
                    className="text-xs"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

