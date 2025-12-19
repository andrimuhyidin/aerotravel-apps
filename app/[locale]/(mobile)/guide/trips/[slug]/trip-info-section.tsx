'use client';

/**
 * Trip Info Section Component
 * Checklist untuk guide memverifikasi ketersediaan fasilitas & layanan trip
 * Fasilitas ditentukan oleh admin/ops (termasuk/tidak termasuk)
 * Guide menggunakan ini untuk memastikan semua fasilitas tersedia sebelum trip
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Package as PackageIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { FacilityDisplayItem } from '@/lib/guide/facilities';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TripInfoSectionProps = {
  tripId: string;
  locale: string;
};

export function TripInfoSection({ tripId, locale: _locale }: TripInfoSectionProps) {
  const queryClient = useQueryClient();

  // Fetch package info with facilities
  const { data, isLoading } = useQuery<{
    package: {
      facilities?: FacilityDisplayItem[];
    };
  }>({
    queryKey: ['guide', 'trip-package-info', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/package-info`);
      if (!res.ok) throw new Error('Failed to fetch package info');
      const data = await res.json();
      return {
        package: {
          facilities: data.package?.facilities || [],
        },
      };
    },
    staleTime: 300000,
  });

  // Fetch facility checklist status
  const { data: checklistData, isLoading: checklistLoading } = useQuery<{
    checklist: Record<string, boolean>; // facility_code -> checked
  }>({
    queryKey: queryKeys.guide.trips.facilityChecklist(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/facility-checklist`);
      if (res.status === 404) {
        return { checklist: {} };
      }
      if (!res.ok) throw new Error('Failed to fetch checklist');
      return res.json();
    },
  });

  // Update checklist mutation
  const updateChecklistMutation = useMutation({
    mutationFn: async ({ facilityCode, checked }: { facilityCode: string; checked: boolean }) => {
      const res = await fetch(`/api/guide/trips/${tripId}/facility-checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facility_code: facilityCode, checked }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update checklist');
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.trips.facilityChecklist(tripId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memperbarui checklist');
    },
  });

  const facilities = data?.package?.facilities || [];
  const hasFacilities = facilities.length > 0;
  const checklist = checklistData?.checklist || {};
  
  // Only show included facilities for checklist (excluded tidak perlu dicek)
  const includedFacilities = facilities.filter((f) => f.status === 'included');
  
  const handleCheckboxChange = (facilityCode: string, checked: boolean) => {
    updateChecklistMutation.mutate({ facilityCode, checked });
  };
  
  const checkedCount = includedFacilities.filter((f) => checklist[f.code] === true).length;
  const totalCount = includedFacilities.length;
  const allChecked = totalCount > 0 && checkedCount === totalCount;
  
  // Sort facilities: included first, then by category, then by name
  const sortedFacilities = [...facilities].sort((a, b) => {
    // First: included before excluded
    if (a.status !== b.status) {
      return a.status === 'included' ? -1 : 1;
    }
    // Second: by category
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    // Third: by name
    return a.name.localeCompare(b.name);
  });

  if (isLoading || checklistLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <PackageIcon className="h-5 w-5 text-emerald-600" />
            Verifikasi Fasilitas & Layanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <PackageIcon className="h-5 w-5 text-emerald-600" />
          Verifikasi Fasilitas & Layanan
        </CardTitle>
        {hasFacilities && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-slate-600 leading-relaxed">
              Pastikan semua fasilitas dan layanan berikut tersedia sebelum trip dimulai
            </p>
            {totalCount > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <div className={cn(
                  'h-2 flex-1 rounded-full bg-slate-200 overflow-hidden',
                  allChecked && 'bg-emerald-100'
                )}>
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      allChecked ? 'bg-emerald-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                  {checkedCount}/{totalCount}
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {hasFacilities ? (
          <TooltipProvider>
            <div className="space-y-4">
              {/* Facilities Table - Optimized for mobile */}
              <div className="w-full overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-0">Nama Item</TableHead>
                    <TableHead className="w-[110px] px-2">Status</TableHead>
                    <TableHead className="w-[70px] px-2 text-right">Jumlah</TableHead>
                    <TableHead className="w-[60px] px-2 text-center">Verifikasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFacilities.map((facility) => {
                    const isIncluded = facility.status === 'included';
                    const isChecked = isIncluded && checklist[facility.code] === true;
                    const canCheck = isIncluded; // Only included facilities can be checked
                    
                    return (
                      <TableRow
                        key={facility.code}
                        className={cn(
                          canCheck && 'cursor-pointer hover:bg-slate-50',
                          isIncluded && isChecked && 'bg-emerald-50/50',
                          !isIncluded && 'opacity-75'
                        )}
                      >
                        <TableCell className="min-w-0 py-3">
                          <div className="flex items-start gap-2 min-w-0">
                            {facility.icon && (
                              <span className="text-base flex-shrink-0 mt-0.5">{facility.icon}</span>
                            )}
                            <div className="min-w-0 flex-1">
                              {facility.description ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={cn(
                                      'text-sm font-medium break-words cursor-help underline decoration-dotted underline-offset-2',
                                      isIncluded ? 'text-slate-900' : 'text-slate-600'
                                    )}>
                                      {facility.name}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{facility.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className={cn(
                                  'text-sm font-medium break-words',
                                  isIncluded ? 'text-slate-900' : 'text-slate-600'
                                )}>
                                  {facility.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[110px] px-2 py-3">
                          <Badge
                            variant={isIncluded ? 'default' : 'secondary'}
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 h-5 whitespace-nowrap',
                              isIncluded
                                ? 'bg-emerald-500 text-white border-0'
                                : 'bg-slate-200 text-slate-700 border-0'
                            )}
                          >
                            {isIncluded ? 'Termasuk' : 'Tdk Termasuk'}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[70px] px-2 py-3 text-right">
                          <span className={cn(
                            'text-sm font-medium',
                            facility.quantity ? 'text-slate-900' : 'text-slate-400'
                          )}>
                            {facility.quantity ?? '-'}
                          </span>
                        </TableCell>
                        <TableCell className="w-[60px] px-2 py-3 text-center">
                          {canCheck ? (
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked: boolean | 'indeterminate') => {
                                handleCheckboxChange(facility.code, checked === true);
                              }}
                              disabled={updateChecklistMutation.isPending}
                              className="mx-auto"
                            />
                          ) : (
                            <div className="h-4 w-4 mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Completion Message - only for included facilities */}
            {allChecked && totalCount > 0 && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">
                      Semua fasilitas sudah tersedia
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Trip siap untuk dimulai
                    </p>
                  </div>
                </div>
              </div>
            )}
            </div>
          </TooltipProvider>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-slate-500">
              Informasi fasilitas belum tersedia untuk paket ini.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
