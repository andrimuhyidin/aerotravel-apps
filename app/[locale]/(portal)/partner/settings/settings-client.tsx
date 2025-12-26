/**
 * Partner Settings Client Component
 * REDESIGNED - Section-based, InfoCard, Clean layout
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, InfoCard } from '@/components/partner';
import { cn } from '@/lib/utils';
import {
  Building,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  Edit,
  CheckCircle2,
  Award,
  Globe,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import type { PartnerProfile } from '@/lib/partner/profile-service';

export function SettingsClient({ 
  locale,
  initialProfile 
}: { 
  locale: string;
  initialProfile: PartnerProfile;
}) {
  const profile = initialProfile; // Use initialData directly (no need to refetch for settings typically)

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'bg-gradient-to-r from-slate-400 to-slate-600 text-white';
      case 'gold':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'silver':
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      default:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Pengaturan Akun"
        description="Kelola profil dan preferensi"
      />

      {/* Content */}
      <div className="space-y-4 px-4 pb-20">
        {/* Profile Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt={profile.companyName}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  <Building className="h-8 w-8 text-primary" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {profile.companyName}
                  </h3>
                  {profile.isVerified && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold',
                      getTierColor(profile.tier)
                    )}
                  >
                    <Award className="h-3 w-3" />
                    {profile.tier.toUpperCase()} TIER
                  </span>
                  {profile.isVerified && (
                    <span className="text-xs text-green-600">✓ Verified Partner</span>
                  )}
                </div>
              </div>

              {/* Edit Button */}
              <Button variant="outline" size="sm">
                <Edit className="mr-1 h-3 w-3" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Informasi Kontak</h3>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <InfoCard
                label="Email"
                value={profile.email}
                icon={Mail}
                orientation="horizontal"
              />
              <InfoCard
                label="Telepon"
                value={profile.phone}
                icon={Phone}
                orientation="horizontal"
              />
              <InfoCard
                label="Alamat"
                value={`${profile.address}, ${profile.city}, ${profile.province} ${profile.postalCode}`}
                icon={MapPin}
                orientation="horizontal"
              />
            </div>
          </CardContent>
        </Card>

        {/* Legal Information */}
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Informasi Legal</h3>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <InfoCard
                label="SIUP"
                value={profile.siup}
                icon={Shield}
                orientation="horizontal"
              />
              <InfoCard
                label="NPWP"
                value={profile.npwp}
                icon={Shield}
                orientation="horizontal"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank Account */}
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Rekening Bank</h3>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <InfoCard
                label="Bank"
                value={profile.bankName}
                icon={CreditCard}
                orientation="horizontal"
              />
              <InfoCard
                label="Nomor Rekening"
                value={profile.bankAccountNumber}
                icon={CreditCard}
                orientation="horizontal"
              />
              <InfoCard
                label="Nama Pemegang"
                value={profile.bankAccountName}
                icon={CreditCard}
                orientation="horizontal"
              />
            </div>
          </CardContent>
        </Card>

        {/* Language & Timezone Preferences */}
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Bahasa & Zona Waktu</h3>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/${locale}/partner/settings/preferences`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              <InfoCard
                label="Bahasa"
                value="Indonesia"
                icon={Globe}
                orientation="horizontal"
              />
              <InfoCard
                label="Zona Waktu"
                value="WIB (UTC+7)"
                icon={Clock}
                orientation="horizontal"
              />
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Pengaturan bahasa dan zona waktu akan mempengaruhi tampilan tanggal, waktu, dan mata uang di dashboard Anda.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Settings */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="font-semibold text-foreground">Pengaturan Lainnya</h3>

            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/${locale}/partner/team`}>
                <Building className="mr-2 h-4 w-4" />
                Manajemen Tim
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/${locale}/partner/whitelabel`}>
                <Shield className="mr-2 h-4 w-4" />
                Whitelabel Settings
              </Link>
            </Button>

            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
              <Shield className="mr-2 h-4 w-4" />
              Ganti Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
