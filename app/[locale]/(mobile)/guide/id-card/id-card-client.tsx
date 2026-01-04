/**
 * ID Card Client
 * Display ID card with QR code and download option
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Clock } from 'lucide-react';

import { IDCardPreview } from '@/components/guide/id-card-preview';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';

import { LicenseApplicationFormClient } from '../license/apply/license-application-form-client';
import { LicenseEligibilityClient } from '../license/apply/license-eligibility-client';

type IDCard = {
  id: string;
  card_number: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  qr_code_url?: string;
  verification_token: string;
};

type IDCardClientProps = {
  locale: string;
};

export function IDCardClient({ locale }: IDCardClientProps) {
  // Get eligibility status
  const { data: eligibilityData } = useQuery<{
    eligible: boolean;
    has_license: boolean;
    has_application: boolean;
  }>({
    queryKey: ['guide-license-eligibility'],
    queryFn: async () => {
      const res = await fetch('/api/guide/license/eligibility');
      if (!res.ok) return { eligible: false, has_license: false, has_application: false };
      return res.json();
    },
  });

  const { data, isLoading, error, refetch } = useQuery<{
    id_card: IDCard;
    qr_code_url?: string;
    download_url: string;
    is_expired: boolean;
    days_until_expiry: number;
    guide_name?: string;
    photo_url?: string;
    branch_name?: string;
    phone?: string;
    email?: string;
    nik?: string;
  }>({
    queryKey: queryKeys.guide.idCard.current(),
    queryFn: async () => {
      const res = await fetch('/api/guide/id-card');
      if (!res.ok) {
        if (res.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch ID card');
      }
      return res.json();
    },
  });

  // Get preview data for locked card (must be before early returns)
  const { data: previewData, isLoading: isLoadingPreview } = useQuery<{
    guide_name?: string;
    photo_url?: string;
    branch_name?: string;
    phone?: string;
    email?: string;
    nik?: string;
  }>({
    queryKey: ['guide-id-card-preview-data'],
    queryFn: async () => {
      const res = await fetch('/api/guide/id-card/preview-data');
      if (!res.ok) return { guide_name: 'Guide', branch_name: 'AeroTravel' };
      return res.json();
    },
    enabled: !data, // Only fetch if no ID card
  });

  // Get QR code data (must be before early returns)
  const { data: qrData } = useQuery<{
    verification_url?: string;
    qr_code_data?: string;
  }>({
    queryKey: queryKeys.guide.idCard.qrCode(),
    queryFn: async () => {
      const res = await fetch('/api/guide/id-card/qr-code');
      if (!res.ok) throw new Error('Failed to fetch QR code');
      return res.json();
    },
    enabled: !!data?.id_card && !data.is_expired && data.id_card.status === 'active',
  });

  // Early returns AFTER all hooks
  if (isLoading) {
    return <LoadingState message="Memuat ID Card..." />;
  }

  if (error) {
    return <ErrorState message="Gagal memuat ID Card" onRetry={() => { refetch(); }} />;
  }

  // If no ID card, show preview with status and license application flow
  if (!data) {
    // Show loading if preview data is still loading
    if (isLoadingPreview) {
      return <LoadingState message="Memuat data preview..." />;
    }
    const isEligible = eligibilityData?.eligible ?? false;
    const hasApplication = eligibilityData?.has_application ?? false;

    // Determine status
    let status: 'not_eligible' | 'pending' = 'not_eligible';
    if (hasApplication) {
      status = 'pending';
    } else if (!isEligible) {
      status = 'not_eligible';
    }

    // Ensure we have preview data
    const finalPreviewData = previewData || {
      guide_name: 'Guide Name',
      branch_name: 'AeroTravel',
      phone: undefined,
      email: undefined,
      nik: undefined,
      photo_url: undefined,
    };

    return (
      <div className="space-y-8">
        {/* ID Card Preview */}
        <div className="animate-fade-in">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-900">Preview ID Card</h2>
            <p className="mt-1 text-sm text-slate-600">
              Tampilan ID Card Anda setelah requirements terpenuhi
            </p>
          </div>
          <IDCardPreview
            status={status}
            guideName={finalPreviewData.guide_name}
            photoUrl={finalPreviewData.photo_url || undefined}
            branchName={finalPreviewData.branch_name}
            phone={finalPreviewData.phone}
            email={finalPreviewData.email}
            nik={finalPreviewData.nik}
          />
        </div>

        {/* License Eligibility Check - Single source of truth for requirements */}
        <div className="animate-fade-in">
          <LicenseEligibilityClient 
            locale={locale} 
            onEligible={() => {
              // Scroll to form when eligible
              document.getElementById('license-application-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </div>

        {/* License Application Form */}
        <div id="license-application-form" className="animate-fade-in">
          <LicenseApplicationFormClient locale={locale} />
        </div>
      </div>
    );
  }

  const { id_card, is_expired, days_until_expiry, guide_name, photo_url, branch_name } = data;
  
  // Determine card status
  let cardStatus: 'active' | 'expired' | 'suspended' = 'active';
  if (is_expired) {
    cardStatus = 'expired';
  } else if (id_card.status === 'suspended' || id_card.status === 'revoked') {
    cardStatus = 'suspended';
  } else if (id_card.status === 'active') {
    cardStatus = 'active';
  }

  return (
    <div className="space-y-8">
      {/* Status Alert - Only show if expired or expiring soon */}
      {is_expired && (
        <Card className="animate-fade-in border-red-200/80 bg-gradient-to-br from-red-50 to-red-100/50 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-500 p-2 shadow-sm">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-900">ID Card telah kedaluwarsa</p>
                <p className="mt-1.5 text-sm text-red-700">
                  Hubungi admin untuk memperpanjang ID Card Anda
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!is_expired && days_until_expiry <= 30 && (
        <Card className="animate-fade-in border-yellow-200/80 bg-gradient-to-br from-yellow-50 to-amber-100/50 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-yellow-500 p-2 shadow-sm">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-yellow-900">
                  ID Card akan kedaluwarsa dalam {days_until_expiry} hari
                </p>
                <p className="mt-1.5 text-sm text-yellow-700">
                  Hubungi admin untuk memperpanjang sebelum kedaluwarsa
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ID Card Preview */}
      <div className="animate-fade-in">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">ID Card Anda</h2>
          <p className="mt-1 text-sm text-slate-600">
            Tampilkan ID Card untuk verifikasi dan download
          </p>
        </div>
        <IDCardPreview
          status={cardStatus}
          cardNumber={id_card.card_number}
          guideName={guide_name}
          photoUrl={photo_url || undefined}
          branchName={branch_name}
          issueDate={id_card.issue_date}
          expiryDate={id_card.expiry_date}
          qrCodeData={qrData?.verification_url || qrData?.qr_code_data}
          verificationUrl={qrData?.verification_url}
          phone={data.phone}
          email={data.email}
          nik={data.nik}
          onDownload={() => {
            window.open('/api/guide/id-card/download', '_blank');
          }}
          onShare={() => {
            if (qrData?.verification_url) {
              navigator.share?.({
                title: 'AeroTravel Guide License',
                text: `Verifikasi ID Card: ${id_card.card_number}`,
                url: qrData.verification_url,
              });
            }
          }}
        />
      </div>
    </div>
  );
}
