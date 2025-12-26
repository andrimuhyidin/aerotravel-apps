/**
 * Type guard utilities for handling unknown types safely
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isRecord(obj) && key in obj;
}

export function getProperty<T = unknown>(
  obj: unknown,
  key: string,
  defaultValue?: T
): T {
  if (hasProperty(obj, key)) {
    return obj[key] as T;
  }
  return defaultValue as T;
}

export function assertRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error('Value is not a record');
  }
  return value;
}

