/**
 * Alert Generator Service
 * Generates and manages compliance alerts
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import { calculateDaysUntilExpiry, getLicenseTypeDisplayName, type LicenseType } from './license-checker';

export type AlertType = 
  | 'expiry_30d'
  | 'expiry_15d'
  | 'expiry_7d'
  | 'expiry_1d'
  | 'expired'
  | 'renewal_reminder'
  | 'status_change';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type ComplianceAlert = {
  id: string;
  licenseId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  license?: {
    id: string;
    type: LicenseType;
    name: string;
    number: string;
  };
};

/**
 * Get severity based on days until expiry
 */
function getSeverityForDays(daysUntilExpiry: number): AlertSeverity {
  if (daysUntilExpiry <= 0) return 'critical';
  if (daysUntilExpiry <= 7) return 'critical';
  if (daysUntilExpiry <= 15) return 'warning';
  return 'info';
}

/**
 * Get alert type based on days until expiry
 */
function getAlertTypeForDays(daysUntilExpiry: number): AlertType {
  if (daysUntilExpiry <= 0) return 'expired';
  if (daysUntilExpiry <= 1) return 'expiry_1d';
  if (daysUntilExpiry <= 7) return 'expiry_7d';
  if (daysUntilExpiry <= 15) return 'expiry_15d';
  return 'expiry_30d';
}

/**
 * Generate message for expiry alert
 */
function generateExpiryMessage(
  licenseName: string,
  licenseNumber: string,
  daysUntilExpiry: number,
  expiryDate: string
): string {
  if (daysUntilExpiry <= 0) {
    return `Izin ${licenseName} (${licenseNumber}) telah EXPIRED pada ${expiryDate}. Segera lakukan perpanjangan!`;
  }
  if (daysUntilExpiry === 1) {
    return `KRITIS: Izin ${licenseName} (${licenseNumber}) akan expired BESOK (${expiryDate})! Operasional terancam ilegal.`;
  }
  if (daysUntilExpiry <= 7) {
    return `URGENT: Izin ${licenseName} (${licenseNumber}) akan expired dalam ${daysUntilExpiry} hari (${expiryDate})!`;
  }
  if (daysUntilExpiry <= 15) {
    return `Izin ${licenseName} (${licenseNumber}) akan expired dalam ${daysUntilExpiry} hari (${expiryDate}). Segera ajukan perpanjangan.`;
  }
  return `Izin ${licenseName} (${licenseNumber}) akan expired dalam ${daysUntilExpiry} hari (${expiryDate}). Siapkan dokumen perpanjangan.`;
}

/**
 * Create an expiry alert for a license
 */
export async function createExpiryAlert(
  licenseId: string,
  daysUntilExpiry: number,
  licenseName: string,
  licenseNumber: string,
  expiryDate: string
): Promise<ComplianceAlert | null> {
  const supabase = await createClient();
  
  const alertType = getAlertTypeForDays(daysUntilExpiry);
  const severity = getSeverityForDays(daysUntilExpiry);
  const message = generateExpiryMessage(licenseName, licenseNumber, daysUntilExpiry, expiryDate);
  
  // Check if similar alert already exists (same license, same alert type, not resolved)
  const { data: existingAlert } = await supabase
    .from('compliance_alerts')
    .select('id')
    .eq('license_id', licenseId)
    .eq('alert_type', alertType)
    .eq('is_resolved', false)
    .single();
  
  if (existingAlert) {
    logger.info('Alert already exists', { licenseId, alertType });
    return null;
  }
  
  const { data: newAlert, error } = await supabase
    .from('compliance_alerts')
    .insert({
      license_id: licenseId,
      alert_type: alertType,
      severity,
      message,
    })
    .select('id, license_id, alert_type, severity, message, is_read, is_resolved, created_at')
    .single();
  
  if (error) {
    logger.error('Failed to create alert', error);
    return null;
  }
  
  const alert = newAlert as {
    id: string;
    license_id: string;
    alert_type: AlertType;
    severity: AlertSeverity;
    message: string;
    is_read: boolean;
    is_resolved: boolean;
    created_at: string;
  };
  
  logger.info('Alert created', { alertId: alert.id, licenseId, alertType, severity });
  
  return {
    id: alert.id,
    licenseId: alert.license_id,
    alertType: alert.alert_type,
    severity: alert.severity,
    message: alert.message,
    isRead: alert.is_read,
    isResolved: alert.is_resolved,
    createdAt: alert.created_at,
  };
}

/**
 * Generate compliance alerts for all licenses
 * This checks all licenses and creates alerts for those approaching expiry
 */
export async function generateComplianceAlerts(): Promise<ComplianceAlert[]> {
  const supabase = await createClient();
  
  logger.info('Generating compliance alerts');
  
  // Get all licenses with expiry dates that haven't been fully alerted
  const { data: licenses, error } = await supabase
    .from('business_licenses')
    .select('id, license_type, license_name, license_number, expiry_date, status, reminder_30d_sent, reminder_15d_sent, reminder_7d_sent, reminder_1d_sent')
    .not('expiry_date', 'is', null)
    .neq('status', 'suspended');
  
  if (error) {
    logger.error('Failed to fetch licenses for alert generation', error);
    return [];
  }
  
  const alerts: ComplianceAlert[] = [];
  
  for (const license of licenses || []) {
    const l = license as {
      id: string;
      license_type: LicenseType;
      license_name: string;
      license_number: string;
      expiry_date: string;
      status: string;
      reminder_30d_sent: boolean;
      reminder_15d_sent: boolean;
      reminder_7d_sent: boolean;
      reminder_1d_sent: boolean;
    };
    
    const daysUntilExpiry = calculateDaysUntilExpiry(l.expiry_date);
    if (daysUntilExpiry === null) continue;
    
    // Check which alerts need to be created
    let shouldCreateAlert = false;
    let reminderField: string | null = null;
    
    if (daysUntilExpiry <= 1 && !l.reminder_1d_sent) {
      shouldCreateAlert = true;
      reminderField = 'reminder_1d_sent';
    } else if (daysUntilExpiry <= 7 && daysUntilExpiry > 1 && !l.reminder_7d_sent) {
      shouldCreateAlert = true;
      reminderField = 'reminder_7d_sent';
    } else if (daysUntilExpiry <= 15 && daysUntilExpiry > 7 && !l.reminder_15d_sent) {
      shouldCreateAlert = true;
      reminderField = 'reminder_15d_sent';
    } else if (daysUntilExpiry <= 30 && daysUntilExpiry > 15 && !l.reminder_30d_sent) {
      shouldCreateAlert = true;
      reminderField = 'reminder_30d_sent';
    } else if (daysUntilExpiry < 0 && l.status !== 'expired') {
      // Expired but not marked yet
      shouldCreateAlert = true;
    }
    
    if (shouldCreateAlert) {
      const alert = await createExpiryAlert(
        l.id,
        daysUntilExpiry,
        l.license_name,
        l.license_number,
        l.expiry_date
      );
      
      if (alert) {
        alerts.push(alert);
        
        // Update reminder flag
        if (reminderField) {
          await supabase
            .from('business_licenses')
            .update({ [reminderField]: true })
            .eq('id', l.id);
        }
      }
    }
  }
  
  logger.info('Compliance alerts generated', { count: alerts.length });
  
  return alerts;
}

/**
 * Get unread alerts count
 */
export async function getUnreadAlertsCount(): Promise<number> {
  const supabase = await createClient();
  
  const { count, error } = await supabase
    .from('compliance_alerts')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);
  
  if (error) {
    logger.error('Failed to get unread alerts count', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Get unresolved alerts
 */
export async function getUnresolvedAlerts(limit: number = 10): Promise<ComplianceAlert[]> {
  const supabase = await createClient();
  
  const { data: alerts, error } = await supabase
    .from('compliance_alerts')
    .select(`
      id,
      license_id,
      alert_type,
      severity,
      message,
      is_read,
      is_resolved,
      created_at,
      license:business_licenses (
        id,
        license_type,
        license_name,
        license_number
      )
    `)
    .eq('is_resolved', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    logger.error('Failed to fetch unresolved alerts', error);
    return [];
  }
  
  return (alerts || []).map((alert) => {
    const a = alert as {
      id: string;
      license_id: string;
      alert_type: AlertType;
      severity: AlertSeverity;
      message: string;
      is_read: boolean;
      is_resolved: boolean;
      created_at: string;
      license: {
        id: string;
        license_type: LicenseType;
        license_name: string;
        license_number: string;
      } | null;
    };
    
    return {
      id: a.id,
      licenseId: a.license_id,
      alertType: a.alert_type,
      severity: a.severity,
      message: a.message,
      isRead: a.is_read,
      isResolved: a.is_resolved,
      createdAt: a.created_at,
      license: a.license ? {
        id: a.license.id,
        type: a.license.license_type,
        name: a.license.license_name,
        number: a.license.license_number,
      } : undefined,
    };
  });
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('compliance_alerts')
    .update({
      is_read: true,
      read_by: userId,
      read_at: new Date().toISOString(),
    })
    .eq('id', alertId);
  
  if (error) {
    logger.error('Failed to mark alert as read', error);
    return false;
  }
  
  return true;
}

/**
 * Resolve alert
 */
export async function resolveAlert(alertId: string, userId: string, notes?: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('compliance_alerts')
    .update({
      is_resolved: true,
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      resolution_notes: notes || null,
      is_read: true,
      read_by: userId,
      read_at: new Date().toISOString(),
    })
    .eq('id', alertId);
  
  if (error) {
    logger.error('Failed to resolve alert', error);
    return false;
  }
  
  return true;
}

