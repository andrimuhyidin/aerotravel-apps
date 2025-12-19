'use client';

/**
 * ID Card Preview Component
 * Professional ID card design with complete information and security features
 * Best practices: passport-style layout, security patterns, comprehensive data
 */

import { AlertCircle, CheckCircle2, Clock, Download, Mail, Phone, QrCode, Share2, Shield } from 'lucide-react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type IDCardStatus = 'active' | 'pending' | 'not_eligible' | 'expired' | 'suspended';

type IDCardPreviewProps = {
  status?: IDCardStatus;
  cardNumber?: string;
  guideName?: string;
  photoUrl?: string;
  branchName?: string;
  issueDate?: string;
  expiryDate?: string;
  qrCodeData?: string;
  verificationUrl?: string;
  phone?: string;
  email?: string;
  nik?: string;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
};

const statusConfig: Record<IDCardStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  active: {
    label: 'Aktif',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    icon: CheckCircle2,
  },
  pending: {
    label: 'Menunggu Verifikasi',
    className: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: Clock,
  },
  not_eligible: {
    label: 'Belum Eligible',
    className: 'bg-amber-100 text-amber-700 border-amber-300',
    icon: AlertCircle,
  },
  expired: {
    label: 'Kedaluwarsa',
    className: 'bg-red-100 text-red-700 border-red-300',
    icon: AlertCircle,
  },
  suspended: {
    label: 'Ditangguhkan',
    className: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: AlertCircle,
  },
};

export function IDCardPreview({
  status = 'not_eligible',
  cardNumber,
  guideName,
  photoUrl,
  branchName,
  issueDate,
  expiryDate,
  qrCodeData,
  verificationUrl,
  phone,
  email,
  nik,
  onDownload,
  onShare,
  className,
}: IDCardPreviewProps) {
  const statusInfo = statusConfig[status] || statusConfig.not_eligible;
  const StatusIcon = statusInfo.icon;
  const isActive = status === 'active';

  // Format dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      className={cn(
        'group relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border-4 border-slate-300/90 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 shadow-2xl transition-all duration-300',
        className,
      )}
    >
      {/* Security Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(16, 185, 129, 0.1) 10px,
            rgba(16, 185, 129, 0.1) 20px
          )`,
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 10px,
            rgba(16, 185, 129, 0.1) 10px,
            rgba(16, 185, 129, 0.1) 20px
          )`,
        }} />
      </div>

      {/* Watermark */}
      <div className="absolute right-4 top-20 rotate-12 opacity-5">
        <div className="text-6xl font-black text-emerald-600">ATGL</div>
      </div>

      {/* Hologram Shimmer Effect */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />
      )}

      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      {/* Decorative corner accent */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-200/30 blur-3xl" />

      {/* Card Content */}
      <div className="relative p-6 backdrop-blur-sm">
        {/* Header Section */}
        <div className="mb-5 flex items-center justify-between border-b-[3px] border-emerald-600/90 pb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <h3 className="text-2xl font-black text-emerald-700 drop-shadow-sm tracking-tight">
                AEROTRAVEL
              </h3>
            </div>
            <p className="mt-1 text-xs font-bold text-slate-600 uppercase tracking-widest">
              Guide License (ATGL)
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Branch</p>
            <p className="mt-0.5 text-sm font-black text-slate-900">{branchName || 'AeroTravel'}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4 flex justify-end">
          <Badge
            variant="outline"
            className={cn(
              'flex items-center gap-1.5 border-2 px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur-sm',
              statusInfo.className,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {statusInfo.label}
          </Badge>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="mb-5 grid grid-cols-[1fr_auto] gap-5">
          {/* Left Column - Info */}
          <div className="space-y-3">
            {/* Name */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nama Lengkap</p>
              <p className="mt-1 text-lg font-black text-slate-900 leading-tight">
                {guideName || 'Guide Name'}
              </p>
            </div>

            {/* Card Number - Always show */}
            <div className="rounded-lg bg-emerald-50/80 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Card Number</p>
              <p className="mt-1 text-sm font-mono font-black text-emerald-700 tracking-wider">
                {cardNumber || '-'}
              </p>
            </div>

            {/* Nomor ID - Always show */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nomor ID</p>
              <p className="mt-1 text-sm font-mono font-bold text-slate-800 tracking-wider">
                {nik || '-'}
              </p>
            </div>

            {/* Contact Info - Always show section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-xs font-semibold text-slate-700">
                  {phone || '-'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-xs font-semibold text-slate-700 line-clamp-1">
                  {email || '-'}
                </p>
              </div>
            </div>

            {/* Dates - Always show section */}
            <div className="mt-3 space-y-1.5 rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 text-[10px]">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Terbit:</span>
                <span className="font-bold text-slate-800">
                  {issueDate ? formatDate(issueDate) : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Kedaluwarsa:</span>
                <span className="font-bold text-slate-800">
                  {expiryDate ? formatDate(expiryDate) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Photo & QR */}
          <div className="flex flex-col items-center gap-4">
            {/* Photo - Passport Style */}
            <div className="relative">
              <div className="relative h-32 w-24 overflow-hidden rounded-lg border-[3px] border-emerald-600/90 bg-slate-100 shadow-xl ring-2 ring-emerald-200/60">
                {photoUrl && photoUrl.trim() !== '' ? (
                  <Image
                    src={photoUrl}
                    alt={guideName || 'Guide'}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 via-emerald-200 to-teal-200">
                    <span className="text-4xl font-black text-emerald-700 drop-shadow-sm">
                      {guideName?.[0]?.toUpperCase() || 'G'}
                    </span>
                  </div>
                )}
              </div>
              {/* Photo Label */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-2 py-0.5">
                <p className="text-[8px] font-bold text-white">PHOTO</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-lg border-2 border-emerald-200/90 bg-white/90 p-2.5 shadow-inner">
                {isActive && (qrCodeData || verificationUrl) ? (
                  <div className="rounded bg-white p-1 shadow-sm">
                    <QRCodeSVG
                      value={qrCodeData || verificationUrl || ''}
                      size={100}
                      level="M"
                      className="rounded"
                    />
                  </div>
                ) : (
                  <div className="flex h-[100px] w-[100px] items-center justify-center rounded bg-gradient-to-br from-slate-50 to-slate-100">
                    <QrCode className="h-10 w-10 text-slate-300" />
                  </div>
                )}
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {isActive ? 'Scan to Verify' : 'QR Code'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Security Notice */}
        <div className="mt-4 border-t border-slate-200/80 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-emerald-600" />
              <p className="text-[9px] font-semibold text-slate-600">
                Official AeroTravel Guide License
              </p>
            </div>
            {expiryDate && (
              <p className="text-[9px] font-bold text-slate-700">
                Valid until {formatDate(expiryDate)}
              </p>
            )}
          </div>
        </div>

        {/* Actions - Only show if active */}
        {isActive && (onDownload || onShare) && (
          <div className="mt-5 flex gap-3 border-t border-slate-200/80 pt-5">
            {onDownload && (
              <Button
                size="sm"
                className="flex-1 shadow-md transition-all hover:shadow-lg"
                onClick={onDownload}
                variant="default"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
            {onShare && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-2 transition-all hover:shadow-md"
                onClick={onShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Bagikan
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
