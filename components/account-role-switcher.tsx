/**
 * Account Role Switcher Wrapper
 * Client component wrapper untuk RoleSwitcher di account page
 */

'use client';

import { RoleSwitcher } from '@/components/role-switcher';

type AccountRoleSwitcherProps = {
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
};

export function AccountRoleSwitcher({
  size = 'sm',
  variant = 'outline',
  className,
}: AccountRoleSwitcherProps) {
  return <RoleSwitcher size={size} variant={variant} className={className} />;
}
