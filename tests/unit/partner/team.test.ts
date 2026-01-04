/**
 * Unit Tests: Partner Team API
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const createTeamMemberSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10).optional().nullable(),
  role: z.enum(['admin', 'staff', 'viewer']),
  permissions: z.array(z.string()).optional(),
});

describe('Team API Validation', () => {
  describe('createTeamMemberSchema', () => {
    it('should validate valid team member', () => {
      const validData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'staff' as const,
      };
      const result = createTeamMemberSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate team member with all fields', () => {
      const validData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '081234567890',
        role: 'admin' as const,
        permissions: ['bookings:create', 'customers:view', 'reports:export'],
      };
      const result = createTeamMemberSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const invalidData = {
        name: 'J',
        email: 'jane@example.com',
        role: 'staff' as const,
      };
      const result = createTeamMemberSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'Jane Doe',
        email: 'not-an-email',
        role: 'staff' as const,
      };
      const result = createTeamMemberSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const invalidData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'super_admin', // not in enum
      };
      const result = createTeamMemberSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid roles', () => {
      const roles = ['admin', 'staff', 'viewer'] as const;
      for (const role of roles) {
        const validData = {
          name: 'Jane Doe',
          email: 'jane@example.com',
          role,
        };
        const result = createTeamMemberSchema.safeParse(validData);
        expect(result.success).toBe(true);
      }
    });
  });
});

describe('Permission Logic', () => {
  const rolePermissions = {
    admin: ['bookings:*', 'customers:*', 'reports:*', 'team:view'],
    staff: ['bookings:create', 'bookings:view', 'customers:view', 'customers:create'],
    viewer: ['bookings:view', 'customers:view', 'reports:view'],
  };

  function hasPermission(role: keyof typeof rolePermissions, permission: string): boolean {
    const permissions = rolePermissions[role];
    return permissions.some(p => {
      if (p.endsWith(':*')) {
        const prefix = p.replace(':*', '');
        return permission.startsWith(prefix);
      }
      return p === permission;
    });
  }

  it('should allow admin to do anything', () => {
    expect(hasPermission('admin', 'bookings:create')).toBe(true);
    expect(hasPermission('admin', 'bookings:delete')).toBe(true);
    expect(hasPermission('admin', 'customers:edit')).toBe(true);
  });

  it('should limit staff permissions', () => {
    expect(hasPermission('staff', 'bookings:create')).toBe(true);
    expect(hasPermission('staff', 'bookings:view')).toBe(true);
    expect(hasPermission('staff', 'team:view')).toBe(false);
  });

  it('should limit viewer permissions', () => {
    expect(hasPermission('viewer', 'bookings:view')).toBe(true);
    expect(hasPermission('viewer', 'bookings:create')).toBe(false);
    expect(hasPermission('viewer', 'reports:view')).toBe(true);
  });
});

