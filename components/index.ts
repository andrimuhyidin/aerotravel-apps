/**
 * Barrel Exports for Components
 * Clean imports: import { Container, Section } from '@/components'
 */

// Layout Components
export { Container } from './layout/container';
export type { ContainerProps } from './layout/container';
export { Section } from './layout/section';
export type { SectionProps } from './layout/section';

// UI Components
export { LoadingSpinner, LoadingSkeleton, LoadingPage } from './ui/loading';
export type { LoadingSpinnerProps, LoadingSkeletonProps } from './ui/loading';

// Error Boundary
export { ErrorBoundary } from './error-boundary';

// Map Components
export { DynamicMap } from './map/dynamic-map';
export type { DynamicMapProps, MapLocation } from './map/dynamic-map';

// QR Code Components
export { QRCode, PaymentQRCode, BookingQRCode } from './qr-code/qr-code';
export type { QRCodeProps } from './qr-code/qr-code';

