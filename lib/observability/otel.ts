/**
 * OpenTelemetry-Compatible Tracing
 * Sesuai PRD 2.2.D - System Support & DevOps
 *
 * Provides performance tracing with:
 * - Span creation and tracking
 * - Automatic timing measurement
 * - Error capture with stack traces
 * - Compatible with OpenTelemetry exporters when available
 */

import { logger } from '@/lib/utils/logger';

export type SpanStatus = 'ok' | 'error' | 'unset';

export type SpanContext = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
};

export type Span = {
  name: string;
  startTime: number;
  endTime?: number;
  status: SpanStatus;
  attributes: Record<string, unknown>;
  events: Array<{
    name: string;
    timestamp: number;
    attributes?: Record<string, unknown>;
  }>;
  context: SpanContext;
};

// Simple trace ID generator
function generateId(length: number = 16): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Active spans storage (using WeakMap for memory efficiency)
const activeSpans = new Map<string, Span>();

/**
 * Create a new span for tracing
 */
export function createSpan(name: string, parentSpanId?: string): Span {
  const span: Span = {
    name,
    startTime: performance.now(),
    status: 'unset',
    attributes: {},
    events: [],
    context: {
      traceId: generateId(32),
      spanId: generateId(16),
      parentSpanId,
    },
  };
  
  activeSpans.set(span.context.spanId, span);
  return span;
}

/**
 * End a span and record its duration
 */
export function endSpan(span: Span, status: SpanStatus = 'ok'): void {
  span.endTime = performance.now();
  span.status = status;
  
  const duration = span.endTime - span.startTime;
  
  // Log span completion for monitoring
  if (process.env.OTEL_ENABLED === 'true') {
    logger.debug(`[Trace] ${span.name}`, {
      traceId: span.context.traceId,
      spanId: span.context.spanId,
      duration: `${duration.toFixed(2)}ms`,
      status: span.status,
      attributes: span.attributes,
    });
  }
  
  // Clean up
  activeSpans.delete(span.context.spanId);
  
  // Export span if exporter is configured
  exportSpan(span);
}

/**
 * Add an event to a span
 */
export function addSpanEvent(
  span: Span,
  name: string,
  attributes?: Record<string, unknown>
): void {
  span.events.push({
    name,
    timestamp: performance.now(),
    attributes,
  });
}

/**
 * Set span attributes
 */
export function setSpanAttributes(
  span: Span,
  attributes: Record<string, unknown>
): void {
  span.attributes = { ...span.attributes, ...attributes };
}

/**
 * Export span to configured backend
 */
async function exportSpan(span: Span): Promise<void> {
  const exporterUrl = process.env.OTEL_EXPORTER_URL;
  if (!exporterUrl) {
    return;
  }

  try {
    await fetch(exporterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.OTEL_EXPORTER_TOKEN && {
          'Authorization': `Bearer ${process.env.OTEL_EXPORTER_TOKEN}`,
        }),
      },
      body: JSON.stringify({
        resourceSpans: [{
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: 'aero-apps' } },
              { key: 'deployment.environment', value: { stringValue: process.env.NODE_ENV } },
            ],
          },
          scopeSpans: [{
            spans: [{
              traceId: span.context.traceId,
              spanId: span.context.spanId,
              parentSpanId: span.context.parentSpanId,
              name: span.name,
              startTimeUnixNano: Math.floor(span.startTime * 1000000),
              endTimeUnixNano: span.endTime ? Math.floor(span.endTime * 1000000) : undefined,
              status: { code: span.status === 'ok' ? 1 : span.status === 'error' ? 2 : 0 },
              attributes: Object.entries(span.attributes).map(([key, value]) => ({
                key,
                value: { stringValue: String(value) },
              })),
            }],
          }],
        }],
      }),
    });
  } catch {
    // Silently fail - don't break the app for tracing issues
  }
}

/**
 * Wrap an async function with automatic tracing
 */
export async function withTracing<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, unknown>
): Promise<T> {
  const span = createSpan(name);
  
  if (attributes) {
    setSpanAttributes(span, attributes);
  }

  try {
    const result = await fn();
    endSpan(span, 'ok');
    return result;
  } catch (error) {
    addSpanEvent(span, 'exception', {
      'exception.message': error instanceof Error ? error.message : String(error),
      'exception.type': error instanceof Error ? error.name : 'Error',
      'exception.stacktrace': error instanceof Error ? error.stack : undefined,
    });
    endSpan(span, 'error');
    throw error;
  }
}

/**
 * Wrap a sync function with automatic tracing
 */
export function withTracingSync<T>(
  name: string,
  fn: () => T,
  attributes?: Record<string, unknown>
): T {
  const span = createSpan(name);
  
  if (attributes) {
    setSpanAttributes(span, attributes);
  }

  try {
    const result = fn();
    endSpan(span, 'ok');
    return result;
  } catch (error) {
    addSpanEvent(span, 'exception', {
      'exception.message': error instanceof Error ? error.message : String(error),
      'exception.type': error instanceof Error ? error.name : 'Error',
    });
    endSpan(span, 'error');
    throw error;
  }
}

/**
 * Higher-order function to trace API routes
 */
export function traceApiRoute(routeName: string) {
  return <T>(fn: () => Promise<T>): Promise<T> => {
    return withTracing(`api.${routeName}`, fn, {
      'http.route': routeName,
    });
  };
}

/**
 * Decorator-style function for tracing class methods
 */
export function traced(name?: string) {
  return function <T extends (...args: unknown[]) => Promise<unknown>>(
    _target: unknown,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value;
    if (!originalMethod) return descriptor;

    descriptor.value = async function (...args: unknown[]) {
      return withTracing(name || propertyKey, () => originalMethod.apply(this, args));
    } as T;

    return descriptor;
  };
}
