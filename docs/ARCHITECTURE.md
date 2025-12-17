# System Architecture

## Overview

MyAeroTravel ID is built on a **Serverless First, Edge Native, Offline-First, AI-Native** architecture.

## Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[Next.js App] --> B[PWA Service Worker]
        A --> C[React Components]
    end
    
    subgraph "Edge Layer"
        D[Vercel Edge] --> E[API Routes]
        E --> F[Middleware]
    end
    
    subgraph "Data Layer"
        G[Supabase PostgreSQL] --> H[pgvector]
        I[Supabase Storage] --> J[Object Storage]
        K[Upstash Redis] --> L[Rate Limiting]
    end
    
    subgraph "AI Layer"
        M[DeepSeek V3.2] --> N[Chat Logic]
        O[Vision AI] --> P[OCR Processing]
        Q[RAG System] --> R[Vector Search]
    end
    
    subgraph "External Services"
        S[Midtrans] --> T[Payment Gateway]
        U[Resend] --> V[Email Service]
        W[WAHA] --> X[WhatsApp API]
    end
    
    A --> D
    E --> G
    E --> I
    E --> K
    E --> M
    E --> O
    E --> Q
    E --> S
    E --> U
    E --> W
    
    style A fill:#3b82f6
    style G fill:#10b981
    style M fill:#f59e0b
    style S fill:#ef4444
```

## Data Flow

### Offline-First Flow (Guide App)

```mermaid
sequenceDiagram
    participant G as Guide App
    participant IDB as IndexedDB
    participant Q as Mutation Queue
    participant API as Sync API
    participant DB as Supabase
    
    G->>IDB: Pre-load Trip Data
    G->>IDB: Save Offline Actions
    G->>Q: Queue Mutations
    Note over G,DB: Offline Mode
    G->>API: Auto-sync on Online
    API->>DB: Process Mutations
    DB-->>API: Sync Results
    API-->>G: Update Status
```

### AI Automation Flow (AeroBot)

```mermaid
sequenceDiagram
    participant U as User
    participant WA as WAHA
    participant RL as Rate Limiter
    participant AI as DeepSeek
    participant RAG as RAG System
    participant DB as Supabase
    
    U->>WA: Send Message
    WA->>RL: Check Rate Limit
    RL-->>WA: Allowed
    WA->>AI: Process Message
    AI->>RAG: Retrieve Context
    RAG->>DB: Vector Search
    DB-->>RAG: Relevant Docs
    RAG-->>AI: Context
    AI-->>WA: Generate Response
    WA-->>U: Send Reply
```

## Technology Stack

### Core Application Layer
- **Framework:** Next.js 14.2.35+ (App Router)
- **Language:** TypeScript (Strict Mode)
- **PWA:** Serwist
- **State:** TanStack Query v5.59.5 + Zustand v5.0.x
- **Forms:** React Hook Form + Zod
- **UI:** Shadcn UI + Tailwind CSS

### Data & Intelligence Layer
- **Database:** Supabase PostgreSQL + pgvector
- **Storage:** Supabase Storage
- **AI Logic:** DeepSeek-V3.2
- **AI Vision:** DeepSeek-OCR / Gemini Flash
- **Rate Limiting:** Upstash Redis

### Infrastructure
- **Hosting:** Vercel (Edge Network)
- **WhatsApp:** WAHA (Self-Hosted Docker)
- **Payment:** Midtrans
- **Email:** Resend
- **DNS/WAF:** Cloudflare

### Observability
- **Error Tracking:** Sentry
- **Analytics:** PostHog + GA4
- **Logging:** OpenTelemetry
- **Testing:** Playwright

## Security Architecture

### Multi-Tenancy
- Branch-based isolation using `branch_id`
- Row Level Security (RLS) policies
- Feature flags for gradual rollout

### Authentication & Authorization
- Supabase Auth (JWT-based)
- Role-based access control (RBAC)
- Middleware for route protection

### Data Protection
- Input sanitization
- SQL injection prevention (parameterized queries)
- XSS prevention
- Rate limiting on APIs

## Scalability Strategy

### Horizontal Scaling
- Serverless functions (Vercel)
- Edge network distribution
- Database connection pooling (Supavisor)

### Performance Optimization
- ISR for SEO pages
- Image optimization (next/image)
- Code splitting
- Bundle optimization

## Deployment Architecture

```mermaid
graph LR
    A[GitHub] --> B[CI/CD Pipeline]
    B --> C[Build & Test]
    C --> D[Vercel Deployment]
    D --> E[Edge Network]
    E --> F[Global Users]
    
    G[Docker Compose] --> H[Local Dev]
    H --> I[PostgreSQL]
    H --> J[Redis]
    H --> K[WAHA]
```

## Monitoring & Observability

- **Error Tracking:** Sentry (Real-time error monitoring)
- **Analytics:** PostHog (User journey, funnels)
- **Web Analytics:** GA4 (Traffic, conversions)
- **Performance:** OpenTelemetry (Tracing, metrics)
- **Health Checks:** `/api/health` endpoint

