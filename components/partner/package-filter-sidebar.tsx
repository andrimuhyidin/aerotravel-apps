/**
 * Package Filter Sidebar Component
 * Advanced filters for package listing with price range, duration, facilities, etc.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  X,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  Star,
  Utensils,
  BedDouble,
  Bus,
} from 'lucide-react';
import { format } from 'date-fns';

export type FilterState = {
  priceRange: [number, number];
  durations: number[];
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  packageTypes: string[];
  facilities: string[];
  minRating: number;
};

type PackageFilterSidebarProps = {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  priceMin?: number;
  priceMax?: number;
};

const PACKAGE_TYPES = [
  { value: 'open_trip', label: 'Open Trip' },
  { value: 'private_trip', label: 'Private Trip' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'kol_trip', label: 'KOL Trip' },
];

const FACILITIES = [
  { value: 'meals', label: 'Makanan', icon: Utensils },
  { value: 'hotel', label: 'Hotel', icon: BedDouble },
  { value: 'transport', label: 'Transport', icon: Bus },
];

const DURATIONS = [
  { value: 1, label: '1 Hari' },
  { value: 2, label: '2 Hari' },
  { value: 3, label: '3 Hari' },
  { value: 4, label: '4-5 Hari' },
  { value: 6, label: '6+ Hari' },
];

export function PackageFilterSidebar({
  filters,
  onFiltersChange,
  onClearFilters,
  priceMin = 0,
  priceMax = 10000000,
}: PackageFilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const toggleArrayItem = (key: 'durations' | 'packageTypes' | 'facilities', value: string | number) => {
    const current = localFilters[key] as any[];
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const hasActiveFilters = 
    localFilters.priceRange[0] > priceMin ||
    localFilters.priceRange[1] < priceMax ||
    localFilters.durations.length > 0 ||
    localFilters.dateFrom ||
    localFilters.dateTo ||
    localFilters.packageTypes.length > 0 ||
    localFilters.facilities.length > 0 ||
    localFilters.minRating > 0;

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filter
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-7 px-2 text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Harga NTA</Label>
          <div className="space-y-2">
            <Slider
              value={localFilters.priceRange}
              onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
              min={priceMin}
              max={priceMax}
              step={100000}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                IDR {localFilters.priceRange[0].toLocaleString('id-ID')}
              </span>
              <span>
                IDR {localFilters.priceRange[1].toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Durasi</Label>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((duration) => {
              const isActive = localFilters.durations.includes(duration.value);
              return (
                <Badge
                  key={duration.value}
                  variant={isActive ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-all hover:scale-105',
                    isActive && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => toggleArrayItem('durations', duration.value)}
                >
                  {duration.label}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Departure Date Range */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Tanggal Keberangkatan</Label>
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !localFilters.dateFrom && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.dateFrom ? (
                    format(localFilters.dateFrom, 'dd MMM yyyy')
                  ) : (
                    <span>Dari tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={localFilters.dateFrom}
                  onSelect={(date) => updateFilter('dateFrom', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !localFilters.dateTo && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.dateTo ? (
                    format(localFilters.dateTo, 'dd MMM yyyy')
                  ) : (
                    <span>Sampai tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={localFilters.dateTo}
                  onSelect={(date) => updateFilter('dateTo', date)}
                  initialFocus
                  disabled={(date) =>
                    localFilters.dateFrom ? date < localFilters.dateFrom : false
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Package Type */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Tipe Paket</Label>
          <div className="space-y-2">
            {PACKAGE_TYPES.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={localFilters.packageTypes.includes(type.value)}
                  onCheckedChange={() => toggleArrayItem('packageTypes', type.value)}
                />
                <Label
                  htmlFor={`type-${type.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Facilities */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Fasilitas</Label>
          <div className="space-y-2">
            {FACILITIES.map((facility) => {
              const Icon = facility.icon;
              return (
                <div key={facility.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`facility-${facility.value}`}
                    checked={localFilters.facilities.includes(facility.value)}
                    onCheckedChange={() => toggleArrayItem('facilities', facility.value)}
                  />
                  <Label
                    htmlFor={`facility-${facility.value}`}
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {facility.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rating */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Rating Minimum</Label>
          <Select
            value={localFilters.minRating.toString()}
            onValueChange={(value) => updateFilter('minRating', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Semua Rating</SelectItem>
              <SelectItem value="4">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  4+ Rating
                </div>
              </SelectItem>
              <SelectItem value="3">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  3+ Rating
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

