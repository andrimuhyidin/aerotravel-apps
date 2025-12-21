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
              safetyChecklistTemplates: () => [...queryKeys.guide.all, 'safety-checklist-templates'] as const,
              tripsDetail: (tripId: string) =>
                [...queryKeys.guide.trips.all(), tripId] as const,
              tripsBriefing: (tripId: string) =>
                [...queryKeys.guide.trips.all(), tripId, 'briefing'] as const,
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
              ratings: {
                all: () => [...queryKeys.guide.all, 'ratings'] as const,
                byTrip: (tripId: string) => [...queryKeys.guide.all, 'ratings', 'trip', tripId] as const,
              },
              stats: () => [...queryKeys.guide.all, 'stats'] as const,
              leaderboard: () => [...queryKeys.guide.all, 'leaderboard'] as const,
              insights: {
                monthly: () => [...queryKeys.guide.all, 'insights', 'monthly'] as const,
                penalties: () => [...queryKeys.guide.all, 'insights', 'penalties'] as const,
              },
              broadcasts: () => [...queryKeys.guide.all, 'broadcasts'] as const,
              quickActions: () => [...queryKeys.guide.all, 'quick-actions'] as const,
              menuItems: () => [...queryKeys.guide.all, 'menu-items'] as const,
              expenseCategories: () => [...queryKeys.guide.all, 'expense-categories'] as const,
              emergencyContacts: () => [...queryKeys.guide.all, 'emergency-contacts'] as const,
              medicalInfo: () => [...queryKeys.guide.all, 'medical-info'] as const,
              weather: (lat?: number, lng?: number, date?: string) => [...queryKeys.guide.all, 'weather', lat, lng, date] as const,
              challenges: () => [...queryKeys.guide.all, 'challenges'] as const,
              rewardPoints: () => [...queryKeys.guide.all, 'rewards', 'points'] as const,
              rewardCatalog: () => [...queryKeys.guide.all, 'rewards', 'catalog'] as const,
              rewardTransactions: () => [...queryKeys.guide.all, 'rewards', 'transactions'] as const,
              rewardRedemptions: () => [...queryKeys.guide.all, 'rewards', 'redemptions'] as const,
              social: {
                feed: (page?: number) => [...queryKeys.guide.all, 'social', 'feed', page] as const,
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
              certifications: {
                all: () => [...queryKeys.guide.all, 'certifications'] as const,
                list: (filters?: Record<string, unknown>) => [...queryKeys.guide.certifications.all(), 'list', filters] as const,
                detail: (id: string) => [...queryKeys.guide.certifications.all(), 'detail', id] as const,
                validity: () => [...queryKeys.guide.certifications.all(), 'validity'] as const,
              },
              training: {
                all: () => [...queryKeys.guide.all, 'training'] as const,
                modules: () => [...queryKeys.guide.training.all(), 'modules'] as const,
                sessions: (filters?: Record<string, unknown>) => [...queryKeys.guide.training.all(), 'sessions', filters] as const,
                certificates: () => [...queryKeys.guide.training.all(), 'certificates'] as const,
                certificate: (id: string) => [...queryKeys.guide.training.all(), 'certificate', id] as const,
                mandatory: () => [...queryKeys.guide.training.all(), 'mandatory'] as const,
              },
              trips: {
                all: () => [...queryKeys.guide.all, 'trips'] as const,
                riskAssessment: (tripId: string) => [...queryKeys.guide.trips.all(), tripId, 'risk-assessment'] as const,
                canStart: (tripId: string) => [...queryKeys.guide.trips.all(), tripId, 'can-start'] as const,
                paymentSplit: (tripId: string) => [...queryKeys.guide.trips.all(), tripId, 'payment-split'] as const,
                paymentStatus: (tripId: string) => [...queryKeys.guide.trips.all(), tripId, 'payment-status'] as const,
                completionStatus: (tripId: string) => [...queryKeys.guide.trips.all(), tripId, 'completion-status'] as const,
                tipping: (tripId: string) => [...queryKeys.guide.trips.all(), tripId, 'tipping'] as const,
                tippingStatus: (tripId: string, tippingId: string) => [...queryKeys.guide.trips.all(), tripId, 'tipping', tippingId, 'status'] as const,
                engagement: {
                  quiz: (tripId: string) => [...queryKeys.guide.trips.all(), tripId, 'engagement', 'quiz'] as const,
                  leaderboard: (tripId: string) => [...queryKeys.guide.trips.all(), tripId, 'engagement', 'leaderboard'] as const,
                  music: (tripId: string) => [...queryKeys.guide.trips.all(), tripId, 'engagement', 'music'] as const,
                },
                facilityChecklist: (tripId: string) => [...queryKeys.guide.trips.all(), tripId, 'facility-checklist'] as const,
                wasteLog: (tripId: string) => [...queryKeys.guide.trips.all(), tripId, 'waste-log'] as const,
              },
              equipment: {
                all: () => [...queryKeys.guide.all, 'equipment'] as const,
                checklistTemplates: () => [...queryKeys.guide.equipment.all(), 'checklist-templates'] as const,
              },
              wasteTypes: () => [...queryKeys.guide.all, 'waste-types'] as const,
              disposalMethods: () => [...queryKeys.guide.all, 'disposal-methods'] as const,
              logistics: {
                all: () => [...queryKeys.guide.all, 'logistics'] as const,
                handover: (filters?: Record<string, unknown>) => [...queryKeys.guide.logistics.all(), 'handover', filters] as const,
              },
              maps: {
                all: () => [...queryKeys.guide.all, 'maps'] as const,
                dangerZones: (lat?: number, lng?: number, radius?: number) => [...queryKeys.guide.maps.all(), 'danger-zones', lat, lng, radius] as const,
                signalHotspots: (lat?: number, lng?: number, radius?: number) => [...queryKeys.guide.maps.all(), 'signal-hotspots', lat, lng, radius] as const,
              },
              team: {
                all: () => [...queryKeys.guide.all, 'team'] as const,
                tripTeam: (tripId: string) => [...queryKeys.guide.team.all(), 'trip', tripId] as const,
                myTeam: () => [...queryKeys.guide.team.all(), 'my-team'] as const,
                directory: {
                  all: () => [...queryKeys.guide.team.all(), 'directory'] as const,
                  search: (filters?: Record<string, unknown>) => [...queryKeys.guide.team.directory.all(), 'search', filters] as const,
                  nearby: (lat?: number, lng?: number) => [...queryKeys.guide.team.directory.all(), 'nearby', lat, lng] as const,
                  detail: (guideId: string) => [...queryKeys.guide.team.directory.all(), 'detail', guideId] as const,
                },
                notes: {
                  all: () => [...queryKeys.guide.team.all(), 'notes'] as const,
                  trip: (tripId: string) => [...queryKeys.guide.team.notes.all(), 'trip', tripId] as const,
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

