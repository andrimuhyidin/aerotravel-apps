/**
 * Health Check Endpoint
 * Sesuai Enterprise Best Practices - Monitoring & Observability
 * 
 * Returns system health status for monitoring tools
 */

import 'server-only';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

interface HealthCheck {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: HealthStatus;
      responseTime?: number;
      error?: string;
    };
    redis?: {
      status: HealthStatus;
      responseTime?: number;
      error?: string;
    };
  };
  version: string;
}

const startTime = Date.now();

export async function GET() {
  const health: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    services: {
      database: {
        status: 'unhealthy',
      },
    },
    version: process.env.npm_package_version || '0.1.0',
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    const supabase = await createClient();
    // Use a real table for health check (branches is lightweight)
    const { error } = await supabase.from('branches').select('id').limit(1);
    const dbTime = Date.now() - dbStart;

    if (error) {
      health.services.database = {
        status: 'unhealthy',
        responseTime: dbTime,
        error: error.message,
      };
      health.status = 'unhealthy';
    } else {
      health.services.database = {
        status: 'healthy',
        responseTime: dbTime,
      };
    }
  } catch (error) {
    health.services.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    health.status = 'unhealthy';
  }

  // Check Redis (optional, if available)
  // TODO: Add Redis health check if needed

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}

