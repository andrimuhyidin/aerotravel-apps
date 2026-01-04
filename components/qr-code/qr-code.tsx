/**
 * QR Code Component
 * Sesuai PRD - QR Code Generation
 * 
 * Generate QR codes for payment, booking, etc.
 */

'use client';

import { QRCodeSVG } from 'qrcode.react';

export type QRCodeProps = {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  className?: string;
  title?: string;
  description?: string;
};

export function QRCode({
  value,
  size = 200,
  level = 'M',
  includeMargin = true,
  className = '',
  title,
  description,
}: QRCodeProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
      )}
      <QRCodeSVG
        value={value}
        size={size}
        level={level}
        includeMargin={includeMargin}
      />
      {description && (
        <p className="mt-2 text-sm text-gray-600 text-center max-w-xs">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Payment QR Code Component
 */
export function PaymentQRCode({
  paymentUrl,
  amount,
  bookingId,
  ...props
}: Omit<QRCodeProps, 'value'> & {
  paymentUrl: string;
  amount?: number;
  bookingId?: string;
}) {
  return (
    <QRCode
      value={paymentUrl}
      title="Scan untuk Pembayaran"
      description={
        amount
          ? `Total: Rp ${amount.toLocaleString('id-ID')}`
          : bookingId
          ? `Booking ID: ${bookingId}`
          : 'Scan QR code untuk melanjutkan pembayaran'
      }
      {...props}
    />
  );
}

/**
 * Booking QR Code Component
 */
export function BookingQRCode({
  bookingId,
  checkInUrl,
  ...props
}: Omit<QRCodeProps, 'value'> & {
  bookingId: string;
  checkInUrl?: string;
}) {
  const qrValue = checkInUrl || `booking:${bookingId}`;

  return (
    <QRCode
      value={qrValue}
      title="E-Ticket QR Code"
      description={`Booking ID: ${bookingId}\nScan untuk check-in`}
      {...props}
    />
  );
}

