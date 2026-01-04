/**
 * Barrel Exports for Hooks
 * Clean imports: import { useIsMobile, useMediaQuery } from '@/hooks'
 */

export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from './use-media-query';
export { usePartnerAuth } from './use-partner-auth';
export type { PartnerAuthData } from './use-partner-auth';
export { usePwaInstall } from './use-pwa-install';
export { useOfflineStatus } from './use-offline-status';

// Realtime hooks
export { useBookingRealtime, useBookingRealtimeByCode } from './use-booking-realtime';
export { usePaymentRealtimeSync, usePaymentsListRealtimeSync } from './use-payment-realtime';
export { useGuideWalletRealtimeSync, usePartnerWalletRealtimeSync, useAdminWalletRealtimeSync } from './use-wallet-realtime';
export { useRealtimeQuery, useRealtimeSubscription, type UseRealtimeQueryOptions, type UseRealtimeQueryResult } from './use-realtime-query';

