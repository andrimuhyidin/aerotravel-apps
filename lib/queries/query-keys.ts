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
    roleApplications: () =>
      [...queryKeys.user.all, 'role-applications'] as const,
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
    safetyChecklistTemplates: () =>
      [...queryKeys.guide.all, 'safety-checklist-templates'] as const,
    tripsDetail: (tripId: string) =>
      [...queryKeys.guide.trips.all(), tripId] as const,
    tripsBriefing: (tripId: string) =>
      [...queryKeys.guide.trips.all(), tripId, 'briefing'] as const,
    manifest: (tripId: string) =>
      [...queryKeys.guide.all, 'manifest', tripId] as const,
    wallet: {
      all: ['guide', 'wallet'] as const,
      balance: () => [...queryKeys.guide.wallet.all, 'balance'] as const,
      analytics: (period?: string) =>
        [...queryKeys.guide.wallet.all, 'analytics', period] as const,
      pending: () => [...queryKeys.guide.wallet.all, 'pending'] as const,
      forecast: () => [...queryKeys.guide.wallet.all, 'forecast'] as const,
      transactions: (filters?: Record<string, unknown>) =>
        [...queryKeys.guide.wallet.all, 'transactions', filters] as const,
      withdrawHistory: () =>
        [...queryKeys.guide.wallet.all, 'withdraw-history'] as const,
      goals: () => [...queryKeys.guide.wallet.all, 'goals'] as const,
      milestones: () => [...queryKeys.guide.wallet.all, 'milestones'] as const,
      insights: () => [...queryKeys.guide.wallet.all, 'insights'] as const,
      bankAccounts: () =>
        [...queryKeys.guide.wallet.all, 'bank-accounts'] as const,
      qris: () => [...queryKeys.guide.wallet.all, 'qris'] as const,
    },
    notifications: () => [...queryKeys.guide.all, 'notifications'] as const,
    ratings: {
      all: () => [...queryKeys.guide.all, 'ratings'] as const,
      byTrip: (tripId: string) =>
        [...queryKeys.guide.all, 'ratings', 'trip', tripId] as const,
    },
    stats: () => [...queryKeys.guide.all, 'stats'] as const,
    leaderboard: () => [...queryKeys.guide.all, 'leaderboard'] as const,
    insights: {
      monthly: () => [...queryKeys.guide.all, 'insights', 'monthly'] as const,
      penalties: () =>
        [...queryKeys.guide.all, 'insights', 'penalties'] as const,
    },
    broadcasts: () => [...queryKeys.guide.all, 'broadcasts'] as const,
    quickActions: () => [...queryKeys.guide.all, 'quick-actions'] as const,
    menuItems: () => [...queryKeys.guide.all, 'menu-items'] as const,
    expenseCategories: () =>
      [...queryKeys.guide.all, 'expense-categories'] as const,
    emergencyContacts: () =>
      [...queryKeys.guide.all, 'emergency-contacts'] as const,
    medicalInfo: () => [...queryKeys.guide.all, 'medical-info'] as const,
    weather: (lat?: number, lng?: number, date?: string) =>
      [...queryKeys.guide.all, 'weather', lat, lng, date] as const,
    challenges: () => [...queryKeys.guide.all, 'challenges'] as const,
    rewardPoints: () => [...queryKeys.guide.all, 'rewards', 'points'] as const,
    rewardCatalog: () =>
      [...queryKeys.guide.all, 'rewards', 'catalog'] as const,
    rewardTransactions: () =>
      [...queryKeys.guide.all, 'rewards', 'transactions'] as const,
    rewardRedemptions: () =>
      [...queryKeys.guide.all, 'rewards', 'redemptions'] as const,
    social: {
      feed: (page?: number) =>
        [...queryKeys.guide.all, 'social', 'feed', page] as const,
      stories: () => [...queryKeys.guide.all, 'social', 'stories'] as const,
      storyDetail: (id: string) =>
        [...queryKeys.guide.all, 'social', 'stories', id] as const,
    },
    mentorship: {
      all: () => [...queryKeys.guide.all, 'mentorship'] as const,
      asMentor: () => [...queryKeys.guide.all, 'mentorship', 'as-mentor'] as const,
      asMentee: () => [...queryKeys.guide.all, 'mentorship', 'as-mentee'] as const,
      detail: (id: string) =>
        [...queryKeys.guide.all, 'mentorship', 'detail', id] as const,
      availableMentors: () =>
        [...queryKeys.guide.all, 'mentorship', 'available-mentors'] as const,
    },
    aiInsights: () => [...queryKeys.guide.all, 'ai-insights'] as const,
    onboarding: {
      all: () => [...queryKeys.guide.all, 'onboarding'] as const,
      steps: () => [...queryKeys.guide.onboarding.all(), 'steps'] as const,
      progress: () =>
        [...queryKeys.guide.onboarding.all(), 'progress'] as const,
      step: (stepId: string) =>
        [...queryKeys.guide.onboarding.all(), 'step', stepId] as const,
    },
    assessments: {
      all: () => [...queryKeys.guide.all, 'assessments'] as const,
      available: () =>
        [...queryKeys.guide.assessments.all(), 'available'] as const,
      templates: () =>
        [...queryKeys.guide.assessments.all(), 'templates'] as const,
      template: (templateId: string) =>
        [...queryKeys.guide.assessments.all(), 'template', templateId] as const,
      history: (filters?: Record<string, unknown>) =>
        [...queryKeys.guide.assessments.all(), 'history', filters] as const,
      assessment: (assessmentId: string) =>
        [
          ...queryKeys.guide.assessments.all(),
          'assessment',
          assessmentId,
        ] as const,
    },
    skills: {
      all: () => [...queryKeys.guide.all, 'skills'] as const,
      catalog: () => [...queryKeys.guide.skills.all(), 'catalog'] as const,
      guide: () => [...queryKeys.guide.skills.all(), 'guide'] as const,
      goals: () => [...queryKeys.guide.skills.all(), 'goals'] as const,
      recommendations: () =>
        [...queryKeys.guide.skills.all(), 'recommendations'] as const,
    },
    preferences: () => [...queryKeys.guide.all, 'preferences'] as const,
    performance: {
      all: () => [...queryKeys.guide.all, 'performance'] as const,
      metrics: (filters?: Record<string, unknown>) =>
        [...queryKeys.guide.performance.all(), 'metrics', filters] as const,
      trends: (filters?: Record<string, unknown>) =>
        [...queryKeys.guide.performance.all(), 'trends', filters] as const,
      insights: () =>
        [...queryKeys.guide.performance.all(), 'insights'] as const,
    },
    metrics: {
      unified: (filters?: Record<string, unknown>) =>
        [...queryKeys.guide.all, 'metrics', 'unified', filters] as const,
    },
    aiInsights: {
      unified: (filters?: Record<string, unknown>) =>
        [...queryKeys.guide.all, 'ai-insights', 'unified', filters] as const,
    },
    feedback: {
      all: () => [...queryKeys.guide.all, 'feedback'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.guide.feedback.all(), 'list', filters] as const,
      detail: (id: string) =>
        [...queryKeys.guide.feedback.all(), 'detail', id] as const,
      stats: () => [...queryKeys.guide.feedback.all(), 'stats'] as const,
      analytics: (filters?: Record<string, unknown>) =>
        [...queryKeys.guide.feedback.all(), 'analytics', filters] as const,
    },
    idCard: {
      all: () => [...queryKeys.guide.all, 'id-card'] as const,
      current: () => [...queryKeys.guide.idCard.all(), 'current'] as const,
      qrCode: () => [...queryKeys.guide.idCard.all(), 'qr-code'] as const,
    },
    license: {
      all: () => [...queryKeys.guide.all, 'license'] as const,
      application: () =>
        [...queryKeys.guide.license.all(), 'application'] as const,
      applicationDetail: (id: string) =>
        [...queryKeys.guide.license.all(), 'application', id] as const,
      documents: (applicationId: string) =>
        [...queryKeys.guide.license.all(), 'documents', applicationId] as const,
      assessments: (applicationId: string) =>
        [
          ...queryKeys.guide.license.all(),
          'assessments',
          applicationId,
        ] as const,
      training: (applicationId: string) =>
        [...queryKeys.guide.license.all(), 'training', applicationId] as const,
    },
    contracts: {
      all: () => [...queryKeys.guide.all, 'contracts'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.guide.contracts.all(), 'list', filters] as const,
      detail: (id: string) =>
        [...queryKeys.guide.contracts.all(), 'detail', id] as const,
      sanctions: {
        all: () => [...queryKeys.guide.contracts.all(), 'sanctions'] as const,
        list: (contractId?: string, filters?: Record<string, unknown>) =>
          [
            ...queryKeys.guide.contracts.sanctions.all(),
            'list',
            contractId,
            filters,
          ] as const,
        detail: (id: string) =>
          [...queryKeys.guide.contracts.sanctions.all(), 'detail', id] as const,
      },
      resignations: {
        all: () =>
          [...queryKeys.guide.contracts.all(), 'resignations'] as const,
        list: (contractId?: string, filters?: Record<string, unknown>) =>
          [
            ...queryKeys.guide.contracts.resignations.all(),
            'list',
            contractId,
            filters,
          ] as const,
        detail: (id: string) =>
          [
            ...queryKeys.guide.contracts.resignations.all(),
            'detail',
            id,
          ] as const,
        current: (contractId: string) =>
          [
            ...queryKeys.guide.contracts.resignations.all(),
            'current',
            contractId,
          ] as const,
      },
    },
    certifications: {
      all: () => [...queryKeys.guide.all, 'certifications'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.guide.certifications.all(), 'list', filters] as const,
      detail: (id: string) =>
        [...queryKeys.guide.certifications.all(), 'detail', id] as const,
      validity: () =>
        [...queryKeys.guide.certifications.all(), 'validity'] as const,
      expiring: () =>
        [...queryKeys.guide.certifications.all(), 'expiring'] as const,
    },
    training: {
      all: () => [...queryKeys.guide.all, 'training'] as const,
      modules: () => [...queryKeys.guide.training.all(), 'modules'] as const,
      sessions: (filters?: Record<string, unknown>) =>
        [...queryKeys.guide.training.all(), 'sessions', filters] as const,
      certificates: () =>
        [...queryKeys.guide.training.all(), 'certificates'] as const,
      certificate: (id: string) =>
        [...queryKeys.guide.training.all(), 'certificate', id] as const,
      mandatory: () =>
        [...queryKeys.guide.training.all(), 'mandatory'] as const,
      quiz: (moduleId: string) =>
        [...queryKeys.guide.training.all(), 'quiz', moduleId] as const,
      feedback: (trainingId: string) =>
        [...queryKeys.guide.training.all(), 'feedback', trainingId] as const,
    },
    attendance: {
      all: () => [...queryKeys.guide.all, 'attendance'] as const,
      detail: (attendanceId: string) =>
        [...queryKeys.guide.attendance.all(), attendanceId] as const,
      history: (guideId: string) =>
        [...queryKeys.guide.attendance.all(), 'history', guideId] as const,
      stats: (guideId: string) =>
        [...queryKeys.guide.attendance.all(), 'stats', guideId] as const,
      documentVerification: (guideId: string) =>
        [
          ...queryKeys.guide.attendance.all(),
          'verify-documents',
          guideId,
        ] as const,
      tripSummary: (tripId: string, guideId: string) =>
        [
          ...queryKeys.guide.attendance.all(),
          'trip-summary',
          tripId,
          guideId,
        ] as const,
      earningsPreview: (tripId: string, guideId: string) =>
        [
          ...queryKeys.guide.attendance.all(),
          'earnings-preview',
          tripId,
          guideId,
        ] as const,
      nextTrip: (currentTripId: string, guideId: string) =>
        [
          ...queryKeys.guide.attendance.all(),
          'next-trip',
          currentTripId,
          guideId,
        ] as const,
    },
    trips: {
      all: () => [...queryKeys.guide.all, 'trips'] as const,
      riskAssessment: (tripId: string) =>
        [...queryKeys.guide.trips.all(), tripId, 'risk-assessment'] as const,
      destinationRisk: (tripId: string) =>
        [...queryKeys.guide.trips.all(), tripId, 'destination-risk'] as const,
      wasteLog: (tripId: string) =>
        [...queryKeys.guide.trips.all(), tripId, 'waste-log'] as const,
      waterUsage: (tripId: string) =>
        [...queryKeys.guide.trips.all(), tripId, 'water-usage'] as const,
      zoneCompliance: (tripId: string) =>
        [...queryKeys.guide.trips.all(), tripId, 'zone-compliance'] as const,
      riskTrend: (params?: {
        tripId?: string;
        days?: number;
        groupBy?: string;
      }) => [...queryKeys.guide.all, 'risk', 'trend', params] as const,
      canStart: (tripId: string) =>
        [...queryKeys.guide.trips.all(), tripId, 'can-start'] as const,
      paymentSplit: (tripId: string) =>
        [...queryKeys.guide.trips.all(), tripId, 'payment-split'] as const,
      paymentStatus: (tripId: string) =>
        [...queryKeys.guide.trips.all(), tripId, 'payment-status'] as const,
      completionStatus: (tripId: string) =>
        [...queryKeys.guide.trips.all(), tripId, 'completion-status'] as const,
      tipping: (tripId: string) =>
        [...queryKeys.guide.trips.all(), tripId, 'tipping'] as const,
      tippingStatus: (tripId: string, tippingId: string) =>
        [
          ...queryKeys.guide.trips.all(),
          tripId,
          'tipping',
          tippingId,
          'status',
        ] as const,
      engagement: {
        quiz: (tripId: string) =>
          [
            ...queryKeys.guide.trips.all(),
            tripId,
            'engagement',
            'quiz',
          ] as const,
        leaderboard: (tripId: string) =>
          [
            ...queryKeys.guide.trips.all(),
            tripId,
            'engagement',
            'leaderboard',
          ] as const,
        music: (tripId: string) =>
          [
            ...queryKeys.guide.trips.all(),
            tripId,
            'engagement',
            'music',
          ] as const,
      },
      manifest: (tripId: string) =>
        [...queryKeys.guide.trips.all(), tripId, 'manifest'] as const,
      facilityChecklist: (tripId: string) =>
        [...queryKeys.guide.trips.all(), tripId, 'facility-checklist'] as const,
      wasteLog: (tripId: string) =>
        [...queryKeys.guide.trips.all(), tripId, 'waste-log'] as const,
    },
    equipment: {
      all: () => [...queryKeys.guide.all, 'equipment'] as const,
      checklistTemplates: () =>
        [...queryKeys.guide.equipment.all(), 'checklist-templates'] as const,
    },
    wasteTypes: () => [...queryKeys.guide.all, 'waste-types'] as const,
    disposalMethods: () =>
      [...queryKeys.guide.all, 'disposal-methods'] as const,
    logistics: {
      all: () => [...queryKeys.guide.all, 'logistics'] as const,
      handover: (filters?: Record<string, unknown>) =>
        [...queryKeys.guide.logistics.all(), 'handover', filters] as const,
    },
    maps: {
      all: () => [...queryKeys.guide.all, 'maps'] as const,
      dangerZones: (lat?: number, lng?: number, radius?: number) =>
        [
          ...queryKeys.guide.maps.all(),
          'danger-zones',
          lat,
          lng,
          radius,
        ] as const,
      signalHotspots: (lat?: number, lng?: number, radius?: number) =>
        [
          ...queryKeys.guide.maps.all(),
          'signal-hotspots',
          lat,
          lng,
          radius,
        ] as const,
    },
    team: {
      all: () => [...queryKeys.guide.all, 'team'] as const,
      tripTeam: (tripId: string) =>
        [...queryKeys.guide.team.all(), 'trip', tripId] as const,
      myTeam: () => [...queryKeys.guide.team.all(), 'my-team'] as const,
      directory: {
        all: () => [...queryKeys.guide.team.all(), 'directory'] as const,
        search: (filters?: Record<string, unknown>) =>
          [...queryKeys.guide.team.directory.all(), 'search', filters] as const,
        nearby: (lat?: number, lng?: number) =>
          [
            ...queryKeys.guide.team.directory.all(),
            'nearby',
            lat,
            lng,
          ] as const,
        detail: (guideId: string) =>
          [...queryKeys.guide.team.directory.all(), 'detail', guideId] as const,
      },
      notes: {
        all: () => [...queryKeys.guide.team.all(), 'notes'] as const,
        trip: (tripId: string) =>
          [...queryKeys.guide.team.notes.all(), 'trip', tripId] as const,
      },
    },
  },

  // Admin
  admin: {
    all: ['admin'] as const,
    settings: {
      all: () => [...queryKeys.admin.all, 'settings'] as const,
      detail: (key: string) =>
        [...queryKeys.admin.settings.all(), key] as const,
    },
    compliance: {
      all: () => [...queryKeys.admin.all, 'compliance'] as const,
      dashboard: () => [...queryKeys.admin.all, 'compliance', 'dashboard'] as const,
      licenses: (filters?: Record<string, unknown>) =>
        ['admin', 'compliance', 'licenses', filters] as const,
      license: (id: string) =>
        [...queryKeys.admin.all, 'compliance', 'licenses', id] as const,
      alerts: (filters?: Record<string, unknown>) =>
        [...queryKeys.admin.all, 'compliance', 'alerts', filters] as const,
      reports: (year?: number) =>
        [...queryKeys.admin.all, 'compliance', 'reports', year] as const,
      audits: (filters?: Record<string, unknown>) =>
        [...queryKeys.admin.all, 'compliance', 'audits', filters] as const,
      auditDetail: (id: string) =>
        [...queryKeys.admin.all, 'compliance', 'audit', id] as const,
    },
    // Risk Management (ISO 31030)
    risk: {
      all: () => [...queryKeys.admin.all, 'risk'] as const,
      destinations: (filters?: Record<string, unknown>) =>
        [...queryKeys.admin.all, 'risk', 'destinations', filters] as const,
      destination: (id: string) =>
        [...queryKeys.admin.all, 'risk', 'destination', id] as const,
      advisories: (filters?: Record<string, unknown>) =>
        [...queryKeys.admin.all, 'risk', 'advisories', filters] as const,
      crisisPlans: (filters?: Record<string, unknown>) =>
        [...queryKeys.admin.all, 'risk', 'crisis-plans', filters] as const,
      crisisPlan: (id: string) =>
        [...queryKeys.admin.all, 'risk', 'crisis-plan', id] as const,
      trmMetrics: (filters?: Record<string, unknown>) =>
        [...queryKeys.admin.all, 'risk', 'trm-metrics', filters] as const,
    },
    // Sustainability (GSTC)
    sustainability: {
      all: () => [...queryKeys.admin.all, 'sustainability'] as const,
      goals: (filters?: Record<string, unknown>) =>
        [...queryKeys.admin.all, 'sustainability', 'goals', filters] as const,
      community: (filters?: Record<string, unknown>) =>
        [...queryKeys.admin.all, 'sustainability', 'community', filters] as const,
      marineZones: (filters?: Record<string, unknown>) =>
        [...queryKeys.admin.all, 'sustainability', 'marine-zones', filters] as const,
      waterUsage: (filters?: Record<string, unknown>) =>
        [...queryKeys.admin.all, 'sustainability', 'water-usage', filters] as const,
      employment: (filters?: Record<string, unknown>) =>
        [...queryKeys.admin.all, 'sustainability', 'employment', filters] as const,
    },
  },

  // Loyalty / AeroPoints
  loyalty: {
    all: ['loyalty'] as const,
    balance: (userId?: string) =>
      [...queryKeys.loyalty.all, 'balance', userId] as const,
    history: (userId?: string, page?: number) =>
      [...queryKeys.loyalty.all, 'history', userId, page] as const,
    estimate: (bookingValue?: number) =>
      [...queryKeys.loyalty.all, 'estimate', bookingValue] as const,
  },

  // Referral
  referral: {
    all: ['referral'] as const,
    code: (userId?: string) =>
      [...queryKeys.referral.all, 'code', userId] as const,
    stats: (userId?: string) =>
      [...queryKeys.referral.all, 'stats', userId] as const,
    validate: (code: string) =>
      [...queryKeys.referral.all, 'validate', code] as const,
  },

  // Corporate
  corporate: {
    all: ['corporate'] as const,
    dashboard: (corpId?: string) =>
      [...queryKeys.corporate.all, 'dashboard', corpId] as const,
    employees: {
      all: (corpId?: string) =>
        [...queryKeys.corporate.all, 'employees', corpId] as const,
      detail: (empId: string) =>
        [...queryKeys.corporate.all, 'employee', empId] as const,
      list: (corpId?: string, filters?: Record<string, unknown>) =>
        [...queryKeys.corporate.all, 'employees', corpId, 'list', filters] as const,
    },
    invoices: {
      all: (corpId?: string) =>
        [...queryKeys.corporate.all, 'invoices', corpId] as const,
      detail: (invId: string) =>
        [...queryKeys.corporate.all, 'invoice', invId] as const,
      list: (corpId?: string, filters?: Record<string, unknown>) =>
        [...queryKeys.corporate.all, 'invoices', corpId, 'list', filters] as const,
    },
    bookings: {
      all: (corpId?: string) =>
        [...queryKeys.corporate.all, 'bookings', corpId] as const,
      list: (corpId?: string, filters?: Record<string, unknown>) =>
        [...queryKeys.corporate.all, 'bookings', corpId, 'list', filters] as const,
      detail: (bookingId: string) =>
        [...queryKeys.corporate.all, 'booking', bookingId] as const,
    },
    reports: {
      all: (corpId?: string) =>
        [...queryKeys.corporate.all, 'reports', corpId] as const,
      department: (corpId?: string, period?: string) =>
        [...queryKeys.corporate.all, 'reports', corpId, 'department', period] as const,
    },
    // NEW: Approvals
    approvals: {
      all: (corpId?: string) =>
        [...queryKeys.corporate.all, 'approvals', corpId] as const,
      list: (status?: string, page?: number) =>
        [...queryKeys.corporate.all, 'approvals', 'list', status, page] as const,
      detail: (approvalId: string) =>
        [...queryKeys.corporate.all, 'approval', approvalId] as const,
      pending: (corpId?: string) =>
        [...queryKeys.corporate.all, 'approvals', corpId, 'pending'] as const,
    },
    // NEW: Packages
    packages: {
      all: () => [...queryKeys.corporate.all, 'packages'] as const,
      list: (search?: string, destination?: string, page?: number) =>
        [...queryKeys.corporate.all, 'packages', 'list', search, destination, page] as const,
      detail: (packageId: string) =>
        [...queryKeys.corporate.all, 'package', packageId] as const,
    },
    // NEW: Budget
    budget: {
      all: (corpId?: string) =>
        [...queryKeys.corporate.all, 'budget', corpId] as const,
      summary: (corpId?: string, fiscalYear?: number) =>
        [...queryKeys.corporate.all, 'budget', corpId, 'summary', fiscalYear] as const,
      departments: (corpId?: string) =>
        [...queryKeys.corporate.all, 'budget', corpId, 'departments'] as const,
    },
    // NEW: AI Assistant
    ai: {
      all: () => [...queryKeys.corporate.all, 'ai'] as const,
      context: () => [...queryKeys.corporate.all, 'ai', 'context'] as const,
      chat: (sessionId?: string) =>
        [...queryKeys.corporate.all, 'ai', 'chat', sessionId] as const,
    },
  },

  // Partner
  partner: {
    all: ['partner'] as const,
    auth: () => [...queryKeys.partner.all, 'auth'] as const,
    wallet: {
      all: () => [...queryKeys.partner.all, 'wallet'] as const,
      balance: () => [...queryKeys.partner.wallet.all(), 'balance'] as const,
      transactions: (filters?: Record<string, unknown>) =>
        [...queryKeys.partner.wallet.all(), 'transactions', filters] as const,
    },
    bookings: {
      all: () => [...queryKeys.partner.all, 'bookings'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.partner.bookings.all(), 'list', filters] as const,
      detail: (id: string) =>
        [...queryKeys.partner.bookings.all(), 'detail', id] as const,
    },
    packages: {
      all: () => [...queryKeys.partner.all, 'packages'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.partner.packages.all(), 'list', filters] as const,
      availability: (packageId: string, days?: number) =>
        [...queryKeys.partner.packages.all(), 'availability', packageId, days] as const,
    },
    notifications: {
      all: () => [...queryKeys.partner.all, 'notifications'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.partner.notifications.all(), 'list', filters] as const,
      unreadCount: () =>
        [...queryKeys.partner.notifications.all(), 'unread-count'] as const,
    },
    reports: {
      all: () => [...queryKeys.partner.all, 'reports'] as const,
      commission: (filters?: Record<string, unknown>) =>
        [...queryKeys.partner.reports.all(), 'commission', filters] as const,
    },
    analytics: {
      all: () => [...queryKeys.partner.all, 'analytics'] as const,
      dashboard: (period?: string) =>
        [...queryKeys.partner.analytics.all(), 'dashboard', period] as const,
    },
    customers: {
      all: () => [...queryKeys.partner.all, 'customers'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.partner.customers.all(), 'list', filters] as const,
      detail: (id: string) =>
        [...queryKeys.partner.customers.all(), 'detail', id] as const,
    },
    team: {
      all: () => [...queryKeys.partner.all, 'team'] as const,
      list: () => [...queryKeys.partner.team.all(), 'list'] as const,
      detail: (id: string) =>
        [...queryKeys.partner.team.all(), 'detail', id] as const,
      performance: (userId: string) =>
        [...queryKeys.partner.team.all(), 'performance', userId] as const,
    },
    support: {
      all: () => [...queryKeys.partner.all, 'support'] as const,
      tickets: {
        all: () => [...queryKeys.partner.support.all(), 'tickets'] as const,
        list: (filters?: Record<string, unknown>) =>
          [...queryKeys.partner.support.tickets.all(), 'list', filters] as const,
        detail: (id: string) =>
          [...queryKeys.partner.support.tickets.all(), 'detail', id] as const,
      },
    },
    // Referrals
    referrals: {
      all: () => [...queryKeys.partner.all, 'referrals'] as const,
      list: () => [...queryKeys.partner.all, 'referrals', 'list'] as const,
      stats: () => [...queryKeys.partner.all, 'referrals', 'stats'] as const,
    },
    // Broadcasts
    broadcasts: {
      all: () => [...queryKeys.partner.all, 'broadcasts'] as const,
      list: () => [...queryKeys.partner.all, 'broadcasts', 'list'] as const,
      stats: () => [...queryKeys.partner.all, 'broadcasts', 'stats'] as const,
      templates: () => [...queryKeys.partner.all, 'broadcasts', 'templates'] as const,
    },
    // CLV
    clv: {
      all: () => [...queryKeys.partner.all, 'clv'] as const,
      dashboard: () => [...queryKeys.partner.all, 'clv', 'dashboard'] as const,
      customers: () => [...queryKeys.partner.all, 'clv', 'customers'] as const,
    },
    // Vouchers
    vouchers: {
      all: () => [...queryKeys.partner.all, 'vouchers'] as const,
      list: () => [...queryKeys.partner.all, 'vouchers', 'list'] as const,
    },
    // Branches
    branches: {
      all: () => [...queryKeys.partner.all, 'branches'] as const,
      list: () => [...queryKeys.partner.all, 'branches', 'list'] as const,
    },
    // Contracts
    contracts: {
      all: () => [...queryKeys.partner.all, 'contracts'] as const,
      list: () => [...queryKeys.partner.all, 'contracts', 'list'] as const,
      detail: (id: string) => [...queryKeys.partner.all, 'contracts', 'detail', id] as const,
    },
    // Custom Reports
    customReports: {
      all: () => [...queryKeys.partner.all, 'custom-reports'] as const,
      list: () => [...queryKeys.partner.all, 'custom-reports', 'list'] as const,
    },
    // Market Intelligence
    marketIntel: {
      all: () => ['partner', 'market-intel'] as const,
      summary: () => ['partner', 'market-intel', 'summary'] as const,
      competitors: () => ['partner', 'market-intel', 'competitors'] as const,
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
