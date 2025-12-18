/**
 * Mobile Route Group Layout
 * Simple wrapper - specific layouts handled by child routes
 */

import React from 'react';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
