/**
 * Setting Item Component
 * Reusable component for individual setting input
 */

'use client';

import { CheckCircle2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { GlassCard } from '@/components/ui/glass-card';

export type Setting = {
  id: string;
  key: string;
  value: string;
  value_type: string;
  description: string | null;
  is_public: boolean;
  updated_at: string;
};

type SettingItemProps = {
  setting: Setting;
  label: string;
  value: string;
  isChanged: boolean;
  isSaving: boolean;
  onValueChange: (value: string) => void;
  onSave: () => void;
};

export function SettingItem({
  setting,
  label,
  value,
  isChanged,
  isSaving,
  onValueChange,
  onSave,
}: SettingItemProps) {
  const isNumber = setting.value_type === 'number';
  const isBoolean = setting.value_type === 'boolean';
  const isJson = setting.value_type === 'json';

  // Format display for large numbers
  const displayHint =
    isNumber && value && parseInt(value) > 10000
      ? `${parseInt(value).toLocaleString('id-ID')}`
      : null;

  if (isBoolean) {
    return (
      <GlassCard variant="subtle" hover={false} className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Label className="text-sm font-medium">{label}</Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {setting.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={value === 'true'}
              onCheckedChange={(checked) => onValueChange(checked ? 'true' : 'false')}
            />
            {isChanged && (
              <Button
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </GlassCard>
    );
  }

  if (isJson) {
    return (
      <GlassCard variant="subtle" hover={false} className="p-4">
        <div className="space-y-3">
          <div className="flex-1 min-w-0">
            <Label className="text-sm font-medium">{label}</Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {setting.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Textarea
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              className="font-mono text-xs min-h-[100px]"
              placeholder="{}"
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={onSave}
              disabled={!isChanged || isSaving}
              className={isChanged ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : isChanged ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Tersimpan
                </>
              )}
            </Button>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="subtle" hover={false} className="p-4">
      <div className="flex items-end gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{label}</Label>
            {displayHint && (
              <span className="text-xs text-muted-foreground">
                ({displayHint})
              </span>
            )}
          </div>
          {setting.description && (
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              {setting.description}
            </p>
          )}
          <Input
            type={isNumber ? 'number' : 'text'}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          onClick={onSave}
          disabled={!isChanged || isSaving}
          className={isChanged ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : isChanged ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Tersimpan
            </>
          )}
        </Button>
      </div>
    </GlassCard>
  );
}

// Label mapping for settings keys
export const SETTING_LABELS: Record<string, string> = {
  // Legacy operational
  geofence_radius_meters: 'Radius Absensi (Geofence)',
  late_penalty_amount: 'Denda Keterlambatan',
  late_threshold_minutes: 'Toleransi Keterlambatan',
  sla_ticket_minutes: 'SLA Ticket',
  split_bill_expiry_hours: 'Masa Berlaku Split Bill',
  points_per_100k: 'Poin per Rp 100.000',
  referral_bonus_points: 'Bonus Poin Referral',
  data_retention_days: 'Retensi Data KTP',
  insurance_email: 'Email Asuransi',

  // Branding
  'branding.app_name': 'Nama Aplikasi',
  'branding.tagline': 'Tagline',
  'branding.logo_url': 'URL Logo',
  'branding.favicon_url': 'URL Favicon',
  'branding.primary_color': 'Warna Primary',
  'branding.secondary_color': 'Warna Secondary',

  // Contact
  'contact.email': 'Email Kontak',
  'contact.phone': 'No. Telepon',
  'contact.whatsapp': 'No. WhatsApp',
  'contact.address': 'Alamat',

  // Social
  'social.instagram': 'Instagram',
  'social.facebook': 'Facebook',
  'social.twitter': 'Twitter/X',
  'social.youtube': 'YouTube',
  'social.tiktok': 'TikTok',

  // SEO
  'seo.title': 'SEO Title',
  'seo.description': 'SEO Description',
  'seo.keywords': 'SEO Keywords',
  'seo.og_image': 'OG Image URL',

  // Business
  'business.company_name': 'Nama Perusahaan',
  'business.npwp': 'NPWP',
  'business.siup': 'SIUP',
  'business.founded_year': 'Tahun Berdiri',

  // Stats
  'stats.total_trips': 'Total Trips',
  'stats.total_customers': 'Total Customers',
  'stats.total_destinations': 'Total Destinations',
  'stats.years_experience': 'Tahun Pengalaman',

  // Partner Rewards
  'partner_rewards.referral_points': 'Bonus Poin Referral Partner',
  'partner_rewards.points_per_10k': 'Poin per Rp 10.000 Booking',
  'partner_rewards.min_redemption_points': 'Minimum Poin untuk Redeem',
  'partner_rewards.points_expiration_months': 'Masa Berlaku Poin (Bulan)',
  'partner_rewards.milestone_configs': 'Konfigurasi Milestone',

  // Guide Bonus
  'guide_bonus.rating_5_percent': 'Bonus Rating 5 Bintang (%)',
  'guide_bonus.rating_4_percent': 'Bonus Rating 4 Bintang (%)',
  'guide_bonus.on_time_bonus': 'Bonus Tepat Waktu (Rp)',
  'guide_bonus.documentation_bonus': 'Bonus Dokumentasi (Rp)',
  'guide_bonus.guest_count_bonus_per_pax': 'Bonus per Pax Melebihi Target',
  'guide_bonus.reward_points_percentage': 'Persentase Reward Points (%)',

  // Approvals
  'approvals.super_admin_limit': 'Limit Super Admin (0 = Unlimited)',
  'approvals.finance_manager_limit': 'Limit Finance Manager (Rp)',
  'approvals.marketing_limit': 'Limit Marketing (Rp)',
  'approvals.ops_admin_limit': 'Limit Ops Admin (Rp)',

  // Finance
  'finance.tax_rate': 'Tarif PPN (%)',
  'finance.deposit_percentage': 'Persentase Deposit (%)',
  'finance.child_discount_percentage': 'Diskon Anak (%)',
  'finance.platform_fee_rate': 'Platform Fee (%)',
  'finance.guide_percentage': 'Persentase Guide (%)',
  'finance.tax_withheld_rate': 'PPh Potong (%)',
  'finance.cost_structures': 'Struktur Biaya Default',

  // Loyalty
  'loyalty.points_per_100k': 'Poin per Rp 100.000',
  'loyalty.referral_bonus': 'Bonus Referral',
  'loyalty.tier_bronze_min': 'Min Poin Bronze',
  'loyalty.tier_silver_min': 'Min Poin Silver',
  'loyalty.tier_gold_min': 'Min Poin Gold',

  // Rate Limits
  'rate_limits.guide_ai': 'Rate Limit Guide AI',
  'rate_limits.guide_upload': 'Rate Limit Guide Upload',
  'rate_limits.guide_sos': 'Rate Limit Guide SOS',
  'rate_limits.guide_ocr': 'Rate Limit Guide OCR',
  'rate_limits.guide_push': 'Rate Limit Guide Push',
  'rate_limits.public_post': 'Rate Limit Public POST',
  'rate_limits.public_get': 'Rate Limit Public GET',
  'rate_limits.public_ai': 'Rate Limit Public AI',
  'rate_limits.ai_chat': 'Rate Limit AI Chat',
  'rate_limits.payment': 'Rate Limit Payment',
  'rate_limits.general_api': 'Rate Limit General API',

  // Geofencing
  'geofencing.gps_timeout_ms': 'GPS Timeout (ms)',
  'geofencing.gps_max_age_ms': 'GPS Max Age untuk Get Position (ms)',
  'geofencing.gps_watch_max_age_ms': 'GPS Max Age untuk Watch (ms)',
  'geofencing.default_radius_meters': 'Default Radius Geofence (meter)',

  // Integrations
  'integrations.whatsapp_max_retries': 'WhatsApp Max Retries',
  'integrations.request_timeout_ms': 'Request Timeout (ms)',
  'integrations.webhook_timeout_ms': 'Webhook Timeout (ms)',

  // Validation
  'validation.package_code_min_length': 'Min Length Kode Paket',
  'validation.package_code_max_length': 'Max Length Kode Paket',
  'validation.package_name_min_length': 'Min Length Nama Paket',
  'validation.package_name_max_length': 'Max Length Nama Paket',
  'validation.slug_min_length': 'Min Length Slug',
  'validation.slug_max_length': 'Max Length Slug',
  'validation.short_description_max_length': 'Max Length Deskripsi Pendek',
  'validation.min_pax_minimum': 'Minimum Value Min Pax',
  'validation.max_pax_minimum': 'Minimum Value Max Pax',
};

export function getSettingLabel(key: string): string {
  if (SETTING_LABELS[key]) {
    return SETTING_LABELS[key];
  }

  // Try to format key to readable label
  const parts = key.split('.');
  const lastPart = parts[parts.length - 1] || key;
  return lastPart
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

