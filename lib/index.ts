/**
 * Barrel Exports for Lib Utilities
 * Clean imports: import { cn, sanitizeHtml } from '@/lib'
 */

// Utils
export { cn } from './utils';
export * from './utils/accessibility';
export * from './utils/responsive';
export * from './utils/sanitize';

// Design Tokens
export { designTokens } from './design/tokens';
export type { DesignTokens } from './design/tokens';

// API
export { ApiClient, apiClient } from './api/client';
export type { ApiRequestOptions, ApiResponse } from './api/client';
export * from './api/error-handler';

// Queries
export { default as queryKeys } from './queries/query-keys';

// Environment
export { env } from './env';

// Phase 2: Guide App
export * from './guide';

// Phase 2: Partner Portal
export * from './partner';

// Phase 2: Inventory
export * from './inventory';

// Offline - import directly from '@/lib/offline/sync-manager' to avoid conflicts
// export * from './offline/sync-manager';

