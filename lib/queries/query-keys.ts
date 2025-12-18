/**
 * Query Keys Factory
 * Centralized management of TanStack Query keys
 * 
 * Prevents typos and ensures consistency across the app
 */

/**
 * Base query key factory
 */
const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // Profiles
  profiles: {
    all: ['profiles'] as const,
    lists: () => [...queryKeys.profiles.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.profiles.lists(), filters] as const,
    details: () => [...queryKeys.profiles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.profiles.details(), id] as const,
  },

  // Bookings
  bookings: {
    all: ['bookings'] as const,
    lists: () => [...queryKeys.bookings.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.bookings.lists(), filters] as const,
    details: () => [...queryKeys.bookings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.bookings.details(), id] as const,
    byStatus: (status: string) =>
      [...queryKeys.bookings.all, 'status', status] as const,
  },

  // Packages
  packages: {
    all: ['packages'] as const,
    lists: () => [...queryKeys.packages.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.packages.lists(), filters] as const,
    details: () => [...queryKeys.packages.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.packages.details(), id] as const,
    bySlug: (slug: string) =>
      [...queryKeys.packages.all, 'slug', slug] as const,
    published: () => [...queryKeys.packages.all, 'published'] as const,
  },

  // Payments
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    byBooking: (bookingId: string) =>
      [...queryKeys.payments.all, 'booking', bookingId] as const,
  },

  // Documents
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.documents.lists(), filters] as const,
    details: () => [...queryKeys.documents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.documents.details(), id] as const,
    byTrip: (tripId: string) =>
      [...queryKeys.documents.all, 'trip', tripId] as const,
  },

  // SEO Pages
  seoPages: {
    all: ['seo-pages'] as const,
    byCityAndSlug: (city: string, slug: string) =>
      [...queryKeys.seoPages.all, city, slug] as const,
  },

  // Guide App
            guide: {
              all: ['guide'] as const,
              status: () => [...queryKeys.guide.all, 'status'] as const,
              trips: () => [...queryKeys.guide.all, 'trips'] as const,
              tripsDetail: (tripId: string) =>
                [...queryKeys.guide.trips(), tripId] as const,
              manifest: (tripId: string) =>
                [...queryKeys.guide.all, 'manifest', tripId] as const,
              wallet: {
                all: ['guide', 'wallet'] as const,
                balance: () => [...queryKeys.guide.wallet.all, 'balance'] as const,
                analytics: (period?: string) => [...queryKeys.guide.wallet.all, 'analytics', period] as const,
                pending: () => [...queryKeys.guide.wallet.all, 'pending'] as const,
                forecast: () => [...queryKeys.guide.wallet.all, 'forecast'] as const,
                transactions: (filters?: Record<string, unknown>) => [...queryKeys.guide.wallet.all, 'transactions', filters] as const,
                withdrawHistory: () => [...queryKeys.guide.wallet.all, 'withdraw-history'] as const,
                goals: () => [...queryKeys.guide.wallet.all, 'goals'] as const,
                milestones: () => [...queryKeys.guide.wallet.all, 'milestones'] as const,
                insights: () => [...queryKeys.guide.wallet.all, 'insights'] as const,
              },
              notifications: () => [...queryKeys.guide.all, 'notifications'] as const,
              ratings: () => [...queryKeys.guide.all, 'ratings'] as const,
              stats: () => [...queryKeys.guide.all, 'stats'] as const,
              leaderboard: () => [...queryKeys.guide.all, 'leaderboard'] as const,
              insights: {
                monthly: () => [...queryKeys.guide.all, 'insights', 'monthly'] as const,
                penalties: () => [...queryKeys.guide.all, 'insights', 'penalties'] as const,
              },
              broadcasts: () => [...queryKeys.guide.all, 'broadcasts'] as const,
              quickActions: () => [...queryKeys.guide.all, 'quick-actions'] as const,
              menuItems: () => [...queryKeys.guide.all, 'menu-items'] as const,
            },
} as const;

export default queryKeys;

/**
 * Usage examples:
 * 
 * import queryKeys from '@/lib/queries/query-keys';
 * 
 * // In useQuery
 * useQuery({
 *   queryKey: queryKeys.bookings.detail(bookingId),
 *   queryFn: () => getBooking(bookingId),
 * });
 * 
 * // In useMutation (invalidate)
 * mutation.mutate(data, {
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
 *   },
 * });
 */

