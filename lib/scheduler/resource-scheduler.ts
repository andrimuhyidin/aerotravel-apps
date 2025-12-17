/**
 * Resource Scheduler - Kalender kapal/guide dengan conflict detection
 * PRD 4.4.A - Resource Scheduler & Maintenance Blocker
 */

import type { Database } from '@/types/supabase';

type Asset = Database['public']['Tables']['assets']['Row'];
type TripSchedule = Database['public']['Tables']['trip_schedules']['Row'];

export type ResourceType = 'boat' | 'guide' | 'vehicle';

export type ResourceSlot = {
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;
  date: string;
  status: 'available' | 'booked' | 'maintenance' | 'blocked';
  tripId?: string;
  tripCode?: string;
  note?: string;
};

export type ConflictResult = {
  hasConflict: boolean;
  conflicts: {
    resourceId: string;
    resourceName: string;
    conflictType: 'already_booked' | 'maintenance' | 'blocked';
    existingTripId?: string;
    existingTripCode?: string;
    date: string;
  }[];
};

export type AvailabilityQuery = {
  resourceType: ResourceType;
  startDate: string;
  endDate: string;
  branchId: string;
  excludeTripId?: string;
};

/**
 * Check if a resource is available for given dates
 */
export function checkResourceAvailability(
  schedules: TripSchedule[],
  resourceId: string,
  startDate: string,
  endDate: string,
  excludeTripId?: string
): ConflictResult {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const conflicts: ConflictResult['conflicts'] = [];

  for (const schedule of schedules) {
    // Skip if same trip (for editing)
    if (excludeTripId && schedule.trip_id === excludeTripId) continue;

    const scheduleStart = new Date(schedule.start_date);
    const scheduleEnd = new Date(schedule.end_date);

    // Check date overlap
    if (start <= scheduleEnd && end >= scheduleStart) {
      // Check if this resource is assigned
      const assignedResources = (schedule.assigned_resources as string[]) || [];
      if (assignedResources.includes(resourceId)) {
        conflicts.push({
          resourceId,
          resourceName: '', // Will be filled by caller
          conflictType: 'already_booked',
          existingTripId: schedule.trip_id ?? undefined,
          date: schedule.start_date,
        });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Check maintenance schedule for asset
 */
export function checkMaintenanceBlock(
  asset: Asset,
  startDate: string,
  endDate: string
): boolean {
  if (!asset.maintenance_schedule) return false;

  const maintenance = asset.maintenance_schedule as {
    blocked_dates?: string[];
    next_maintenance?: string;
  };

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check blocked dates
  if (maintenance.blocked_dates) {
    for (const blockedDate of maintenance.blocked_dates) {
      const blocked = new Date(blockedDate);
      if (blocked >= start && blocked <= end) {
        return true;
      }
    }
  }

  // Check next maintenance date
  if (maintenance.next_maintenance) {
    const nextMaint = new Date(maintenance.next_maintenance);
    if (nextMaint >= start && nextMaint <= end) {
      return true;
    }
  }

  return false;
}

/**
 * Get available resources for date range
 */
export function filterAvailableResources(
  assets: Asset[],
  schedules: TripSchedule[],
  startDate: string,
  endDate: string,
  resourceType?: ResourceType
): Asset[] {
  return assets.filter((asset) => {
    // Filter by type if specified
    if (resourceType && asset.asset_type !== resourceType) {
      return false;
    }

    // Check if not in maintenance
    if (checkMaintenanceBlock(asset, startDate, endDate)) {
      return false;
    }

    // Check if not already booked
    const conflict = checkResourceAvailability(
      schedules,
      asset.id,
      startDate,
      endDate
    );

    return !conflict.hasConflict;
  });
}

/**
 * Generate calendar slots for a resource
 */
export function generateResourceCalendar(
  asset: Asset,
  schedules: TripSchedule[],
  startDate: string,
  days: number
): ResourceSlot[] {
  const slots: ResourceSlot[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = date.toISOString().split('T')[0]!;

    // Check maintenance
    if (checkMaintenanceBlock(asset, dateStr, dateStr)) {
      slots.push({
        resourceId: asset.id,
        resourceName: asset.name,
        resourceType: asset.asset_type as ResourceType,
        date: dateStr,
        status: 'maintenance',
        note: 'Scheduled maintenance',
      });
      continue;
    }

    // Check bookings
    const conflict = checkResourceAvailability(schedules, asset.id, dateStr, dateStr);
    if (conflict.hasConflict) {
      const firstConflict = conflict.conflicts[0];
      slots.push({
        resourceId: asset.id,
        resourceName: asset.name,
        resourceType: asset.asset_type as ResourceType,
        date: dateStr,
        status: 'booked',
        tripId: firstConflict?.existingTripId,
      });
      continue;
    }

    // Available
    slots.push({
      resourceId: asset.id,
      resourceName: asset.name,
      resourceType: asset.asset_type as ResourceType,
      date: dateStr,
      status: 'available',
    });
  }

  return slots;
}

/**
 * Validate trip assignment (check all resources)
 */
export function validateTripAssignment(
  assets: Asset[],
  schedules: TripSchedule[],
  resourceIds: string[],
  startDate: string,
  endDate: string,
  excludeTripId?: string
): ConflictResult {
  const allConflicts: ConflictResult['conflicts'] = [];

  for (const resourceId of resourceIds) {
    const asset = assets.find((a) => a.id === resourceId);
    if (!asset) continue;

    // Check maintenance
    if (checkMaintenanceBlock(asset, startDate, endDate)) {
      allConflicts.push({
        resourceId,
        resourceName: asset.name,
        conflictType: 'maintenance',
        date: startDate,
      });
      continue;
    }

    // Check booking conflicts
    const conflict = checkResourceAvailability(
      schedules,
      resourceId,
      startDate,
      endDate,
      excludeTripId
    );

    if (conflict.hasConflict) {
      allConflicts.push(
        ...conflict.conflicts.map((c) => ({
          ...c,
          resourceName: asset.name,
        }))
      );
    }
  }

  return {
    hasConflict: allConflicts.length > 0,
    conflicts: allConflicts,
  };
}
