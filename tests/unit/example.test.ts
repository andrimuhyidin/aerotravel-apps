/**
 * Example Unit Test
 * Test business logic in isolation
 */

import { describe, it, expect } from 'vitest';

describe('Example Unit Test', () => {
  it('should pass basic math', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const str = 'Hello';
    expect(str.toUpperCase()).toBe('HELLO');
  });
});

