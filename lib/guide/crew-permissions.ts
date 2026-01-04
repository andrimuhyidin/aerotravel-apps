/**
 * Crew Permissions Utilities
 * Permission matrix for Lead Guide vs Support Guide
 */

export type CrewRole = 'lead' | 'support' | null;

export type Permission = 
  | 'start_end_trip'
  | 'view_manifest_full'
  | 'view_manifest_masked'
  | 'upload_evidence'
  | 'trigger_sos'
  | 'submit_incident_report'
  | 'draft_incident_report'
  | 'check_in_attendance'
  | 'view_trip_details'
  | 'manage_guide_notes';

/**
 * Permission matrix based on role
 */
const PERMISSIONS: Record<'lead' | 'support', Set<Permission>> = {
  lead: new Set([
    'start_end_trip',
    'view_manifest_full',
    'upload_evidence',
    'trigger_sos',
    'submit_incident_report',
    'check_in_attendance',
    'view_trip_details',
    'manage_guide_notes',
  ]),
  support: new Set([
    'view_manifest_masked',
    'upload_evidence',
    'trigger_sos',
    'draft_incident_report',
    'check_in_attendance',
    'view_trip_details',
    'manage_guide_notes',
  ]),
};

const NULL_ROLE_PERMISSIONS = new Set<Permission>([
  'view_trip_details', // Can view basic trip info even if not assigned
]);

/**
 * Check if user has permission
 */
export function hasPermission(role: CrewRole, permission: Permission): boolean {
  if (role === null) {
    return NULL_ROLE_PERMISSIONS.has(permission);
  }
  return PERMISSIONS[role]?.has(permission) ?? false;
}

/**
 * Check if user can start/end trip (Lead Guide only)
 */
export function canStartEndTrip(role: CrewRole): boolean {
  return hasPermission(role, 'start_end_trip');
}

/**
 * Check if user can view full manifest (Lead Guide) or masked (Support Guide)
 */
export function canViewManifest(role: CrewRole): {
  canView: boolean;
  isMasked: boolean;
} {
  if (hasPermission(role, 'view_manifest_full')) {
    return { canView: true, isMasked: false };
  }
  if (hasPermission(role, 'view_manifest_masked')) {
    return { canView: true, isMasked: true };
  }
  return { canView: false, isMasked: false };
}

/**
 * Check if user can upload evidence
 */
export function canUploadEvidence(role: CrewRole): boolean {
  return hasPermission(role, 'upload_evidence');
}

/**
 * Check if user can trigger SOS
 */
export function canTriggerSOS(role: CrewRole): boolean {
  return hasPermission(role, 'trigger_sos');
}

/**
 * Check if user can submit incident report (Lead) or draft only (Support)
 */
export function canSubmitIncidentReport(role: CrewRole): {
  canSubmit: boolean;
  canDraft: boolean;
} {
  return {
    canSubmit: hasPermission(role, 'submit_incident_report'),
    canDraft: hasPermission(role, 'draft_incident_report'),
  };
}

/**
 * Check if user can check-in attendance
 */
export function canCheckInAttendance(role: CrewRole): boolean {
  return hasPermission(role, 'check_in_attendance');
}

/**
 * Check if user can manage crew notes
 */
export function canManageCrewNotes(role: CrewRole): boolean {
  return hasPermission(role, 'manage_guide_notes');
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: CrewRole): Permission[] {
  if (role === null) {
    return Array.from(NULL_ROLE_PERMISSIONS);
  }
  return Array.from(PERMISSIONS[role] ?? []);
}
