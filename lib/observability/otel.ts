/**
 * OpenTelemetry Setup untuk Performance Tracing
 * Sesuai PRD 2.2.D - System Support & DevOps
 * 
 * Note: @vercel/otel v0.1.0 doesn't export trace, using simple wrapper for now
 */

export function withTracing<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  // Simple wrapper without actual tracing for now
  // TODO: Implement proper tracing when @vercel/otel is updated
  return fn();
}

/**
 * Helper untuk trace API routes
 */
export function traceApiRoute(routeName: string) {
  // Placeholder for now
  return (fn: () => Promise<unknown>) => fn();
}
