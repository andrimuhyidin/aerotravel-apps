/**
 * Unit Tests: Offline Sync Logic
 * Tests for mutation queue, backoff, conflict resolution
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Types for mutation queue
type MutationStatus = 'pending' | 'processing' | 'completed' | 'failed';

type QueuedMutation = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: MutationStatus;
  retryCount: number;
  createdAt: number;
  lastAttemptAt?: number;
  error?: string;
};

type ConflictResolution = 'client_wins' | 'server_wins' | 'merge' | 'manual';

// Mock implementations
const createMutationId = (): string => {
  return `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const addToQueue = (
  queue: QueuedMutation[],
  type: string,
  payload: Record<string, unknown>
): QueuedMutation => {
  const mutation: QueuedMutation = {
    id: createMutationId(),
    type,
    payload,
    status: 'pending',
    retryCount: 0,
    createdAt: Date.now(),
  };
  queue.push(mutation);
  return mutation;
};

const calculateBackoffDelay = (retryCount: number, baseDelay = 1000, maxDelay = 32000): number => {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s (max)
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  // Add jitter (±10%)
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
};

const shouldRetry = (mutation: QueuedMutation, maxRetries = 5): boolean => {
  return mutation.retryCount < maxRetries && mutation.status === 'failed';
};

const processMutation = async (
  mutation: QueuedMutation,
  processor: (type: string, payload: Record<string, unknown>) => Promise<boolean>
): Promise<QueuedMutation> => {
  mutation.status = 'processing';
  mutation.lastAttemptAt = Date.now();

  try {
    const success = await processor(mutation.type, mutation.payload);
    if (success) {
      mutation.status = 'completed';
    } else {
      throw new Error('Processor returned false');
    }
  } catch (error) {
    mutation.status = 'failed';
    mutation.retryCount += 1;
    mutation.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return mutation;
};

const detectConflict = (
  localData: { updatedAt: number; version: number },
  serverData: { updatedAt: number; version: number }
): { hasConflict: boolean; localNewer: boolean } => {
  const hasConflict = localData.version !== serverData.version;
  const localNewer = localData.updatedAt > serverData.updatedAt;
  return { hasConflict, localNewer };
};

const resolveConflict = (
  localData: Record<string, unknown>,
  serverData: Record<string, unknown>,
  strategy: ConflictResolution
): Record<string, unknown> => {
  switch (strategy) {
    case 'client_wins':
      return { ...serverData, ...localData };
    case 'server_wins':
      return { ...localData, ...serverData };
    case 'merge':
      // Deep merge, preferring non-null values
      const merged = { ...localData };
      for (const key of Object.keys(serverData)) {
        if (localData[key] === null || localData[key] === undefined) {
          merged[key] = serverData[key];
        }
      }
      return merged;
    case 'manual':
    default:
      throw new Error('Manual resolution required');
  }
};

const getQueueStats = (queue: QueuedMutation[]): {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
} => {
  return {
    pending: queue.filter(m => m.status === 'pending').length,
    processing: queue.filter(m => m.status === 'processing').length,
    completed: queue.filter(m => m.status === 'completed').length,
    failed: queue.filter(m => m.status === 'failed').length,
    total: queue.length,
  };
};

describe('Mutation Queue Operations', () => {
  let queue: QueuedMutation[];

  beforeEach(() => {
    queue = [];
  });

  it('should add mutation to queue', () => {
    const mutation = addToQueue(queue, 'check_in', { tripId: 'trip-001' });

    expect(queue).toHaveLength(1);
    expect(mutation.type).toBe('check_in');
    expect(mutation.status).toBe('pending');
    expect(mutation.retryCount).toBe(0);
  });

  it('should generate unique mutation ids', () => {
    const m1 = addToQueue(queue, 'check_in', {});
    const m2 = addToQueue(queue, 'check_in', {});

    expect(m1.id).not.toBe(m2.id);
  });

  it('should preserve payload in mutation', () => {
    const payload = { tripId: 'trip-001', latitude: -8.67, longitude: 115.26 };
    const mutation = addToQueue(queue, 'location_update', payload);

    expect(mutation.payload).toEqual(payload);
  });

  it('should track queue statistics', () => {
    addToQueue(queue, 'a', {});
    addToQueue(queue, 'b', {});
    queue[0]!.status = 'completed';

    const stats = getQueueStats(queue);

    expect(stats.total).toBe(2);
    expect(stats.pending).toBe(1);
    expect(stats.completed).toBe(1);
  });
});

describe('Backoff Delay Calculation', () => {
  it('should return base delay for first retry', () => {
    const delay = calculateBackoffDelay(0);
    
    // Should be close to 1000 (±10% jitter)
    expect(delay).toBeGreaterThanOrEqual(900);
    expect(delay).toBeLessThanOrEqual(1100);
  });

  it('should double delay for each retry', () => {
    const d0 = calculateBackoffDelay(0, 1000, 32000);
    const d1 = calculateBackoffDelay(1, 1000, 32000);
    const d2 = calculateBackoffDelay(2, 1000, 32000);

    // With jitter, approximate comparison
    expect(d1 / d0).toBeCloseTo(2, 0);
    expect(d2 / d1).toBeCloseTo(2, 0);
  });

  it('should respect maximum delay', () => {
    const delay = calculateBackoffDelay(10, 1000, 32000); // Would be 1024s without cap

    expect(delay).toBeLessThanOrEqual(32000 * 1.1); // Max + jitter
  });

  it('should use custom base delay', () => {
    const delay = calculateBackoffDelay(0, 500);

    expect(delay).toBeGreaterThanOrEqual(450);
    expect(delay).toBeLessThanOrEqual(550);
  });
});

describe('Retry Logic', () => {
  it('should allow retry when under max retries', () => {
    const mutation: QueuedMutation = {
      id: 'test',
      type: 'test',
      payload: {},
      status: 'failed',
      retryCount: 2,
      createdAt: Date.now(),
    };

    expect(shouldRetry(mutation, 5)).toBe(true);
  });

  it('should not retry when at max retries', () => {
    const mutation: QueuedMutation = {
      id: 'test',
      type: 'test',
      payload: {},
      status: 'failed',
      retryCount: 5,
      createdAt: Date.now(),
    };

    expect(shouldRetry(mutation, 5)).toBe(false);
  });

  it('should not retry completed mutations', () => {
    const mutation: QueuedMutation = {
      id: 'test',
      type: 'test',
      payload: {},
      status: 'completed',
      retryCount: 0,
      createdAt: Date.now(),
    };

    expect(shouldRetry(mutation, 5)).toBe(false);
  });

  it('should not retry pending mutations', () => {
    const mutation: QueuedMutation = {
      id: 'test',
      type: 'test',
      payload: {},
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
    };

    expect(shouldRetry(mutation, 5)).toBe(false);
  });
});

describe('Mutation Processing', () => {
  it('should mark mutation as completed on success', async () => {
    const mutation: QueuedMutation = {
      id: 'test',
      type: 'check_in',
      payload: {},
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
    };

    const processor = vi.fn().mockResolvedValue(true);
    const result = await processMutation(mutation, processor);

    expect(result.status).toBe('completed');
    expect(processor).toHaveBeenCalledWith('check_in', {});
  });

  it('should mark mutation as failed on error', async () => {
    const mutation: QueuedMutation = {
      id: 'test',
      type: 'check_in',
      payload: {},
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
    };

    const processor = vi.fn().mockRejectedValue(new Error('Network error'));
    const result = await processMutation(mutation, processor);

    expect(result.status).toBe('failed');
    expect(result.retryCount).toBe(1);
    expect(result.error).toBe('Network error');
  });

  it('should increment retry count on failure', async () => {
    const mutation: QueuedMutation = {
      id: 'test',
      type: 'check_in',
      payload: {},
      status: 'pending',
      retryCount: 2,
      createdAt: Date.now(),
    };

    const processor = vi.fn().mockRejectedValue(new Error('Error'));
    await processMutation(mutation, processor);

    expect(mutation.retryCount).toBe(3);
  });

  it('should update lastAttemptAt', async () => {
    const mutation: QueuedMutation = {
      id: 'test',
      type: 'check_in',
      payload: {},
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now() - 1000,
    };

    const before = Date.now();
    const processor = vi.fn().mockResolvedValue(true);
    await processMutation(mutation, processor);

    expect(mutation.lastAttemptAt).toBeGreaterThanOrEqual(before);
  });
});

describe('Conflict Detection', () => {
  it('should detect conflict when versions differ', () => {
    const result = detectConflict(
      { updatedAt: 1000, version: 2 },
      { updatedAt: 900, version: 1 }
    );

    expect(result.hasConflict).toBe(true);
    expect(result.localNewer).toBe(true);
  });

  it('should not detect conflict when versions match', () => {
    const result = detectConflict(
      { updatedAt: 1000, version: 1 },
      { updatedAt: 1000, version: 1 }
    );

    expect(result.hasConflict).toBe(false);
  });

  it('should detect local newer correctly', () => {
    const result = detectConflict(
      { updatedAt: 1000, version: 2 },
      { updatedAt: 1100, version: 1 }
    );

    expect(result.hasConflict).toBe(true);
    expect(result.localNewer).toBe(false);
  });
});

describe('Conflict Resolution', () => {
  const localData = { name: 'Local Name', email: 'local@test.com', phone: null };
  const serverData = { name: 'Server Name', email: 'server@test.com', phone: '1234567890' };

  it('should apply client_wins strategy', () => {
    const result = resolveConflict(localData, serverData, 'client_wins');

    expect(result.name).toBe('Local Name');
    expect(result.email).toBe('local@test.com');
  });

  it('should apply server_wins strategy', () => {
    const result = resolveConflict(localData, serverData, 'server_wins');

    expect(result.name).toBe('Server Name');
    expect(result.email).toBe('server@test.com');
  });

  it('should apply merge strategy', () => {
    const result = resolveConflict(localData, serverData, 'merge');

    expect(result.name).toBe('Local Name'); // Local non-null value preserved
    expect(result.phone).toBe('1234567890'); // Server value used for null local
  });

  it('should throw for manual resolution', () => {
    expect(() => {
      resolveConflict(localData, serverData, 'manual');
    }).toThrow('Manual resolution required');
  });
});

describe('Status Transitions', () => {
  it('should transition from pending to processing', async () => {
    const mutation: QueuedMutation = {
      id: 'test',
      type: 'test',
      payload: {},
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
    };

    // During processing, status should be 'processing'
    let capturedStatus: MutationStatus | undefined;
    const processor = vi.fn().mockImplementation(async () => {
      capturedStatus = mutation.status;
      return true;
    });

    await processMutation(mutation, processor);

    expect(capturedStatus).toBe('processing');
    expect(mutation.status).toBe('completed');
  });
});

