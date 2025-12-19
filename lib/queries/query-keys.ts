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

  // User Roles
  user: {
    all: ['user'] as const,
    roles: () => [...queryKeys.user.all, 'roles'] as const,
    activeRole: () => [...queryKeys.user.all, 'active-role'] as const,
    roleApplications: () => [...queryKeys.user.all, 'role-applications'] as const,
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
              tripsBriefing: (tripId: string) =>
                [...queryKeys.guide.trips(), tripId, 'briefing'] as const,
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
                bankAccounts: () => [...queryKeys.guide.wallet.all, 'bank-accounts'] as const,
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
              emergencyContacts: () => [...queryKeys.guide.all, 'emergency-contacts'] as const,
              medicalInfo: () => [...queryKeys.guide.all, 'medical-info'] as const,
              weather: (lat?: number, lng?: number, date?: string) => [...queryKeys.guide.all, 'weather', lat, lng, date] as const,
              challenges: () => [...queryKeys.guide.all, 'challenges'] as const,
              social: {
                feed: (page?: number) => [...queryKeys.guide.all, 'social', 'feed', page] as const,
              },
              training: {
                modules: () => [...queryKeys.guide.all, 'training', 'modules'] as const,
              },
              aiInsights: () => [...queryKeys.guide.all, 'ai-insights'] as const,
              onboarding: {
                all: () => [...queryKeys.guide.all, 'onboarding'] as const,
                steps: () => [...queryKeys.guide.onboarding.all(), 'steps'] as const,
                progress: () => [...queryKeys.guide.onboarding.all(), 'progress'] as const,
                step: (stepId: string) => [...queryKeys.guide.onboarding.all(), 'step', stepId] as const,
              },
              assessments: {
                all: () => [...queryKeys.guide.all, 'assessments'] as const,
                available: () => [...queryKeys.guide.assessments.all(), 'available'] as const,
                templates: () => [...queryKeys.guide.assessments.all(), 'templates'] as const,
                template: (templateId: string) => [...queryKeys.guide.assessments.all(), 'template', templateId] as const,
                history: (filters?: Record<string, unknown>) => [...queryKeys.guide.assessments.all(), 'history', filters] as const,
                assessment: (assessmentId: string) => [...queryKeys.guide.assessments.all(), 'assessment', assessmentId] as const,
              },
              skills: {
                all: () => [...queryKeys.guide.all, 'skills'] as const,
                catalog: () => [...queryKeys.guide.skills.all(), 'catalog'] as const,
                guide: () => [...queryKeys.guide.skills.all(), 'guide'] as const,
                goals: () => [...queryKeys.guide.skills.all(), 'goals'] as const,
                recommendations: () => [...queryKeys.guide.skills.all(), 'recommendations'] as const,
              },
              preferences: () => [...queryKeys.guide.all, 'preferences'] as const,
              performance: {
                all: () => [...queryKeys.guide.all, 'performance'] as const,
                metrics: (filters?: Record<string, unknown>) => [...queryKeys.guide.performance.all(), 'metrics', filters] as const,
                trends: (filters?: Record<string, unknown>) => [...queryKeys.guide.performance.all(), 'trends', filters] as const,
                insights: () => [...queryKeys.guide.performance.all(), 'insights'] as const,
              },
              feedback: {
                all: () => [...queryKeys.guide.all, 'feedback'] as const,
                list: (filters?: Record<string, unknown>) => [...queryKeys.guide.feedback.all(), 'list', filters] as const,
                detail: (id: string) => [...queryKeys.guide.feedback.all(), 'detail', id] as const,
                stats: () => [...queryKeys.guide.feedback.all(), 'stats'] as const,
                analytics: (filters?: Record<string, unknown>) => [...queryKeys.guide.feedback.all(), 'analytics', filters] as const,
              },
              idCard: {
                all: () => [...queryKeys.guide.all, 'id-card'] as const,
                current: () => [...queryKeys.guide.idCard.all(), 'current'] as const,
                qrCode: () => [...queryKeys.guide.idCard.all(), 'qr-code'] as const,
              },
              license: {
                all: () => [...queryKeys.guide.all, 'license'] as const,
                application: () => [...queryKeys.guide.license.all(), 'application'] as const,
                applicationDetail: (id: string) => [...queryKeys.guide.license.all(), 'application', id] as const,
                documents: (applicationId: string) => [...queryKeys.guide.license.all(), 'documents', applicationId] as const,
                assessments: (applicationId: string) => [...queryKeys.guide.license.all(), 'assessments', applicationId] as const,
                training: (applicationId: string) => [...queryKeys.guide.license.all(), 'training', applicationId] as const,
              },
              contracts: {
                all: () => [...queryKeys.guide.all, 'contracts'] as const,
                list: (filters?: Record<string, unknown>) => [...queryKeys.guide.contracts.all(), 'list', filters] as const,
                detail: (id: string) => [...queryKeys.guide.contracts.all(), 'detail', id] as const,
                sanctions: {
                  all: () => [...queryKeys.guide.contracts.all(), 'sanctions'] as const,
                  list: (contractId?: string, filters?: Record<string, unknown>) => [...queryKeys.guide.contracts.sanctions.all(), 'list', contractId, filters] as const,
                  detail: (id: string) => [...queryKeys.guide.contracts.sanctions.all(), 'detail', id] as const,
                },
                resignations: {
                  all: () => [...queryKeys.guide.contracts.all(), 'resignations'] as const,
                  list: (contractId?: string, filters?: Record<string, unknown>) => [...queryKeys.guide.contracts.resignations.all(), 'list', contractId, filters] as const,
                  detail: (id: string) => [...queryKeys.guide.contracts.resignations.all(), 'detail', id] as const,
                  current: (contractId: string) => [...queryKeys.guide.contracts.resignations.all(), 'current', contractId] as const,
                },
              },
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

